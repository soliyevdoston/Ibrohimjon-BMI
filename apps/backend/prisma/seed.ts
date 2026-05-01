import { PrismaClient, UserRole, VehicleType } from '@prisma/client';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcryptjs') as { hash: (s: string, n: number) => Promise<string> };

const prisma = new PrismaClient();

const UNSPLASH = (id: string) => `https://images.unsplash.com/${id}?w=600&q=80&auto=format&fit=crop`;

const CATEGORIES = [
  // Logistics-focused (yirik tovarlar)
  { name: 'Mebel',           slug: 'mebel' },
  { name: 'Maishiy texnika', slug: 'appliances' },
  { name: 'Qurilish',        slug: 'construction' },
  { name: 'Sport va dam',    slug: 'sport' },
  { name: "Bog' va dacha",   slug: 'garden' },
  // Existing small-item categories (kept for variety)
  { name: 'Electronics',     slug: 'electronics' },
  { name: 'Home',            slug: 'home' },
  { name: 'Drinks',          slug: 'drinks' },
  { name: 'Bakery',          slug: 'bakery' },
  { name: 'Sweets',          slug: 'sweets' },
  { name: 'Pharmacy',        slug: 'pharmacy' },
  { name: 'Beauty',          slug: 'beauty' },
];

const REMOVED_SLUGS = ['food', 'groceries', 'dairy', 'meat', 'flowers'];

type SeedProduct = {
  title: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  categorySlug: string;
  weightKg?: number;
  dimensionsCm?: string;
  requiresVehicle?: VehicleType;
  isFragile?: boolean;
  isOversized?: boolean;
};

