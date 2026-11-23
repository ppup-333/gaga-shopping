const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { requireRole } = require('../middleware/auth');

// 僅系統管理員可以執行資料庫一鍵匯出與還原
router.use(requireRole('ADMIN'));

// 匯出全部資料為 JSON 檔案 (供手動備份或排程抓取)
router.get('/export', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    const warehouses = await prisma.warehouse.findMany();
    const items = await prisma.item.findMany();
    const orders = await prisma.order.findMany();
    const orderItems = await prisma.orderItem.findMany();

    const dumpData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      data: {
        users,
        warehouses,
        items,
        orders,
        orderItems
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=gaga_backup_${Date.now()}.json`);
    res.send(JSON.stringify(dumpData, null, 2));
  } catch (err) {
    console.error('Backup export error:', err);
    res.status(500).json({ error: '資料庫匯出失敗: ' + err.message });
  }
});

// 從 JSON 備份檔還原全部資料 (災難復原時可一鍵將舊資料灌入新資料庫)
router.post('/import', async (req, res) => {
  try {
    const { data } = req.body;
    if (!data || !data.warehouses) {
      return res.status(400).json({ error: '無效的備份檔案格式' });
    }

    await prisma.$transaction(async (tx) => {
      // 1. 依序清空或整併（若需要覆蓋）
      // 匯入使用者
      if (data.users && data.users.length > 0) {
        for (const u of data.users) {
          await tx.user.upsert({
            where: { id: u.id },
            update: { fullName: u.fullName, role: u.role, password: u.password },
            create: { id: u.id, username: u.username, password: u.password, fullName: u.fullName, role: u.role }
          });
        }
      }

      // 匯入倉庫
      if (data.warehouses && data.warehouses.length > 0) {
        for (const w of data.warehouses) {
          await tx.warehouse.upsert({
            where: { id: w.id },
            update: { name: w.name, location: w.location, description: w.description },
            create: { id: w.id, name: w.name, location: w.location, description: w.description }
          });
        }
      }

      // 匯入物品
      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          await tx.item.upsert({
            where: { id: item.id },
            update: {
              name: item.name,
              sku: item.sku,
              description: item.description,
              quantity: item.quantity,
              imageUrl: item.imageUrl,
              isPublic: item.isPublic,
              warehouseId: item.warehouseId
            },
            create: {
              id: item.id,
              name: item.name,
              sku: item.sku,
              description: item.description,
              quantity: item.quantity,
              imageUrl: item.imageUrl,
              isPublic: item.isPublic,
              warehouseId: item.warehouseId
            }
          });
        }
      }

      // 匯入訂單
      if (data.orders && data.orders.length > 0) {
        for (const o of data.orders) {
          await tx.order.upsert({
            where: { id: o.id },
            update: {
              registrantName: o.registrantName,
              registrantPhone: o.registrantPhone,
              notes: o.notes,
              status: o.status,
              userId: o.userId
            },
            create: {
              id: o.id,
              registrantName: o.registrantName,
              registrantPhone: o.registrantPhone,
              notes: o.notes,
              status: o.status,
              userId: o.userId,
              createdAt: new Date(o.createdAt)
            }
          });
        }
      }

      // 匯入訂單細項
      if (data.orderItems && data.orderItems.length > 0) {
        for (const oi of data.orderItems) {
          await tx.orderItem.upsert({
            where: { id: oi.id },
            update: { quantity: oi.quantity },
            create: {
              id: oi.id,
              orderId: oi.orderId,
              itemId: oi.itemId,
              quantity: oi.quantity
            }
          });
        }
      }
    });

    res.json({ message: '資料庫備份還原成功！所有資料已更新。' });
  } catch (err) {
    console.error('Backup import error:', err);
    res.status(500).json({ error: '還原失敗: ' + err.message });
  }
});

module.exports = router;
