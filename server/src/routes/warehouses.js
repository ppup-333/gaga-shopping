const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { requireRole } = require('../middleware/auth');

// 取得所有倉庫（倉庫管理者與系統管理員皆可讀取，用於物品歸檔與統計）
router.get('/', async (req, res) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      include: {
        _count: {
          select: { items: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(warehouses);
  } catch (err) {
    res.status(500).json({ error: '取得倉庫列表失敗' });
  }
});

// 以下倉庫新增/修改/刪除僅限「系統管理員」
router.post('/', requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, location, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: '倉庫名稱為必填' });
    }

    const warehouse = await prisma.warehouse.create({
      data: { name, location, description }
    });
    res.status(201).json(warehouse);
  } catch (err) {
    res.status(500).json({ error: '新增倉庫失敗' });
  }
});

router.put('/:id', requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, description } = req.body;

    const updated = await prisma.warehouse.update({
      where: { id },
      data: { name, location, description }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: '更新倉庫失敗' });
  }
});

router.delete('/:id', requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.warehouse.delete({ where: { id } });
    res.json({ message: '倉庫已成功刪除' });
  } catch (err) {
    res.status(500).json({ error: '刪除倉庫失敗，可能該倉庫內尚有物品' });
  }
});

module.exports = router;
