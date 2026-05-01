import { PrismaClient, UserRole } from '@prisma/client';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcryptjs') as { hash: (s: string, n: number) => Promise<string> };

const prisma = new PrismaClient();

const UNSPLASH = (id: string) => `https://images.unsplash.com/${id}?w=600&q=80&auto=format&fit=crop`;

const CATEGORIES = [
  { name: 'Drinks',       slug: 'drinks' },
  { name: 'Bakery',       slug: 'bakery' },
  { name: 'Sweets',       slug: 'sweets' },
  { name: 'Pharmacy',     slug: 'pharmacy' },
  { name: 'Electronics',  slug: 'electronics' },
  { name: 'Home',         slug: 'home' },
  { name: 'Beauty',       slug: 'beauty' },
];

const REMOVED_SLUGS = ['food', 'groceries', 'dairy', 'meat', 'flowers'];

type SeedProduct = {
  title: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  categorySlug: string;
};

const PRODUCTS: SeedProduct[] = [
  // ===== DRINKS (idishda saqlanadigan) =====
  { title: 'Yashil choy 100g',         description: 'Quruq yashil choy paketi, uzoq saqlanadi',             price: 22000, stock: 120, categorySlug: 'drinks', imageUrl: UNSPLASH('photo-1556679343-c7306c1976bc') },
  { title: 'Coca-Cola 1L',              description: 'Sovutilgan, uzoq saqlash mumkin',                     price: 15000, stock: 200, categorySlug: 'drinks', imageUrl: UNSPLASH('photo-1554866585-cd94860890b7') },
  { title: 'Mineral suv 1.5L',          description: 'Tabiiy gazsiz suv',                                    price: 8000,  stock: 250, categorySlug: 'drinks', imageUrl: UNSPLASH('photo-1564419320461-6870880221ad') },
  { title: 'Olma sharbati 1L',          description: 'Idishlangan tabiiy sharbat',                           price: 22000, stock: 100, categorySlug: 'drinks', imageUrl: UNSPLASH('photo-1622597467836-f3e6b3c5f6e0') },

  // ===== BAKERY (TORTLAR) =====
  { title: 'Shokoladli tort 1kg',      description: '8 kishilik to\'liq tort',                              price: 95000, stock: 15,  categorySlug: 'bakery', imageUrl: UNSPLASH('photo-1578985545062-69928b1d9587') },
  { title: 'Napoleon tort',             description: 'Klassik qatlamali tort, 800g',                         price: 85000, stock: 12,  categorySlug: 'bakery', imageUrl: UNSPLASH('photo-1486427944299-d1955d23e34d') },
  { title: 'Medovik (asal tort)',       description: 'O\'zbek uslubidagi asal torti',                        price: 78000, stock: 18,  categorySlug: 'bakery', imageUrl: UNSPLASH('photo-1571115177098-24ec42ed204d') },
  { title: 'Cheesecake',                 description: 'Klassik New York cheesecake',                          price: 110000, stock: 10, categorySlug: 'bakery', imageUrl: UNSPLASH('photo-1524351199678-941a58a3df50') },
  { title: 'Tiramisu',                  description: 'Italyan an\'anaviy tortchasi',                         price: 92000, stock: 14,  categorySlug: 'bakery', imageUrl: UNSPLASH('photo-1571877227200-a0d98ea607e9') },
  { title: 'Cookies (10 dona)',         description: 'Shokolad bo\'laklari bilan',                           price: 28000, stock: 70,  categorySlug: 'bakery', imageUrl: UNSPLASH('photo-1499636136210-6f4ee915583e') },

  // ===== SWEETS =====
  { title: 'Shokolad Milka (100g)',    description: 'Sutli shokolad',                                       price: 18000, stock: 120, categorySlug: 'sweets', imageUrl: UNSPLASH('photo-1606312619070-d48b4c652a52') },
  { title: 'Shokolad Lindt (100g)',    description: 'Shveytsariya shokoladi, 70% kakao',                    price: 38000, stock: 80,  categorySlug: 'sweets', imageUrl: UNSPLASH('photo-1623660053975-e69c8df0040c') },
  { title: 'Karamel konfetlari',        description: 'Idishlangan, 250g',                                    price: 24000, stock: 90,  categorySlug: 'sweets', imageUrl: UNSPLASH('photo-1581798459219-318e76aecc7b') },
  { title: 'Asal (500g)',                description: 'Tabiiy tog\' asali, uzoq saqlanadi',                  price: 75000, stock: 60,  categorySlug: 'sweets', imageUrl: UNSPLASH('photo-1587049352846-4a222e784d38') },
  { title: 'Halva (500g)',               description: 'Tahin halvasi, an\'anaviy',                            price: 32000, stock: 75,  categorySlug: 'sweets', imageUrl: UNSPLASH('photo-1582716401301-b2407dc7563d') },
  { title: 'Marmalad to\'plami',         description: 'Mevali marmaladlar, 300g',                             price: 28000, stock: 100, categorySlug: 'sweets', imageUrl: UNSPLASH('photo-1582058091505-f87a2e55a40f') },

  // ===== PHARMACY =====
  { title: 'Paracetamol (10 tab)',     description: 'Issiqlik tushiruvchi',                                  price: 8000,  stock: 200, categorySlug: 'pharmacy', imageUrl: UNSPLASH('photo-1584308666744-24d5c474f2ae') },
  { title: 'Vitamin C (60 tab)',       description: 'Immunitetni mustahkamlash',                            price: 35000, stock: 100, categorySlug: 'pharmacy', imageUrl: UNSPLASH('photo-1471864190281-a93a3070b6de') },
  { title: 'Vitamin D3',                 description: 'Yog\'da eriydigan vitamin, 60 tabletka',               price: 48000, stock: 80,  categorySlug: 'pharmacy', imageUrl: UNSPLASH('photo-1550572017-edd951b55104') },
  { title: 'Multivitamin Centrum',      description: 'Barcha vitaminlar, 90 tabletka',                       price: 165000, stock: 60, categorySlug: 'pharmacy', imageUrl: UNSPLASH('photo-1626516890025-6b3f24f5bd2b') },
  { title: 'Antiseptik suyuqlik',       description: 'Qo\'l uchun, 250ml',                                    price: 18000, stock: 150, categorySlug: 'pharmacy', imageUrl: UNSPLASH('photo-1583912267550-4f6a32ce7e93') },

  // ===== ELECTRONICS =====
  { title: 'iPhone 15 Pro 256GB',     description: 'Yangi iPhone 15 Pro, Titanium qalpoq',                  price: 14500000, stock: 8,  categorySlug: 'electronics', imageUrl: UNSPLASH('photo-1592750475338-74b7b21085ab') },
  { title: 'Samsung Galaxy S24',       description: '256GB, AMOLED ekran',                                   price: 12000000, stock: 12, categorySlug: 'electronics', imageUrl: UNSPLASH('photo-1610945265064-0e34e5519bbf') },
  { title: 'AirPods Pro 2',             description: 'Active noise cancellation',                             price: 3200000,  stock: 25, categorySlug: 'electronics', imageUrl: UNSPLASH('photo-1606220945770-b5b6c2c55bf1') },
  { title: 'MacBook Air M3',            description: '13" 8GB/256GB',                                        price: 16800000, stock: 5,  categorySlug: 'electronics', imageUrl: UNSPLASH('photo-1517336714731-489689fd1ca8') },
  { title: 'Apple Watch Series 9',     description: 'GPS 45mm aluminium',                                    price: 5200000,  stock: 15, categorySlug: 'electronics', imageUrl: UNSPLASH('photo-1551816230-ef5deaed4a26') },
  { title: 'Sony WH-1000XM5 naushnik', description: 'Eng yaxshi tovush filtrlash',                           price: 4800000,  stock: 18, categorySlug: 'electronics', imageUrl: UNSPLASH('photo-1583394838336-acd977736f90') },
  { title: 'Samsung 55" QLED TV',      description: '4K QLED, smart TV',                                    price: 8900000,  stock: 6,  categorySlug: 'electronics', imageUrl: UNSPLASH('photo-1593359677879-a4bb92f829d1') },
  { title: 'iPad Air 5',                description: '64GB Wi-Fi, M1 chip',                                   price: 7400000,  stock: 10, categorySlug: 'electronics', imageUrl: UNSPLASH('photo-1544244015-0df4b3ffc6b0') },
  { title: 'Quvvat banki 20000mAh',    description: 'Tez quvvatlash, 22.5W',                                price: 280000,   stock: 50, categorySlug: 'electronics', imageUrl: UNSPLASH('photo-1609091839311-d5365f9ff1c5') },
  { title: 'JBL Flip 6 kolonka',       description: 'Bluetooth 5.1, suvga chidamli',                         price: 1450000,  stock: 22, categorySlug: 'electronics', imageUrl: UNSPLASH('photo-1608043152269-423dbba4e7e1') },

  // ===== HOME =====
  { title: 'Yostiq + adyol komplekti',  description: 'Kotton, 200×200',                                       price: 380000,  stock: 30, categorySlug: 'home', imageUrl: UNSPLASH('photo-1631049307264-da0ec9d70304') },
  { title: 'LED chiroq stol uchun',    description: '15W, qalqonli',                                         price: 220000,  stock: 40, categorySlug: 'home', imageUrl: UNSPLASH('photo-1565374790459-72c35adb3aab') },
  { title: 'Choynak (elektr)',          description: '1.7L, paydo bo‘lmaydigan po‘lat',                       price: 320000,  stock: 25, categorySlug: 'home', imageUrl: UNSPLASH('photo-1547074620-f17b3f0bcaa5') },
  { title: 'Sviler (chang yutgich)',   description: '1800W, HEPA filtr',                                    price: 1450000, stock: 15, categorySlug: 'home', imageUrl: UNSPLASH('photo-1558317374-067fb5f30001') },

  // ===== BEAUTY =====
  { title: 'Atir Chanel No.5 50ml',    description: 'Klassik ayollar atiri',                                price: 1800000, stock: 12, categorySlug: 'beauty', imageUrl: UNSPLASH('photo-1541643600914-78b084683601') },
  { title: 'Lab pomadasi MAC',          description: 'Matte finish, 8 rangda',                                price: 220000,  stock: 50, categorySlug: 'beauty', imageUrl: UNSPLASH('photo-1586495777744-4413f21062fa') },
  { title: 'Yuz kremi La Roche-Posay', description: 'Quruq teri uchun',                                     price: 380000,  stock: 35, categorySlug: 'beauty', imageUrl: UNSPLASH('photo-1556228720-195a672e8a03') },
  { title: 'Soch fenchasi Dyson',      description: 'Supersonic, professional',                              price: 4200000, stock: 8,  categorySlug: 'beauty', imageUrl: UNSPLASH('photo-1522338242992-e1a54906a8da') },
];

