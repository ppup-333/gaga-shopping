const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { requireRole } = require('../middleware/auth');

// 統計各倉庫庫存量與全站指標（限倉庫管理員與系統管理員）
router.get('/', requireRole('ADMIN', 'WAREHOUSE_MGR'), async (req, res) => {
  try {
    // 總物品數量、總庫存量
    const totalItems = await prisma.item.count();
    const inventorySum = await prisma.item.aggregate({
      _sum: { quantity: true }
    });

    // 總倉庫數
    const totalWarehouses = await prisma.warehouse.count();

    // 待處理訂單數
    const pendingOrders = await prisma.order.count({
      where: { status: 'PENDING' }
    });

    // 各倉庫統計細項
    const warehouses = await prisma.warehouse.findMany({
      include: {
        items: {
          select: { id: true, name: true, quantity: true, isPublic: true }
        }
      }
    });

    const warehouseStats = warehouses.map(w => {
      const itemCount = w.items.length;
      const totalStock = w.items.reduce((sum, item) => sum + item.quantity, 0);
      const publicItemCount = w.items.filter(item => item.isPublic).length;

      return {
        id: w.id,
        name: w.name,
        location: w.location,
        itemCount,
        totalStock,
        publicItemCount
      };
    });

    res.json({
      summary: {
        totalWarehouses,
        totalItems,
        totalStock: inventorySum._sum.quantity || 0,
        pendingOrders
      },
      warehouseStats
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: '取得統計資料失敗' });
  }
});

module.exports = router;
