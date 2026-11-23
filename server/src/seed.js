const bcrypt = require('bcryptjs');
const prisma = require('./db');

async function seed() {
  console.log('🌱 Starting database seeding...');

  try {
    // 1. 建立預設系統管理員 (ADMIN)
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        password: adminPassword,
        fullName: '系統總管理員',
        role: 'ADMIN'
      }
    });
    console.log('✅ Admin user created/verified: admin / admin123');

    // 2. 建立預設倉庫管理員 (WAREHOUSE_MGR)
    const managerPassword = await bcrypt.hash('manager123', 10);
    const manager = await prisma.user.upsert({
      where: { username: 'manager' },
      update: {},
      create: {
        username: 'manager',
        password: managerPassword,
        fullName: '台北一倉管理員',
        role: 'WAREHOUSE_MGR'
      }
    });
    console.log('✅ Warehouse Manager created: manager / manager123');

    // 3. 建立預設訂單登記者 (REGISTRANT)
    const userPassword = await bcrypt.hash('user123', 10);
    await prisma.user.upsert({
      where: { username: 'user' },
      update: {},
      create: {
        username: 'user',
        password: userPassword,
        fullName: '一般訂單登記者',
        role: 'REGISTRANT'
      }
    });
    console.log('✅ Registrant user created: user / user123');

    // 4. 建立示範倉庫
    const wh1 = await prisma.warehouse.upsert({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000001',
        name: '台北物流總倉',
        location: '新北市五股區物流大道 88 號',
        description: '常溫貨物主要存放與出貨總倉'
      }
    });

    const wh2 = await prisma.warehouse.upsert({
      where: { id: '00000000-0000-0000-0000-000000000002' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000002',
        name: '台中快速發貨倉',
        location: '台中市西屯區工業十路 12 號',
        description: '中部快配倉儲，存放高流通日用品'
      }
    });

    // 5. 建立示範物品
    const sampleItems = [
      {
        id: '10000000-0000-0000-0000-000000000001',
        name: '多功能人體工學辦公椅',
        sku: 'CHAIR-ERG-01',
        description: '高透氣網布、可調腰靠、3D旋轉扶手',
        quantity: 35,
        imageUrl: 'https://images.unsplash.com/photo-1580481077195-c228c407f9ab?w=600&auto=format&fit=crop&q=80',
        isPublic: true,
        warehouseId: wh1.id
      },
      {
        id: '10000000-0000-0000-0000-000000000002',
        name: '智能溫控不銹鋼保溫瓶 750ml',
        sku: 'BOTTLE-TEMP-02',
        description: 'LED觸控螢幕顯示溫度，雙層真空長效保溫保冷',
        quantity: 120,
        imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80',
        isPublic: true,
        warehouseId: wh1.id
      },
      {
        id: '10000000-0000-0000-0000-000000000003',
        name: '工業級強力封箱膠帶 (6入裝)',
        sku: 'TAPE-IND-06',
        description: '倉庫包裝耗材專用，高黏度不易斷裂 (內部備品)',
        quantity: 50,
        imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80',
        isPublic: false, // 倉庫內部專用，不對外開放
        warehouseId: wh2.id
      },
      {
        id: '10000000-0000-0000-0000-000000000004',
        name: '防潑水機能雙肩後背包',
        sku: 'BAG-OUTDOOR-04',
        description: '加厚防震筆電隔層，具防盜拉鍊與外置充電接口',
        quantity: 80,
        imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
        isPublic: true,
        warehouseId: wh2.id
      }
    ];

    for (const item of sampleItems) {
      await prisma.item.upsert({
        where: { id: item.id },
        update: {},
        create: item
      });
    }
    console.log('✅ Sample items and warehouses created successfully.');
  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seed();
}

module.exports = seed;
