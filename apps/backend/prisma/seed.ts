import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: 'Food', slug: 'food' },
    { name: 'Groceries', slug: 'groceries' },
    { name: 'Home', slug: 'home' },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }

  const adminUser = await prisma.user.upsert({
    where: { phone: '+998900000001' },
    update: { role: UserRole.ADMIN, isPhoneVerified: true },
    create: {
      phone: '+998900000001',
      role: UserRole.ADMIN,
      fullName: 'System Admin',
      isPhoneVerified: true,
    },
  });

  const sellerUser = await prisma.user.upsert({
    where: { phone: '+998900000002' },
    update: { role: UserRole.SELLER, isPhoneVerified: true },
    create: {
      phone: '+998900000002',
      role: UserRole.SELLER,
      fullName: 'Demo Seller',
      isPhoneVerified: true,
    },
  });

  const courierUser = await prisma.user.upsert({
    where: { phone: '+998900000003' },
    update: { role: UserRole.COURIER, isPhoneVerified: true },
    create: {
      phone: '+998900000003',
      role: UserRole.COURIER,
      fullName: 'Demo Courier',
      isPhoneVerified: true,
    },
  });

  await prisma.seller.upsert({
    where: { userId: sellerUser.id },
    update: {
      legalName: 'Demo Seller LLC',
      brandName: 'Demo Market',
      addressText: 'Tashkent center',
      addressLat: 41.3111,
      addressLng: 69.2797,
    },
    create: {
      userId: sellerUser.id,
      legalName: 'Demo Seller LLC',
      brandName: 'Demo Market',
      addressText: 'Tashkent center',
      addressLat: 41.3111,
      addressLng: 69.2797,
    },
  });

  await prisma.courier.upsert({
    where: { userId: courierUser.id },
    update: {
      vehicleType: 'bike',
      isOnline: true,
      isAvailable: true,
    },
    create: {
      userId: courierUser.id,
      vehicleType: 'bike',
      isOnline: true,
      isAvailable: true,
    },
  });

  console.log('Seed complete', {
    adminId: adminUser.id,
    sellerId: sellerUser.id,
    courierId: courierUser.id,
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
