import https from 'https';
import http from 'http';
import {
  PrismaClient,
  UserRole,
  OrderStatus,
  PaymentStatus,
  DeliveryStatus,
  VehicleType,
  CardProvider,
} from '@prisma/client';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcryptjs') as { hash: (s: string, n: number) => Promise<string> };

const prisma = new PrismaClient();

function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: 15000 }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return resolve(downloadImage(res.headers.location!));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function fetchUpload(seed: string, width = 800, height = 600): Promise<string> {
  const existing = await prisma.upload.findFirst({
    where: { mimeType: `image/jpeg;seed=${seed}` },
  });
  if (existing) return `/api/v1/uploads/${existing.id}`;

  const url = `https://picsum.photos/seed/${seed}/${width}/${height}`;
  process.stdout.write(`  Yuklanmoqda: ${seed}...`);
  const data = await downloadImage(url);
  const upload = await prisma.upload.create({
    data: { data, mimeType: `image/jpeg;seed=${seed}` },
  });
  process.stdout.write(' OK\n');
  return `/api/v1/uploads/${upload.id}`;
}

const CATEGORIES = [
  { name: 'Mebel',                     slug: 'mebel'        },
  { name: "Yog'och mahsulotlar",        slug: 'yogoch'       },
  { name: 'Qurilish materiallari',      slug: 'construction' },
  { name: 'Maishiy texnika',            slug: 'appliances'   },
  { name: 'Metall buyumlar',            slug: 'metal'        },
  { name: "Matolar va to'qimachilik",   slug: 'textile'      },
  { name: "Bog' va dacha",              slug: 'garden'       },
  { name: "Uy-ro'zg'or",               slug: 'home'         },
  { name: 'Sport jihozlari',            slug: 'sport'        },
  { name: "Qo'lda ishlangan",           slug: 'handmade'     },
  { name: 'Elektronika',                slug: 'electronics'  },
  { name: 'Boshqalar',                  slug: 'other'        },
];

