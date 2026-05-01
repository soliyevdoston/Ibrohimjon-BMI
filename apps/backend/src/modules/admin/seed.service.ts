import { Injectable, Logger } from '@nestjs/common';
import { UserRole, VehicleType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from 'src/common/prisma.service';

const UNSPLASH = (id: string) =>
  `https://images.unsplash.com/${id}?w=600&q=80&auto=format&fit=crop`;

const CATEGORIES = [
  { name: 'Mebel',           slug: 'mebel' },
  { name: 'Maishiy texnika', slug: 'appliances' },
  { name: 'Qurilish',        slug: 'construction' },
  { name: 'Sport va dam',    slug: 'sport' },
  { name: "Bog' va dacha",   slug: 'garden' },
  { name: 'Electronics',     slug: 'electronics' },
  { name: 'Home',            slug: 'home' },
  { name: 'Drinks',          slug: 'drinks' },
  { name: 'Bakery',          slug: 'bakery' },
  { name: 'Sweets',          slug: 'sweets' },
  { name: 'Pharmacy',        slug: 'pharmacy' },
  { name: 'Beauty',          slug: 'beauty' },
];

interface SeedProduct {
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
}

const PRODUCTS: SeedProduct[] = [
  // ===== MEBEL =====
  { title: 'Yumshoq divan 3 kishilik', description: "Klassik divan, mato qoplama, 3 o'rinli", price: 4_200_000, stock: 6, weightKg: 65, dimensionsCm: '210x90x85', requiresVehicle: VehicleType.TRUCK, isOversized: true, categorySlug: 'mebel', imageUrl: UNSPLASH('photo-1555041469-a586c61ea9bc') },
  { title: 'Burchak divan L-shape', description: 'Burchakli yumshoq divan, oilaviy', price: 6_500_000, stock: 4, weightKg: 95, dimensionsCm: '260x180x90', requiresVehicle: VehicleType.TRUCK, isOversized: true, categorySlug: 'mebel', imageUrl: UNSPLASH('photo-1493663284031-b7e3aefcae8e') },
  { title: 'Ofis kursisi (charm)', description: 'Ergonomik ofis kursisi, balandligi sozlanadi', price: 1_350_000, stock: 12, weightKg: 18, dimensionsCm: '60x60x110', requiresVehicle: VehicleType.VAN, categorySlug: 'mebel', imageUrl: UNSPLASH('photo-1580480055273-228ff5388ef8') },
  { title: 'Yotoq krovat 2-kishi (160x200)', description: 'Massiv yog`ochdan, matras alohida', price: 5_800_000, stock: 5, weightKg: 80, dimensionsCm: '170x210x90', requiresVehicle: VehicleType.TRUCK, isOversized: true, categorySlug: 'mebel', imageUrl: UNSPLASH('photo-1505693416388-ac5ce068fe85') },
  { title: 'Garderob shkaf 4 eshik', description: '4 bo`limli kiyim shkafi, oyna bilan', price: 4_900_000, stock: 7, weightKg: 110, dimensionsCm: '200x60x230', requiresVehicle: VehicleType.TRUCK, isOversized: true, categorySlug: 'mebel', imageUrl: UNSPLASH('photo-1595428774223-ef52624120d2') },
  { title: 'Oshxona stoli + 4 stul', description: 'Yog`och stol va to`plamli stullar', price: 3_200_000, stock: 10, weightKg: 55, dimensionsCm: '140x80x75', requiresVehicle: VehicleType.VAN, categorySlug: 'mebel', imageUrl: UNSPLASH('photo-1592078615290-033ee584e267') },
  { title: 'Kitob javoni 5 polkali', description: 'Devor uchun ochiq javon', price: 1_650_000, stock: 14, weightKg: 35, dimensionsCm: '90x35x180', requiresVehicle: VehicleType.VAN, categorySlug: 'mebel', imageUrl: UNSPLASH('photo-1594620302200-9a762244a156') },
  { title: 'TV podstavka', description: 'TV uchun konsol, 65" gacha', price: 980_000, stock: 18, weightKg: 28, dimensionsCm: '150x40x55', requiresVehicle: VehicleType.VAN, categorySlug: 'mebel', imageUrl: UNSPLASH('photo-1567016526105-22da7c13161a') },
  { title: 'Yumshoq kreslo (rocking)', description: 'Tebranadigan kreslo, dam olish uchun', price: 1_850_000, stock: 8, weightKg: 22, dimensionsCm: '85x95x105', requiresVehicle: VehicleType.CAR, categorySlug: 'mebel', imageUrl: UNSPLASH('photo-1598300042247-d088f8ab3a91') },
  // ===== APPLIANCES =====
  { title: 'Muzlatkich Samsung 350L', description: 'No-Frost, A++ energiya klassi', price: 9_800_000, stock: 8, weightKg: 78, dimensionsCm: '70x65x185', requiresVehicle: VehicleType.TRUCK, isFragile: true, isOversized: true, categorySlug: 'appliances', imageUrl: UNSPLASH('photo-1571175443880-49e1d25b2bc5') },
  { title: 'Muzlatkich LG 500L', description: 'Side-by-side, suv dispenseri bilan', price: 14_500_000, stock: 4, weightKg: 105, dimensionsCm: '90x75x180', requiresVehicle: VehicleType.TRUCK, isFragile: true, isOversized: true, categorySlug: 'appliances', imageUrl: UNSPLASH('photo-1536353284924-9220c464e262') },
  { title: 'Kir yuvish mashinasi 7kg', description: 'Frontal, 1200 RPM', price: 5_200_000, stock: 10, weightKg: 70, dimensionsCm: '60x60x85', requiresVehicle: VehicleType.VAN, isFragile: true, categorySlug: 'appliances', imageUrl: UNSPLASH('photo-1610557892470-55d9e80c0bce') },
  { title: 'Idish yuvish mashinasi', description: '12 ta idish, 6 dasturli', price: 6_800_000, stock: 6, weightKg: 55, dimensionsCm: '60x60x85', requiresVehicle: VehicleType.VAN, isFragile: true, categorySlug: 'appliances', imageUrl: UNSPLASH('photo-1581622558663-b2e33377dfb2') },
  { title: 'Gaz plitka 4 olov', description: 'Pechi va grill bilan', price: 4_400_000, stock: 9, weightKg: 50, dimensionsCm: '60x60x85', requiresVehicle: VehicleType.VAN, categorySlug: 'appliances', imageUrl: UNSPLASH('photo-1556909114-f6e7ad7d3136') },
  { title: 'Konditsioner 12000 BTU', description: '36 m² xona uchun, inverter', price: 5_900_000, stock: 12, weightKg: 42, dimensionsCm: '90x30x90', requiresVehicle: VehicleType.VAN, isFragile: true, categorySlug: 'appliances', imageUrl: UNSPLASH('photo-1631545806609-5bfb9eb5e5e4') },
  { title: 'TV Samsung 55" 4K', description: 'Smart TV, HDR10+', price: 7_500_000, stock: 14, weightKg: 18, dimensionsCm: '125x75x10', requiresVehicle: VehicleType.CAR, isFragile: true, categorySlug: 'appliances', imageUrl: UNSPLASH('photo-1593359677879-a4bb92f829d1') },
  { title: 'Mikroto`lqinli pech', description: '20L, grilli', price: 1_200_000, stock: 25, weightKg: 12, dimensionsCm: '50x35x30', requiresVehicle: VehicleType.CAR, categorySlug: 'appliances', imageUrl: UNSPLASH('photo-1585664811087-47f65abbad64') },
  { title: 'Changyutgich Dyson V11', description: 'Simsiz, 60 daq ishlash', price: 4_900_000, stock: 11, weightKg: 6, dimensionsCm: '25x25x125', requiresVehicle: VehicleType.CAR, categorySlug: 'appliances', imageUrl: UNSPLASH('photo-1558317374-067fb5f30001') },
  // ===== CONSTRUCTION =====
  { title: 'Sement 50kg qop', description: 'M-400 portland sement', price: 65_000, stock: 200, weightKg: 50, dimensionsCm: '70x50x15', requiresVehicle: VehicleType.TRUCK, categorySlug: 'construction', imageUrl: UNSPLASH('photo-1581094794329-c8112a89af12') },
  { title: 'G`isht silikatli (1000 dona)', description: '1 palet, qurilish g`ishti', price: 1_400_000, stock: 30, weightKg: 1500, dimensionsCm: '100x80x80', requiresVehicle: VehicleType.TRUCK, isOversized: true, categorySlug: 'construction', imageUrl: UNSPLASH('photo-1604147495798-57beb5d6af73') },
  { title: 'Gips karton 1 list 12mm', description: 'Knauf, 2.5x1.2 m', price: 95_000, stock: 80, weightKg: 25, dimensionsCm: '250x120x1.2', requiresVehicle: VehicleType.VAN, isOversized: true, categorySlug: 'construction', imageUrl: UNSPLASH('photo-1635105043063-12d27b8d0f6a') },
  { title: 'Bo`yoq oq 10L', description: 'Suv asosida ichki bo`yoq', price: 320_000, stock: 50, weightKg: 12, dimensionsCm: '30x30x35', requiresVehicle: VehicleType.CAR, categorySlug: 'construction', imageUrl: UNSPLASH('photo-1562259949-e8e7689d7828') },
  { title: 'Laminat polga (1 m²)', description: '32-klass, suv yutmaydi', price: 145_000, stock: 300, weightKg: 8, dimensionsCm: '120x20x1.2', requiresVehicle: VehicleType.VAN, categorySlug: 'construction', imageUrl: UNSPLASH('photo-1581622558663-b2e33377dfb2') },
  { title: 'Plitka kafel 30x60 (1 m²)', description: 'Devor uchun, beje rang', price: 95_000, stock: 250, weightKg: 18, dimensionsCm: '30x60x1', requiresVehicle: VehicleType.VAN, isFragile: true, categorySlug: 'construction', imageUrl: UNSPLASH('photo-1615875605825-5eb9bb5d52ac') },
  { title: 'Asboblar to`plami 108 ta', description: 'Kofrda, kalit-otvyortka-bolg`a', price: 850_000, stock: 22, weightKg: 9, dimensionsCm: '45x35x12', requiresVehicle: VehicleType.CAR, categorySlug: 'construction', imageUrl: UNSPLASH('photo-1530124566582-a618bc2615dc') },
  { title: 'Drelka Bosch 18V', description: 'Akkumulyatorli, 2 batareya', price: 1_650_000, stock: 18, weightKg: 3, dimensionsCm: '25x10x25', requiresVehicle: VehicleType.CAR, categorySlug: 'construction', imageUrl: UNSPLASH('photo-1572981779307-38b8cabb2407') },
  // ===== SPORT =====
  { title: 'Velosipid Trek (28")', description: '21 tezlikli, alyumin ramka', price: 4_500_000, stock: 9, weightKg: 14, dimensionsCm: '180x60x110', requiresVehicle: VehicleType.VAN, isOversized: true, categorySlug: 'sport', imageUrl: UNSPLASH('photo-1485965120184-e220f721d03e') },
  { title: 'Treadmill (yugurish dorojkasi)', description: 'Elektr, 12 km/soat tezlik', price: 8_900_000, stock: 5, weightKg: 75, dimensionsCm: '170x80x140', requiresVehicle: VehicleType.TRUCK, isFragile: true, isOversized: true, categorySlug: 'sport', imageUrl: UNSPLASH('photo-1576678927484-cc907957088c') },
  { title: 'Velotrenajor', description: 'Magnit yuklamali, displey bilan', price: 3_800_000, stock: 8, weightKg: 35, dimensionsCm: '120x60x130', requiresVehicle: VehicleType.VAN, categorySlug: 'sport', imageUrl: UNSPLASH('photo-1591291621164-2c6367723315') },
  { title: 'Gantellar to`plami 20kg', description: 'Quyma, sozlanadigan', price: 850_000, stock: 18, weightKg: 22, dimensionsCm: '40x20x20', requiresVehicle: VehicleType.CAR, categorySlug: 'sport', imageUrl: UNSPLASH('photo-1581009146145-b5ef050c2e1e') },
  { title: 'Yoga gilamchasi premium', description: '6mm qalinlikda, sirpanmaydi', price: 220_000, stock: 80, weightKg: 1.5, dimensionsCm: '180x60x6', requiresVehicle: VehicleType.BIKE, categorySlug: 'sport', imageUrl: UNSPLASH('photo-1591291621164-2c6367723315') },
  { title: 'Boks qopi 100 kg', description: 'Charm qoplama, zanjir bilan', price: 1_900_000, stock: 6, weightKg: 100, dimensionsCm: '40x40x180', requiresVehicle: VehicleType.VAN, isOversized: true, categorySlug: 'sport', imageUrl: UNSPLASH('photo-1517438476312-10d79c077509') },
  // ===== GARDEN =====
  { title: 'Mangal stoli + 6 stul', description: 'Bog` mebeli, alyumin', price: 3_900_000, stock: 5, weightKg: 60, dimensionsCm: '180x90x75', requiresVehicle: VehicleType.VAN, isOversized: true, categorySlug: 'garden', imageUrl: UNSPLASH('photo-1600210491892-03d54c0aaf87') },
  { title: 'Mangal kazan-pech (kombinat)', description: 'Cho`yan, tashqi pech', price: 1_850_000, stock: 10, weightKg: 45, dimensionsCm: '60x40x100', requiresVehicle: VehicleType.CAR, categorySlug: 'garden', imageUrl: UNSPLASH('photo-1595855759920-86582396756a') },
  { title: 'Suv pompasi (motopomp)', description: 'Bog` sug`orish uchun, benzin', price: 2_400_000, stock: 7, weightKg: 28, dimensionsCm: '50x40x45', requiresVehicle: VehicleType.CAR, categorySlug: 'garden', imageUrl: UNSPLASH('photo-1530124566582-a618bc2615dc') },
  { title: 'Gazon kosha (elektr)', description: '1600W, 38 sm enlik', price: 1_950_000, stock: 8, weightKg: 14, dimensionsCm: '90x40x95', requiresVehicle: VehicleType.CAR, categorySlug: 'garden', imageUrl: UNSPLASH('photo-1599796175398-d4ce6e3a3d1f') },
  { title: 'Hovli ombor (3x2 m)', description: "Tayyor o'rnatma metall ombor", price: 7_800_000, stock: 3, weightKg: 250, dimensionsCm: '300x200x200', requiresVehicle: VehicleType.TRUCK, isOversized: true, categorySlug: 'garden', imageUrl: UNSPLASH('photo-1564540583246-934409427776') },
];

@Injectable()
export class SeedService {
  private readonly logger = new Logger('Seed');
  constructor(private readonly prisma: PrismaService) {}

  async runFullSeed() {
    this.logger.log('Starting demo seed…');

    // 1. Categories — upsert
    const categoryMap = new Map<string, string>();
    for (const c of CATEGORIES) {
      const cat = await this.prisma.category.upsert({
        where: { slug: c.slug },
        update: { name: c.name },
        create: { name: c.name, slug: c.slug },
      });
      categoryMap.set(c.slug, cat.id);
    }

    // 2. Demo users
    const adminUser = await this.prisma.user.upsert({
      where: { email: 'admin@lochin.uz' },
      update: { fullName: 'Demo Admin', isEmailVerified: true },
      create: {
        email: 'admin@lochin.uz',
        passwordHash: await bcrypt.hash('admin123', 10),
        role: UserRole.ADMIN,
        fullName: 'Demo Admin',
        isEmailVerified: true,
      },
    });
    const sellerUser = await this.prisma.user.upsert({
      where: { email: 'seller@lochin.uz' },
      update: { fullName: 'Demo Seller', isEmailVerified: true },
      create: {
        email: 'seller@lochin.uz',
        passwordHash: await bcrypt.hash('seller123', 10),
        role: UserRole.SELLER,
        fullName: 'Demo Seller',
        isEmailVerified: true,
      },
    });
    const courierUser = await this.prisma.user.upsert({
      where: { email: 'courier@lochin.uz' },
      update: { fullName: 'Demo Courier', isEmailVerified: true },
      create: {
        email: 'courier@lochin.uz',
        passwordHash: await bcrypt.hash('courier123', 10),
        role: UserRole.COURIER,
        fullName: 'Demo Courier',
        isEmailVerified: true,
      },
    });
    await this.prisma.user.upsert({
      where: { email: 'customer@lochin.uz' },
      update: { fullName: 'Demo Customer', isEmailVerified: true },
      create: {
        email: 'customer@lochin.uz',
        passwordHash: await bcrypt.hash('customer123', 10),
        role: UserRole.CUSTOMER,
        fullName: 'Demo Customer',
        isEmailVerified: true,
      },
    });

    // 3. Seller + Courier profiles
    const seller = await this.prisma.seller.upsert({
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
    await this.prisma.courier.upsert({
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

    // 4. Soft-archive existing demo products to avoid stock drift
    await this.prisma.product.updateMany({
      where: { sellerId: seller.id },
      data: { isActive: false, stock: 0 },
    });

    // 5. Create products
    let created = 0;
    for (const p of PRODUCTS) {
      const categoryId = categoryMap.get(p.categorySlug);
      if (!categoryId) continue;
      // Skip if a product with the same title already exists for this seller
      // (avoids piling duplicates on repeat seed calls).
      const existing = await this.prisma.product.findFirst({
        where: { sellerId: seller.id, title: p.title },
      });
      if (existing) {
        await this.prisma.product.update({
          where: { id: existing.id },
          data: {
            categoryId,
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
      } else {
        await this.prisma.product.create({
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
      }
      created++;
    }

    this.logger.log(`Seed complete: ${created} products, ${CATEGORIES.length} categories`);
    return {
      ok: true,
      adminEmail: adminUser.email,
      sellerEmail: sellerUser.email,
      courierEmail: courierUser.email,
      products: created,
      categories: CATEGORIES.length,
    };
  }
}
