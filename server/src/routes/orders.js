const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { requireRole } = require('../middleware/auth');

// 送出訂單（訂單登記者/訪客皆可送出，將資料存入資料庫）
// 需求：送出訂單時必須填上自己的名字與備註
router.post('/', async (req, res) => {
  try {
    const { registrantName, registrantPhone, notes, items } = req.body;

    if (!registrantName || !registrantName.trim()) {
      return res.status(400).json({ error: '訂單登記者姓名為必填' });
    }

    if (!notes || !notes.trim()) {
      return res.status(400).json({ error: '訂單備註為必填' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: '請至少選擇一項欲登記的物品' });
    }

    // 驗證欲訂購的物品是否存在且開放
    const itemIds = items.map(i => i.itemId);
    const existingItems = await prisma.item.findMany({
      where: { id: { in: itemIds } }
    });

    if (existingItems.length !== itemIds.length) {
      return res.status(400).json({ error: '部分選取的物品不存在或已下架' });
    }

    // 建立訂單與訂單細項 (使用資料庫交易 Transaction)
    const newOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          registrantName: registrantName.trim(),
          registrantPhone: registrantPhone ? registrantPhone.trim() : null,
          notes: notes.trim(),
          status: 'PENDING',
          userId: req.user ? req.user.id : null,
          orderItems: {
            create: items.map(item => ({
              itemId: item.itemId,
              quantity: Math.max(1, parseInt(item.quantity, 10) || 1)
            }))
          }
        },
        include: {
          orderItems: {
            include: {
              item: {
                select: { id: true, name: true, imageUrl: true }
              }
            }
          }
        }
      });
      return order;
    });

    res.status(201).json({
      message: '訂單已成功送出！',
      order: newOrder
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: '送出訂單失敗: ' + err.message });
  }
});

// 查詢訂單列表
// - 倉庫管理者 / 系統管理員：可以查詢所有訂單
// - 登入的一般訪客：僅能查詢自己送出的訂單
router.get('/', async (req, res) => {
  try {
    const isManagerOrAdmin = req.user && ['ADMIN', 'WAREHOUSE_MGR'].includes(req.user.role);

    const where = {};
    if (!isManagerOrAdmin) {
      if (!req.user) {
        return res.status(401).json({ error: '訪客請登入後查看歷史訂單，或由倉庫管理者查詢' });
      }
      where.userId = req.user.id;
    }

    // 支援狀態篩選
    if (req.query.status) {
      where.status = req.query.status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        orderItems: {
          include: {
            item: {
              select: { id: true, name: true, imageUrl: true, quantity: true, warehouse: { select: { name: true } } }
            }
          }
        },
        user: {
          select: { username: true, fullName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(orders);
  } catch (err) {
    console.error('Fetch orders error:', err);
    res.status(500).json({ error: '取得訂單資料失敗' });
  }
});

// 查詢單一訂單明細
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const isManagerOrAdmin = req.user && ['ADMIN', 'WAREHOUSE_MGR'].includes(req.user.role);

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            item: {
              include: { warehouse: true }
            }
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: '查無此訂單' });
    }

    if (!isManagerOrAdmin && order.userId !== req.user?.id) {
      return res.status(403).json({ error: '無權限查看此訂單' });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: '取得訂單明細失敗' });
  }
});

// 更新訂單狀態（限倉庫管理員與系統管理員）
router.patch('/:id/status', requireRole('ADMIN', 'WAREHOUSE_MGR'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ error: '無效的訂單狀態' });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status }
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: '更新訂單狀態失敗' });
  }
});

module.exports = router;