const PRODUCTS: SeedProduct[] = [
  // ===== MEBEL (yirik mebel — TRUCK/VAN) =====
  { title: 'Yumshoq divan 3 kishilik',   description: "Klassik divan, mato qoplama, 3 o'rinli",
    price: 4_200_000, stock: 6, weightKg: 65, dimensionsCm: '210x90x85',
    requiresVehicle: VehicleType.TRUCK, isOversized: true, categorySlug: 'mebel',
    imageUrl: UNSPLASH('photo-1555041469-a586c61ea9bc') },
  { title: 'Burchak divan L-shape',      description: "Burchakli yumshoq divan, oilaviy",
    price: 6_500_000, stock: 4, weightKg: 95, dimensionsCm: '260x180x90',
    requiresVehicle: VehicleType.TRUCK, isOversized: true, categorySlug: 'mebel',
    imageUrl: UNSPLASH('photo-1493663284031-b7e3aefcae8e') },
  { title: 'Ofis kursisi (charm)',        description: 'Ergonomik ofis kursisi, balandligi sozlanadi',
    price: 1_350_000, stock: 12, weightKg: 18, dimensionsCm: '60x60x110',
    requiresVehicle: VehicleType.VAN, categorySlug: 'mebel',
    imageUrl: UNSPLASH('photo-1580480055273-228ff5388ef8') },
  { title: 'Yotoq krovat 2-kishi (160x200)', description: 'Massiv yog`ochdan, matras alohida',
    price: 5_800_000, stock: 5, weightKg: 80, dimensionsCm: '170x210x90',
    requiresVehicle: VehicleType.TRUCK, isOversized: true, categorySlug: 'mebel',
    imageUrl: UNSPLASH('photo-1505693416388-ac5ce068fe85') },
  { title: 'Garderob shkaf 4 eshik',      description: '4 bo`limli kiyim shkafi, oyna bilan',
    price: 4_900_000, stock: 7, weightKg: 110, dimensionsCm: '200x60x230',
    requiresVehicle: VehicleType.TRUCK, isOversized: true, categorySlug: 'mebel',
    imageUrl: UNSPLASH('photo-1595428774223-ef52624120d2') },
  { title: 'Oshxona stoli + 4 stul',      description: 'Yog`och stol va to`plamli stullar',
    price: 3_200_000, stock: 10, weightKg: 55, dimensionsCm: '140x80x75',
    requiresVehicle: VehicleType.VAN, categorySlug: 'mebel',
    imageUrl: UNSPLASH('photo-1592078615290-033ee584e267') },
  { title: 'Kitob javoni 5 polkali',      description: 'Devor uchun ochiq javon',
    price: 1_650_000, stock: 14, weightKg: 35, dimensionsCm: '90x35x180',
    requiresVehicle: VehicleType.VAN, categorySlug: 'mebel',
    imageUrl: UNSPLASH('photo-1594620302200-9a762244a156') },
  { title: 'TV podstavka',                 description: 'TV uchun konsol, 65" gacha',
    price: 980_000, stock: 18, weightKg: 28, dimensionsCm: '150x40x55',
    requiresVehicle: VehicleType.VAN, categorySlug: 'mebel',
    imageUrl: UNSPLASH('photo-1567016526105-22da7c13161a') },
  { title: 'Yumshoq kreslo (rocking)',    description: 'Tebranadigan kreslo, dam olish uchun',
    price: 1_850_000, stock: 8, weightKg: 22, dimensionsCm: '85x95x105',
    requiresVehicle: VehicleType.CAR, categorySlug: 'mebel',
    imageUrl: UNSPLASH('photo-1598300042247-d088f8ab3a91') },

  // ===== MAISHIY TEXNIKA (VAN/TRUCK, mo'rt) =====
  { title: 'Muzlatkich Samsung 350L',     description: 'No-Frost, A++ energiya klassi',
    price: 9_800_000, stock: 8, weightKg: 78, dimensionsCm: '70x65x185',
    requiresVehicle: VehicleType.TRUCK, isFragile: true, isOversized: true, categorySlug: 'appliances',
    imageUrl: UNSPLASH('photo-1571175443880-49e1d25b2bc5') },
  { title: 'Muzlatkich LG 500L',          description: 'Side-by-side, suv dispenseri bilan',
    price: 14_500_000, stock: 4, weightKg: 105, dimensionsCm: '90x75x180',
    requiresVehicle: VehicleType.TRUCK, isFragile: true, isOversized: true, categorySlug: 'appliances',
    imageUrl: UNSPLASH('photo-1536353284924-9220c464e262') },
  { title: 'Kir yuvish mashinasi 7kg',    description: 'Frontal, 1200 RPM',
    price: 5_200_000, stock: 10, weightKg: 70, dimensionsCm: '60x60x85',
    requiresVehicle: VehicleType.VAN, isFragile: true, categorySlug: 'appliances',
    imageUrl: UNSPLASH('photo-1610557892470-55d9e80c0bce') },
  { title: 'Idish yuvish mashinasi',      description: '12 ta idish, 6 dasturli',
    price: 6_800_000, stock: 6, weightKg: 55, dimensionsCm: '60x60x85',
    requiresVehicle: VehicleType.VAN, isFragile: true, categorySlug: 'appliances',
    imageUrl: UNSPLASH('photo-1581622558663-b2e33377dfb2') },
  { title: 'Gaz plitka 4 olov',           description: 'Pechi va grill bilan',
    price: 4_400_000, stock: 9, weightKg: 50, dimensionsCm: '60x60x85',
    requiresVehicle: VehicleType.VAN, categorySlug: 'appliances',
    imageUrl: UNSPLASH('photo-1556909114-f6e7ad7d3136') },
  { title: 'Konditsioner 12000 BTU',      description: '36 m² xona uchun, inverter',
    price: 5_900_000, stock: 12, weightKg: 42, dimensionsCm: '90x30x90',
    requiresVehicle: VehicleType.VAN, isFragile: true, categorySlug: 'appliances',
    imageUrl: UNSPLASH('photo-1631545806609-5bfb9eb5e5e4') },
  { title: 'TV Samsung 55" 4K',           description: 'Smart TV, HDR10+',
    price: 7_500_000, stock: 14, weightKg: 18, dimensionsCm: '125x75x10',
    requiresVehicle: VehicleType.CAR, isFragile: true, categorySlug: 'appliances',
    imageUrl: UNSPLASH('photo-1593359677879-a4bb92f829d1') },
  { title: 'Mikroto`lqinli pech',         description: '20L, grilli',
    price: 1_200_000, stock: 25, weightKg: 12, dimensionsCm: '50x35x30',
    requiresVehicle: VehicleType.CAR, categorySlug: 'appliances',
    imageUrl: UNSPLASH('photo-1585664811087-47f65abbad64') },
  { title: 'Changyutgich Dyson V11',      description: 'Simsiz, 60 daq ishlash',
    price: 4_900_000, stock: 11, weightKg: 6, dimensionsCm: '25x25x125',
    requiresVehicle: VehicleType.CAR, categorySlug: 'appliances',
    imageUrl: UNSPLASH('photo-1558317374-067fb5f30001') },

  // ===== QURILISH (TRUCK, og'ir) =====
  { title: 'Sement 50kg qop',             description: 'M-400 portland sement',
    price: 65_000, stock: 200, weightKg: 50, dimensionsCm: '70x50x15',
    requiresVehicle: VehicleType.TRUCK, categorySlug: 'construction',
    imageUrl: UNSPLASH('photo-1581094794329-c8112a89af12') },
  { title: 'G`isht silikatli (1000 dona)', description: '1 palet, qurilish g`ishti',
    price: 1_400_000, stock: 30, weightKg: 1500, dimensionsCm: '100x80x80',
    requiresVehicle: VehicleType.TRUCK, isOversized: true, categorySlug: 'construction',
    imageUrl: UNSPLASH('photo-1604147495798-57beb5d6af73') },
  { title: 'Gips karton 1 list 12mm',     description: 'Knauf, 2.5x1.2 m',
    price: 95_000, stock: 80, weightKg: 25, dimensionsCm: '250x120x1.2',
    requiresVehicle: VehicleType.VAN, isOversized: true, categorySlug: 'construction',
    imageUrl: UNSPLASH('photo-1635105043063-12d27b8d0f6a') },
  { title: 'Bo`yoq oq 10L',                description: 'Suv asosida ichki bo`yoq',
    price: 320_000, stock: 50, weightKg: 12, dimensionsCm: '30x30x35',
    requiresVehicle: VehicleType.CAR, categorySlug: 'construction',
    imageUrl: UNSPLASH('photo-1562259949-e8e7689d7828') },
  { title: 'Laminat polga (1 m²)',        description: '32-klass, suv yutmaydi',
    price: 145_000, stock: 300, weightKg: 8, dimensionsCm: '120x20x1.2',
    requiresVehicle: VehicleType.VAN, categorySlug: 'construction',
    imageUrl: UNSPLASH('photo-1581622558663-b2e33377dfb2') },
  { title: 'Plitka kafel 30x60 (1 m²)',   description: 'Devor uchun, beje rang',
    price: 95_000, stock: 250, weightKg: 18, dimensionsCm: '30x60x1',
    requiresVehicle: VehicleType.VAN, isFragile: true, categorySlug: 'construction',
    imageUrl: UNSPLASH('photo-1615875605825-5eb9bb5d52ac') },
  { title: 'Asboblar to`plami 108 ta',    description: 'Kofrda, kalit-otvyortka-bolg`a',
    price: 850_000, stock: 22, weightKg: 9, dimensionsCm: '45x35x12',
    requiresVehicle: VehicleType.CAR, categorySlug: 'construction',
    imageUrl: UNSPLASH('photo-1530124566582-a618bc2615dc') },
  { title: 'Drelka Bosch 18V',             description: 'Akkumulyatorli, 2 batareya',
    price: 1_650_000, stock: 18, weightKg: 3, dimensionsCm: '25x10x25',
    requiresVehicle: VehicleType.CAR, categorySlug: 'construction',
    imageUrl: UNSPLASH('photo-1572981779307-38b8cabb2407') },

  // ===== SPORT VA DAM (CAR/VAN) =====
  { title: 'Velosipid Trek (28")',         description: '21 tezlikli, alyumin ramka',
    price: 4_500_000, stock: 9, weightKg: 14, dimensionsCm: '180x60x110',
    requiresVehicle: VehicleType.VAN, isOversized: true, categorySlug: 'sport',
    imageUrl: UNSPLASH('photo-1485965120184-e220f721d03e') },
  { title: 'Treadmill (yugurish dorojkasi)', description: 'Elektr, 12 km/soat tezlik',
    price: 8_900_000, stock: 5, weightKg: 75, dimensionsCm: '170x80x140',
    requiresVehicle: VehicleType.TRUCK, isFragile: true, isOversized: true, categorySlug: 'sport',
    imageUrl: UNSPLASH('photo-1576678927484-cc907957088c') },
  { title: 'Velotrenajor',                  description: 'Magnit yuklamali, displey bilan',
    price: 3_800_000, stock: 8, weightKg: 35, dimensionsCm: '120x60x130',
    requiresVehicle: VehicleType.VAN, categorySlug: 'sport',
    imageUrl: UNSPLASH('photo-1591291621164-2c6367723315') },
  { title: 'Gantellar to`plami 20kg',      description: 'Quyma, sozlanadigan',
    price: 850_000, stock: 18, weightKg: 22, dimensionsCm: '40x20x20',
    requiresVehicle: VehicleType.CAR, categorySlug: 'sport',
    imageUrl: UNSPLASH('photo-1581009146145-b5ef050c2e1e') },
  { title: 'Yoga gilamchasi premium',      description: '6mm qalinlikda, sirpanmaydi',
    price: 220_000, stock: 80, weightKg: 1.5, dimensionsCm: '180x60x6',
    requiresVehicle: VehicleType.BIKE, categorySlug: 'sport',
    imageUrl: UNSPLASH('photo-1591291621164-2c6367723315') },
  { title: 'Boks qopi 100 kg',             description: 'Charm qoplama, zanjir bilan',
    price: 1_900_000, stock: 6, weightKg: 100, dimensionsCm: '40x40x180',
    requiresVehicle: VehicleType.VAN, isOversized: true, categorySlug: 'sport',
    imageUrl: UNSPLASH('photo-1517438476312-10d79c077509') },

  // ===== BOG' VA DACHA =====
  { title: 'Mangal stoli + 6 stul',        description: 'Bog` mebeli, alyumin',
    price: 3_900_000, stock: 5, weightKg: 60, dimensionsCm: '180x90x75',
    requiresVehicle: VehicleType.VAN, isOversized: true, categorySlug: 'garden',
    imageUrl: UNSPLASH('photo-1600210491892-03d54c0aaf87') },
  { title: 'Mangal kazan-pech (kombinat)', description: 'Cho`yan, tashqi pech',
    price: 1_850_000, stock: 10, weightKg: 45, dimensionsCm: '60x40x100',
    requiresVehicle: VehicleType.CAR, categorySlug: 'garden',
    imageUrl: UNSPLASH('photo-1595855759920-86582396756a') },
  { title: 'Suv pompasi (motopomp)',       description: 'Bog` sug`orish uchun, benzin',
    price: 2_400_000, stock: 7, weightKg: 28, dimensionsCm: '50x40x45',
    requiresVehicle: VehicleType.CAR, categorySlug: 'garden',
    imageUrl: UNSPLASH('photo-1530124566582-a618bc2615dc') },
  { title: 'Gazon kosha (elektr)',         description: '1600W, 38 sm enlik',
    price: 1_950_000, stock: 8, weightKg: 14, dimensionsCm: '90x40x95',
    requiresVehicle: VehicleType.CAR, categorySlug: 'garden',
    imageUrl: UNSPLASH('photo-1599796175398-d4ce6e3a3d1f') },
  { title: 'Hovli ombor (3x2 m)',          description: "Tayyor o'rnatma metall ombor",
    price: 7_800_000, stock: 3, weightKg: 250, dimensionsCm: '300x200x200',
    requiresVehicle: VehicleType.TRUCK, isOversized: true, categorySlug: 'garden',
    imageUrl: UNSPLASH('photo-1564540583246-934409427776') },

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
    update: {
      vehicleType: VehicleType.TRUCK,
      vehicleModel: 'Isuzu NLR (3.5T)',
      vehiclePlate: '01 A 777 AA',
      maxLoadKg: 3500,
      isOnline: true,
      isAvailable: true,
    },
    create: {
      userId: courierUser.id,
      vehicleType: VehicleType.TRUCK,
      vehicleModel: 'Isuzu NLR (3.5T)',
      vehiclePlate: '01 A 777 AA',
      maxLoadKg: 3500,
      isOnline: true,
      isAvailable: true,
    },
  });

  // Soft-archive existing seeded products (some may be referenced by orders).
  await prisma.product.updateMany({
    where: { sellerId: seller.id },
    data: { isActive: false, stock: 0 },
  });

  // Soft-archive products in removed categories; only delete categories that
  // have no products at all (so referenced ones keep their parent intact).
  for (const slug of REMOVED_SLUGS) {
    const cat = await prisma.category.findUnique({ where: { slug } });
    if (!cat) continue;
    await prisma.product.updateMany({
      where: { categoryId: cat.id },
      data: { isActive: false, stock: 0 },
    });
    const remaining = await prisma.product.count({ where: { categoryId: cat.id } });
    if (remaining === 0) {
      await prisma.category.delete({ where: { id: cat.id } });
    }
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
        weightKg: p.weightKg ?? 1,
        dimensionsCm: p.dimensionsCm ?? null,
        requiresVehicle: p.requiresVehicle ?? VehicleType.BIKE,
        isFragile: p.isFragile ?? false,
        isOversized: p.isOversized ?? false,
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