async function main() {
  // Categories
  const categoryByslug = new Map<string, string>();
  for (const c of CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: c,
    });
    categoryByslug.set(c.slug, cat.id);
  }

  // Demo users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@lochin.uz' },
    update: { role: UserRole.ADMIN, isEmailVerified: true, fullName: 'Admin User' },
    create: {
      email: 'admin@lochin.uz',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: UserRole.ADMIN,
      fullName: 'Admin User',
      isEmailVerified: true,
    },
  });

  const sellerUser = await prisma.user.upsert({
    where: { email: 'seller@lochin.uz' },
    update: { role: UserRole.SELLER, isEmailVerified: true, fullName: 'Demo Seller' },
    create: {
      email: 'seller@lochin.uz',
      passwordHash: await bcrypt.hash('seller123', 10),
      role: UserRole.SELLER,
      fullName: 'Demo Seller',
      isEmailVerified: true,
    },
  });

  const courierUser = await prisma.user.upsert({
    where: { email: 'courier@lochin.uz' },
    update: { role: UserRole.COURIER, isEmailVerified: true, fullName: 'Demo Courier' },
    create: {
      email: 'courier@lochin.uz',
      passwordHash: await bcrypt.hash('courier123', 10),
      role: UserRole.COURIER,
      fullName: 'Demo Courier',
      isEmailVerified: true,
    },
  });

  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@lochin.uz' },
    update: { role: UserRole.CUSTOMER, isEmailVerified: true, fullName: 'Demo Customer' },
    create: {
      email: 'customer@lochin.uz',
      passwordHash: await bcrypt.hash('customer123', 10),
      role: UserRole.CUSTOMER,
      fullName: 'Demo Customer',
      isEmailVerified: true,
    },
  });

  const seller = await prisma.seller.upsert({
    where: { userId: sellerUser.id },
    update: {
      legalName: 'Lochin Demo Market LLC',
      brandName: 'Lochin Market',
      addressText: 'Yunusobod, Toshkent',
      addressLat: 41.3111,
      addressLng: 69.2797,
    },
    create: {
      userId: sellerUser.id,
      legalName: 'Lochin Demo Market LLC',
      brandName: 'Lochin Market',
      addressText: 'Yunusobod, Toshkent',
      addressLat: 41.3111,
      addressLng: 69.2797,
    },
  });

  await prisma.courier.upsert({
    where: { userId: courierUser.id },
    update: { vehicleType: 'bike', isOnline: true, isAvailable: true },
    create: {
      userId: courierUser.id,
      vehicleType: 'bike',
      isOnline: true,
      isAvailable: true,
    },
  });

  // Wipe existing seeded products to keep things clean (only by demo seller)
  await prisma.product.deleteMany({ where: { sellerId: seller.id } });

  // Clean up obsolete (perishable) categories — first remove their products, then categories
  for (const slug of REMOVED_SLUGS) {
    const cat = await prisma.category.findUnique({ where: { slug } });
    if (!cat) continue;
    await prisma.product.deleteMany({ where: { categoryId: cat.id } });
    await prisma.category.delete({ where: { id: cat.id } });
  }

  let created = 0;
  for (const p of PRODUCTS) {
    const categoryId = categoryByslug.get(p.categorySlug);
    if (!categoryId) continue;
    await prisma.product.create({
      data: {
        sellerId: seller.id,
        categoryId,
        title: p.title,
        description: p.description,
        price: p.price,
        stock: p.stock,
        imageUrl: p.imageUrl,
        isActive: true,
      },
    });
    created++;
  }

  console.log('Seed complete', {
    adminId: adminUser.id,
    sellerId: sellerUser.id,
    courierId: courierUser.id,
    customerId: customerUser.id,
    products: created,
    categories: CATEGORIES.length,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
