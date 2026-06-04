import https from 'https';
import http from 'http';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: 20000 }, (res) => {
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        return resolve(downloadImage(res.headers.location));
      }
      if (!res.statusCode || res.statusCode >= 400) {
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

function uns(id: string, w = 800, h = 600): string {
  return `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&q=85&auto=format&fit=crop`;
}

async function saveImg(url: string, label: string): Promise<string> {
  process.stdout.write(`  ${label}...`);
  const data = await downloadImage(url);
  const upload = await prisma.upload.create({ data: { data, mimeType: 'image/jpeg' } });
  process.stdout.write(` OK (${Math.round(data.length / 1024)}kb)\n`);
  return `/api/v1/uploads/${upload.id}`;
}

// Haqiqiy Unsplash CDN photo IDlari
const PRODUCTS: { title: string; main: string; gallery: string[] }[] = [
  {
    title: 'Zamonaviy oshxona stoli',
    main:    uns('1560440021-33f9b867899d'),   // brown wooden dining table + white chairs
    gallery: [uns('1773847521422-77ff84e29353')], // sunlit dining room
  },
  {
    title: "Yumshoq stul",
    main:    uns('1758977403562-1a5fcc5af6b3'),   // wooden chairs with white cushions
    gallery: [],
  },
  {
    title: '3 qavat Javon',
    main:    uns('1593498208667-6b54b5f5e0f0'),   // white wooden bookshelf
    gallery: [],
  },
  {
    title: "Bolalar o'yin stoli",
    main:    uns('1557001755-c09547e21d90'),   // brown study desk
    gallery: [],
  },
  {
    title: 'Temir gardirob',
    main:    uns('1547822280-d923f07fffbd'),   // clothes inside wardrobe
    gallery: [],
  },
  {
    title: 'Gilamcha',
    main:    uns('1757618978085-850cad5b020a'),   // ornate persian rug
    gallery: [],
  },
];

const BANNERS: { title: string; url: string }[] = [
  { title: 'Yozgi chegirmalar — 30% gacha!', url: uns('1560440021-33f9b867899d', 1200, 450) },
  { title: 'Yangi mebel kolleksiyasi',        url: uns('1750040970096-31907e42d6a5', 1200, 450) },
  { title: 'Tez yetkazib berish — 1 soat',    url: uns('1773847521422-77ff84e29353', 1200, 450) },
];

async function main() {
  console.log('\nMahsulot rasmlari yangilanmoqda...\n');

  for (const item of PRODUCTS) {
    const products = await prisma.product.findMany({
      where: { title: { contains: item.title.substring(0, 12) } },
    });
    if (!products.length) { console.log(`  TOPILMADI: ${item.title}`); continue; }

    const mainUrl = await saveImg(item.main, item.title.substring(0, 22));
    const galleryUrls: string[] = [];
    for (let i = 0; i < item.gallery.length; i++) {
      galleryUrls.push(await saveImg(item.gallery[i], `  gallery ${i + 1}`));
    }

    for (const p of products) {
      await prisma.product.update({
        where: { id: p.id },
        data: { imageUrl: mainUrl, imageUrls: galleryUrls },
      });
    }
  }

  console.log('\nBanner rasmlari yangilanmoqda...\n');
  for (const b of BANNERS) {
    const banner = await prisma.banner.findFirst({ where: { title: b.title } });
    if (!banner) { console.log(`  TOPILMADI: ${b.title}`); continue; }
    const url = await saveImg(b.url, b.title.substring(0, 28));
    await prisma.banner.update({ where: { id: banner.id }, data: { imageUrl: url } });
  }

  // Eski orphan uploadlarni tozalash
  const products = await prisma.product.findMany({ select: { imageUrl: true, imageUrls: true } });
  const banners  = await prisma.banner.findMany({ select: { imageUrl: true } });
  const usedIds = new Set<string>();
  for (const p of products) {
    if (p.imageUrl) usedIds.add(p.imageUrl.split('/').pop()!);
    for (const u of p.imageUrls) usedIds.add(u.split('/').pop()!);
  }
  for (const b of banners) {
    if (b.imageUrl) usedIds.add(b.imageUrl.split('/').pop()!);
  }
  const deleted = await prisma.upload.deleteMany({ where: { id: { notIn: [...usedIds] } } });
  console.log(`\n  Eski ${deleted.count} ta orphan upload o'chirildi`);
  console.log('\n✓ Barcha rasmlar yangilandi!\n');
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