async function main() {
  await prisma.platformConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default' },
  });

  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: c,
    });
  }

  const categories = await prisma.category.findMany();
  const catMap = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

  // ── Rasmlar yuklanmoqda ────────────────────────────────────────────────────
  console.log('\nRasmlar yuklanmoqda...');
  const [
    imgTable, imgChair, imgShelf, imgKidsDesk, imgWardrobe, imgCarpet,
    imgBanner1, imgBanner2, imgBanner3,
    imgTableGallery1, imgTableGallery2,
    imgChairGallery1,
    imgWardrobeGallery1,
  ] = await Promise.all([
    fetchUpload('dining-table-wood', 800, 600),
    fetchUpload('modern-armchair', 800, 600),
    fetchUpload('wooden-bookshelf', 800, 600),
    fetchUpload('kids-study-room', 800, 600),
    fetchUpload('metal-wardrobe', 800, 600),
    fetchUpload('handmade-carpet', 800, 600),
    fetchUpload('summer-furniture-sale', 1200, 450),
    fetchUpload('new-collection-home', 1200, 450),
    fetchUpload('fast-delivery-city', 1200, 450),
    fetchUpload('dining-table-detail', 800, 600),
    fetchUpload('dining-table-room', 800, 600),
    fetchUpload('chair-detail-close', 800, 600),
    fetchUpload('wardrobe-interior', 800, 600),
  ]);

  // ── Admin ──────────────────────────────────────────────────────────────────
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

  // ── Seller ─────────────────────────────────────────────────────────────────
  const sellerUser = await prisma.user.upsert({
    where: { email: 'seller@lochin.uz' },
    update: { fullName: 'Bobur Toshmatov' },
    create: {
      email: 'seller@lochin.uz',
      passwordHash: await bcrypt.hash('seller123', 10),
      role: UserRole.SELLER,
      fullName: 'Bobur Toshmatov',
      isEmailVerified: true,
    },
  });

  const seller = await prisma.seller.upsert({
    where: { userId: sellerUser.id },
    update: {},
    create: {
      userId: sellerUser.id,
      legalName: 'Lochin Mebel MCHJ',
      brandName: 'Lochin Mebel',
      description: "Toshkentdagi eng yaxshi mebel ishlab chiqaruvchisi. 10 yillik tajriba, 100% o'zbek yog'ochi.",
      addressText: "Toshkent sh., Yunusobod tumani, Amir Temur ko'chasi 15",
      addressLat: 41.3315,
      addressLng: 69.2857,
      rating: 4.8,
      commissionRate: 0.10,
      bankCardNumber: '8600123456789012',
      bankCardHolder: 'BOBUR TOSHMATOV',
      isActive: true,
    },
  });

  // ── Mahsulotlar ────────────────────────────────────────────────────────────
  const productsData = [
    {
      title: 'Zamonaviy oshxona stoli',
      description: "100% eman yog'ochidan yasalgan, 6 kishilik oshxona stoli. O'lcham: 160x90x75 sm.",
      price: 1_850_000, originalPrice: 2_200_000, costPrice: 1_100_000,
      stock: 5, weightKg: 35, dimensionsCm: '160x90x75',
      requiresVehicle: VehicleType.CAR, categorySlug: 'mebel',
      imageUrl: imgTable,
      imageUrls: [imgTableGallery1, imgTableGallery2],
    },
    {
      title: "Yumshoq stul (to'plam 4 ta)",
      description: "Zamonaviy dizaynli yumshoq o'rindiqlar to'plami. Ranglar: kulrang, jigarrang, qora.",
      price: 680_000, originalPrice: 850_000, costPrice: 400_000,
      stock: 12, weightKg: 16, dimensionsCm: '45x45x90',
      requiresVehicle: VehicleType.BIKE, categorySlug: 'mebel',
      imageUrl: imgChair,
      imageUrls: [imgChairGallery1],
    },
    {
      title: "3 qavat Javon",
      description: "Archa yog'ochidan yasalgan 3 qavatli javon. Og'irlik: 18 kg.",
      price: 450_000, originalPrice: null, costPrice: 270_000,
      stock: 20, weightKg: 18, dimensionsCm: '80x30x120',
      requiresVehicle: VehicleType.CAR, categorySlug: 'yogoch',
      imageUrl: imgShelf,
      imageUrls: [],
    },
    {
      title: "Bolalar o'yin stoli",
      description: "5–12 yoshli bolalar uchun maxsus balandligi sozlanadigan stol. Rangli.",
      price: 380_000, originalPrice: null, costPrice: 220_000,
      stock: 8, weightKg: 12, dimensionsCm: '90x60x65',
      requiresVehicle: VehicleType.BIKE, categorySlug: 'mebel',
      imageUrl: imgKidsDesk,
      imageUrls: [],
    },
    {
      title: 'Temir gardirob (2 eshikli)',
      description: "Sifatli metal profil asosida tayyorlangan 2 eshikli kiyim shkafi.",
      price: 920_000, originalPrice: 1_100_000, costPrice: 580_000,
      stock: 6, weightKg: 55, dimensionsCm: '100x55x200',
      requiresVehicle: VehicleType.VAN, categorySlug: 'metal',
      imageUrl: imgWardrobe,
      imageUrls: [imgWardrobeGallery1],
    },
    {
      title: "Gilamcha (2x3m)",
      description: "Qo'lda to'qilgan milliy naqshli gilamcha. Tarkibi: 80% jun, 20% ip.",
      price: 520_000, originalPrice: null, costPrice: 310_000,
      stock: 15, weightKg: 8, dimensionsCm: '200x300',
      requiresVehicle: VehicleType.BIKE, categorySlug: 'handmade',
      imageUrl: imgCarpet,
      imageUrls: [],
    },
  ];

  const createdProducts: { id: string }[] = [];
  for (const p of productsData) {
    const existing = await prisma.product.findFirst({
      where: { sellerId: seller.id, title: p.title },
    });
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: { imageUrl: p.imageUrl, imageUrls: p.imageUrls },
      });
      createdProducts.push(existing);
      continue;
    }
    const product = await prisma.product.create({
      data: {
        sellerId: seller.id,
        categoryId: catMap[p.categorySlug],
        title: p.title,
        description: p.description,
        price: p.price,
        originalPrice: p.originalPrice ?? undefined,
        costPrice: p.costPrice,
        stock: p.stock,
        weightKg: p.weightKg,
        dimensionsCm: p.dimensionsCm,
        requiresVehicle: p.requiresVehicle,
        imageUrl: p.imageUrl,
        imageUrls: p.imageUrls,
        isActive: true,
      },
    });
    createdProducts.push(product);
  }

  // ── Courier ────────────────────────────────────────────────────────────────
  const courierUser = await prisma.user.upsert({
    where: { email: 'courier@lochin.uz' },
    update: { fullName: 'Jasur Nazarov' },
    create: {
      email: 'courier@lochin.uz',
      passwordHash: await bcrypt.hash('courier123', 10),
      role: UserRole.COURIER,
      fullName: 'Jasur Nazarov',
      isEmailVerified: true,
    },
  });

  const courier = await prisma.courier.upsert({
    where: { userId: courierUser.id },
    update: {},
    create: {
      userId: courierUser.id,
      vehicleType: VehicleType.CAR,
      vehicleModel: 'Chevrolet Nexia 3',
      vehiclePlate: '01 A 777 AA',
      maxLoadKg: 50,
      isOnline: true,
      isAvailable: true,
      currentLat: 41.2995,
      currentLng: 69.2401,
      bankCardNumber: '8600987654321098',
      bankCardHolder: 'JASUR NAZAROV',
    },
  });

  // ── Customer ───────────────────────────────────────────────────────────────
  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@lochin.uz' },
    update: { fullName: 'Malika Yusupova' },
    create: {
      email: 'customer@lochin.uz',
      passwordHash: await bcrypt.hash('customer123', 10),
      role: UserRole.CUSTOMER,
      fullName: 'Malika Yusupova',
      isEmailVerified: true,
    },
  });

  const existingAddresses = await prisma.customerAddress.findMany({ where: { userId: customerUser.id } });
  if (existingAddresses.length === 0) {
    await prisma.customerAddress.createMany({
      data: [
        {
          userId: customerUser.id,
          label: 'Uy',
          addressText: "Toshkent sh., Chilonzor tumani, Bunyodkor ko'chasi 22-uy, 4-xonadon",
          lat: 41.2932, lng: 69.2041, isDefault: true,
        },
        {
          userId: customerUser.id,
          label: 'Ish',
          addressText: "Toshkent sh., Mirzo Ulug'bek tumani, Universitet ko'chasi 5",
          lat: 41.3411, lng: 69.2888, isDefault: false,
        },
      ],
    });
  }

  const existingCard = await prisma.customerCard.findFirst({ where: { userId: customerUser.id } });
  let customerCard = existingCard;
  if (!existingCard) {
    customerCard = await prisma.customerCard.create({
      data: {
        userId: customerUser.id,
        last4: '4242',
        holderName: 'MALIKA YUSUPOVA',
        provider: CardProvider.UZCARD,
        expiryMonth: 12,
        expiryYear: 2027,
        isDefault: true,
        isActive: true,
      },
    });
  }

  // ── Orders ─────────────────────────────────────────────────────────────────
  const ordersToCreate = [
    {
      key: 'demo-order-delivered-001',
      status: OrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.PAID,
      deliveryStatus: DeliveryStatus.DELIVERED,
      productIdx: 1, quantity: 2, subtotal: 1_360_000, deliveryFee: 15_000,
      note: "Iltimos, lift bor qavatga olib chiqing",
      deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      key: 'demo-order-on-the-way-002',
      status: OrderStatus.ON_THE_WAY,
      paymentStatus: PaymentStatus.PAID,
      deliveryStatus: DeliveryStatus.ON_THE_WAY,
      productIdx: 0, quantity: 1, subtotal: 1_850_000, deliveryFee: 25_000,
      note: null,
      deliveredAt: null,
    },
    {
      key: 'demo-order-pending-003',
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.CREATED,
      deliveryStatus: DeliveryStatus.SEARCHING_COURIER,
      productIdx: 5, quantity: 1, subtotal: 520_000, deliveryFee: 10_000,
      note: "Qo'ng'iroq qilmang, SMS yuboring",
      deliveredAt: null,
    },
  ];

  for (const o of ordersToCreate) {
    const existing = await prisma.order.findUnique({ where: { idempotencyKey: o.key } });
    if (existing) continue;

    const product = createdProducts[o.productIdx];
    const productData = productsData[o.productIdx];
    const totalAmount = o.subtotal + o.deliveryFee;
    const commission = Math.round(o.subtotal * 0.1);
    const courierFee = Math.round(o.deliveryFee * 0.85);
    const sellerPayout = o.subtotal - commission;

    const order = await prisma.order.create({
      data: {
        customerId: customerUser.id,
        sellerId: seller.id,
        status: o.status,
        idempotencyKey: o.key,
        subtotalAmount: o.subtotal,
        deliveryFeeAmount: o.deliveryFee,
        serviceFeeAmount: 0,
        totalAmount,
        platformCommissionAmount: commission,
        courierFeeAmount: courierFee,
        sellerPayoutAmount: sellerPayout,
        platformRevenueAmount: commission - courierFee + o.deliveryFee - courierFee,
        commissionRateSnapshot: 0.10,
        paymentMethod: 'card',
        paymentStatus: o.paymentStatus,
        customerCardId: customerCard?.id,
        requiredVehicle: productData.requiresVehicle,
        totalWeightKg: productData.weightKg * o.quantity,
        note: o.note,
        deliveryAddressText: "Toshkent sh., Chilonzor tumani, Bunyodkor ko'chasi 22-uy",
        deliveryLat: 41.2932,
        deliveryLng: 69.2041,
        estimatedDeliveryAt: new Date(Date.now() + 60 * 60 * 1000),
        deliveredAt: o.deliveredAt,
        items: {
          create: {
            productId: product.id,
            titleSnapshot: productData.title,
            priceSnapshot: productData.price,
            quantity: o.quantity,
            totalAmount: o.subtotal,
          },
        },
        statusHistory: {
          create: { status: o.status, actorUserId: adminUser.id },
        },
        delivery: {
          create: {
            courierId: courier.id,
            status: o.deliveryStatus,
            distanceKm: 3.5,
            etaMinutes: 25,
            acceptedAt: new Date(Date.now() - 30 * 60 * 1000),
            pickedUpAt: o.deliveryStatus !== DeliveryStatus.SEARCHING_COURIER
              ? new Date(Date.now() - 20 * 60 * 1000)
              : null,
            deliveredAt: o.deliveredAt,
          },
        },
        payment: {
          create: {
            provider: 'uzcard',
            amount: totalAmount,
            status: o.paymentStatus,
          },
        },
      },
    });

    if (o.paymentStatus === PaymentStatus.PAID) {
      await prisma.ledgerEntry.createMany({
        data: [
          {
            orderId: order.id, type: 'SELLER_PAYOUT', payeeType: 'SELLER',
            payeeId: seller.id, amount: sellerPayout,
            status: o.status === OrderStatus.DELIVERED ? 'AVAILABLE' : 'PENDING',
          },
          {
            orderId: order.id, type: 'COURIER_FEE', payeeType: 'COURIER',
            payeeId: courier.id, amount: courierFee,
            status: o.status === OrderStatus.DELIVERED ? 'AVAILABLE' : 'PENDING',
          },
          {
            orderId: order.id, type: 'COMMISSION', payeeType: 'PLATFORM',
            amount: commission,
            status: o.status === OrderStatus.DELIVERED ? 'AVAILABLE' : 'PENDING',
          },
        ],
      });
    }
  }

  // ── Reviews & Favorites ────────────────────────────────────────────────────
  const existingReview = await prisma.review.findUnique({
    where: { productId_userId: { productId: createdProducts[1].id, userId: customerUser.id } },
  });
  if (!existingReview) {
    await prisma.review.create({
      data: {
        productId: createdProducts[1].id,
        userId: customerUser.id,
        rating: 5,
        comment: "Juda zo'r stullar! Sifati a'lo darajada, tez yetkazib berishdi. Tavsiya qilaman!",
      },
    });
  }

  for (const productIdx of [0, 2, 4]) {
    const product = createdProducts[productIdx];
    const existingFav = await prisma.favorite.findUnique({
      where: { userId_productId: { userId: customerUser.id, productId: product.id } },
    });
    if (!existingFav) {
      await prisma.favorite.create({ data: { userId: customerUser.id, productId: product.id } });
    }
  }

  // ── Banners ────────────────────────────────────────────────────────────────
  const bannersData = [
    { title: "Yozgi chegirmalar — 30% gacha!", imageUrl: imgBanner1, position: 0 },
    { title: "Yangi mebel kolleksiyasi",        imageUrl: imgBanner2, position: 1 },
    { title: "Tez yetkazib berish — 1 soat",    imageUrl: imgBanner3, position: 2 },
  ];
  for (const b of bannersData) {
    const existing = await prisma.banner.findFirst({ where: { title: b.title } });
    if (existing) {
      await prisma.banner.update({ where: { id: existing.id }, data: { imageUrl: b.imageUrl } });
    } else {
      await prisma.banner.create({
        data: { title: b.title, imageUrl: b.imageUrl, position: b.position, isActive: true },
      });
    }
  }

  console.log('\n✓ Seed yakunlandi:\n');
  console.log('  Admin    → admin@lochin.uz     / admin123');
  console.log('  Seller   → seller@lochin.uz    / seller123');
  console.log('  Courier  → courier@lochin.uz   / courier123');
  console.log('  Customer → customer@lochin.uz  / customer123\n');
  console.log(`  Mahsulotlar: ${productsData.length} (rasmlari bilan)`);
  console.log(`  Buyurtmalar: 3 (DELIVERED, ON_THE_WAY, PENDING)`);
  console.log(`  Bannerlar: 3 (rasmlari bilan)`);
  console.log(`  Kategoriyalar: ${CATEGORIES.length}\n`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
