const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const prisma = require('../db');
const { requireRole } = require('../middleware/auth');

// 僅系統管理員可以管理使用者帳號
router.use(requireRole('ADMIN'));

// 取得所有使用者
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: '無法取得使用者清單' });
  }
});

// 新增使用者 (管理員可指定任何角色)
router.post('/', async (req, res) => {
  try {
    const { username, password, fullName, role } = req.body;
    if (!username || !password || !fullName || !role) {
      return res.status(400).json({ error: '所有欄位皆為必填' });
    }

    if (!['ADMIN', 'WAREHOUSE_MGR', 'REGISTRANT'].includes(role)) {
      return res.status(400).json({ error: '無效的角色類型' });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return res.status(400).json({ error: '帳號名稱已存在' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        fullName,
        role
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        createdAt: true
      }
    });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: '新增使用者失敗' });
  }
});

// 更新使用者資料 (密碼選填、角色變更、姓名變更)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, role, password } = req.body;

    const data = {};
    if (fullName) data.fullName = fullName;
    if (role) {
      if (!['ADMIN', 'WAREHOUSE_MGR', 'REGISTRANT'].includes(role)) {
        return res.status(400).json({ error: '無效的角色類型' });
      }
      data.role = role;
    }
    if (password && password.trim()) {
      data.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        updatedAt: true
      }
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: '更新使用者失敗' });
  }
});

// 刪除使用者
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) {
      return res.status(400).json({ error: '無法刪除自己當前登入的帳號' });
    }

    await prisma.user.delete({ where: { id } });
    res.json({ message: '使用者已成功刪除' });
  } catch (err) {
    res.status(500).json({ error: '刪除使用者失敗' });
  }
});

module.exports = router;
