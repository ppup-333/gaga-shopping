const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { requireRole } = require('../middleware/auth');
const { upload, uploadImage } = require('../services/storage');

// 取得物品清單
// - 訪客/訂單登記者：僅能看到開放 (isPublic: true) 的物品資訊 (品名、圖片、庫存量)
// - 倉庫管理員/系統管理員：可看到所有倉庫的所有物品 (含是否開放設定)
router.get('/', async (req, res) => {
  try {
    const isManagerOrAdmin = req.user && ['ADMIN', 'WAREHOUSE_MGR'].includes(req.user.role);
    const { warehouseId, search } = req.query;

    const where = {};
    if (!isManagerOrAdmin) {
      where.isPublic = true;
    } else if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const items = await prisma.item.findMany({
      where,
      include: {
        warehouse: {
          select: { id: true, name: true, location: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 若非管理者，過濾敏感或內部欄位，僅回傳訂單登記者所需資訊
    if (!isManagerOrAdmin) {
      const publicItems = items.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        imageUrl: item.imageUrl,
        quantity: item.quantity,
        warehouseName: item.warehouse?.name
      }));
      return res.json(publicItems);
    }

    res.json(items);
  } catch (err) {
    console.error('Fetch items error:', err);
    res.status(500).json({ error: '無法取得物品清單' });
  }
});

// 單一物品詳情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const isManagerOrAdmin = req.user && ['ADMIN', 'WAREHOUSE_MGR'].includes(req.user.role);

    const item = await prisma.item.findUnique({
      where: { id },
      include: { warehouse: true }
    });

    if (!item) {
      return res.status(404).json({ error: '找不到該物品' });
    }

    if (!isManagerOrAdmin && !item.isPublic) {
      return res.status(403).json({ error: '此物品目前未公開' });
    }

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: '取得物品資料失敗' });
  }
});

// 新增物品（限倉庫管理員與系統管理員）
// 支援手機相機拍照/照片檔案上傳 (multipart/form-data)
router.post('/', requireRole('ADMIN', 'WAREHOUSE_MGR'), upload.single('image'), async (req, res) => {
  try {
    const { name, sku, description, quantity, warehouseId, isPublic } = req.body;

    if (!name || !warehouseId) {
      return res.status(400).json({ error: '物品名稱與所屬倉庫為必填' });
    }

    let imageUrl = req.body.imageUrl || null;
    if (req.file) {
      imageUrl = await uploadImage(req.file.buffer, req.file.mimetype);
    }

    const item = await prisma.item.create({
      data: {
        name,
        sku: sku || null,
        description: description || null,
        quantity: parseInt(quantity, 10) || 0,
        imageUrl,
        isPublic: isPublic === 'true' || isPublic === true,
        warehouseId
      },
      include: { warehouse: true }
    });

    res.status(201).json(item);
  } catch (err) {
    console.error('Create item error:', err);
    res.status(500).json({ error: '新增物品失敗: ' + err.message });
  }
});

// 更新物品資訊
router.put('/:id', requireRole('ADMIN', 'WAREHOUSE_MGR'), upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sku, description, quantity, warehouseId, isPublic } = req.body;

    const data = {};
    if (name) data.name = name;
    if (sku !== undefined) data.sku = sku;
    if (description !== undefined) data.description = description;
    if (quantity !== undefined) data.quantity = parseInt(quantity, 10);
    if (warehouseId) data.warehouseId = warehouseId;
    if (isPublic !== undefined) data.isPublic = isPublic === 'true' || isPublic === true;

    if (req.file) {
      data.imageUrl = await uploadImage(req.file.buffer, req.file.mimetype);
    } else if (req.body.imageUrl) {
      data.imageUrl = req.body.imageUrl;
    }

    const updated = await prisma.item.update({
      where: { id },
      data,
      include: { warehouse: true }
    });

    res.json(updated);
  } catch (err) {
    console.error('Update item error:', err);
    res.status(500).json({ error: '更新物品失敗' });
  }
});

// 切換物品公開狀態（快速開關）
router.patch('/:id/visibility', requireRole('ADMIN', 'WAREHOUSE_MGR'), async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublic } = req.body;

    const updated = await prisma.item.update({
      where: { id },
      data: { isPublic: Boolean(isPublic) }
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: '切換公開狀態失敗' });
  }
});

// 刪除物品
router.delete('/:id', requireRole('ADMIN', 'WAREHOUSE_MGR'), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.item.delete({ where: { id } });
    res.json({ message: '物品已刪除' });
  } catch (err) {
    res.status(500).json({ error: '刪除物品失敗' });
  }
});

module.exports = router;
