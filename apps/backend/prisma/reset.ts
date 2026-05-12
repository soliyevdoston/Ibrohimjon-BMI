/**
 * Hammasini tozalab, faqat admin + kategoriyalar + platform config qoldiradi.
 * Run: DATABASE_URL=... ts-node prisma/reset.ts
 */
import { PrismaClient, UserRole } from '@prisma/client';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcryptjs') as { hash: (s: string, n: number) => Promise<string> };

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: 'Mebel',           slug: 'mebel' },
  { name: 'Maishiy texnika', slug: 'appliances' },
  { name: 'Qurilish',        slug: 'construction' },
  { name: 'Sport va dam',    slug: 'sport' },
  { name: "Bog' va dacha",   slug: 'garden' },
  { name: 'Electronics',     slug: 'electronics' },
  { name: 'Home',            slug: 'home' },
  { name: 'Drinks',          slug: 'drinks' },
  { name: 'Sweets',          slug: 'sweets' },
  { name: 'Pharmacy',        slug: 'pharmacy' },
  { name: 'Beauty',          slug: 'beauty' },
];

async function main() {
  console.log('→ Truncating all tables...');
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "PayoutItem", "Payout", "LedgerEntry",
      "CourierLocation", "Delivery",
      "OrderStatusHistory", "Payment", "OrderItem", "Order",
      "CustomerCard", "Product", "Category",
      "RefreshToken", "OtpCode",
      "Courier", "Seller", "User",
      "PlatformConfig"
    RESTART IDENTITY CASCADE;
  `);
  console.log('  done.');

  console.log('→ Reseeding minimal data...');
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

  console.log('Reset complete', {
    adminId: adminUser.id,
    adminEmail: 'admin@lochin.uz',
    adminPassword: 'admin123',
    categories: CATEGORIES.length,
  });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
