import { PrismaClient, UserRole } from '@prisma/client';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcryptjs') as { hash: (s: string, n: number) => Promise<string> };

const prisma = new PrismaClient();

const CATEGORIES = [
  // Logistics-focused (yirik tovarlar)
  { name: 'Mebel',           slug: 'mebel' },
  { name: 'Maishiy texnika', slug: 'appliances' },
  { name: 'Qurilish',        slug: 'construction' },
  { name: 'Sport va dam',    slug: 'sport' },
  { name: "Bog' va dacha",   slug: 'garden' },
  // Market-style small items
  { name: 'Electronics',     slug: 'electronics' },
  { name: 'Home',            slug: 'home' },
  { name: 'Drinks',          slug: 'drinks' },
  { name: 'Sweets',          slug: 'sweets' },
  { name: 'Pharmacy',        slug: 'pharmacy' },
  { name: 'Beauty',          slug: 'beauty' },
];

async function main() {
  // Platform config — default tariff/commission settings the order/delivery
  // pricing depends on. Required for any real order to be priced correctly.
  await prisma.platformConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default' },
  });

  // Categories — needed so sellers can pick a category when adding products.
  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: c,
    });
  }

  // Admin user — the only seeded account. Sellers/couriers/customers register
  // themselves through their respective apps in production.
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

  console.log('Seed complete', {
    adminId: adminUser.id,
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
