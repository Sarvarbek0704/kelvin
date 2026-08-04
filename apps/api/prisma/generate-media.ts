/**
 * Media fayl generatori — manifest'dagi BARCHA rasm yo'llarini to'ldiradi.
 *
 * Ikki rejim (fayl darajasida, aralash ishlaydi):
 *  1. MASTER: `apps/storefront/public/media/masters/<category-slug>*.jpg`
 *     mavjud bo'lsa — o'sha kategoriya mahsulotlariga real foto tarqatiladi
 *     (bir nechta master bo'lsa deterministik navbat, galereya uchun turli crop).
 *  2. PLACEHOLDER: master yo'q bo'lsa — warm-boutique gradient + mahsulot nomi
 *     yozilgan JPG generatsiya qilinadi (sayt darhol to'liq ko'rinadi).
 *
 * ⚠️ MAVJUD FAYL QAYTA YOZILMAYDI (qo'lda joylangan real rasmlar omon qoladi).
 *    Hammasini qayta yaratish: `--force`.
 *
 * Ishga tushirish: pnpm media:generate  (yoki: tsx prisma/generate-media.ts [--force])
 * Manba: DB (Media.url, Category.imageUrl, Banner.imageUrl — '/media/...' bilan
 * boshlanganlari). Avval `pnpm db:seed` yurgizilgan bo'lishi kerak.
 */
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import sharp from 'sharp';

const prisma = new PrismaClient();
const FORCE = process.argv.includes('--force');

const PUBLIC_DIR = join(process.cwd(), '..', 'storefront', 'public');
const MASTERS_DIR = join(PUBLIC_DIR, 'media', 'masters');

type I18n = { 'uz-Latn'?: string; ru?: string };

/** Kategoriya → gradient ranglari (warm-boutique palitra, har biri farqli). */
const CAT_COLORS: Record<string, [string, string]> = {
  lyustry: ['#3b2f23', '#B08D57'],
  spoty: ['#2a2622', '#8a6d4a'],
  svetilniki: ['#33302a', '#c9a06a'],
  'trekovye-svetilniki': ['#211f1d', '#6f5b41'],
  bra: ['#3a2d2d', '#bf8f63'],
  'ulichnye-svetilniki': ['#232a26', '#7d8a6a'],
  torshery: ['#322a20', '#a8814f'],
  tehnicheskie: ['#26282c', '#7a8494'],
  komplektuyushchie: ['#2b2b28', '#8f8a76'],
  'svetodiodnye-lenty': ['#20242e', '#6a86c9'],
  'nastolnye-lampy': ['#342e1f', '#c2a35c'],
};
const DEFAULT_COLORS: [string, string] = ['#2f2a24', '#B08D57'];

/** Rang o'qi swatch'lari — fayl nomidagi -<color>.jpg uchun. */
const SWATCH: Record<string, string> = {
  gold: '#D4AF37', chrome: '#C0C0C0', black: '#1A1A1A', nickel: '#B0B0A8',
  white: '#F5F2EC', grey: '#8B8B8B', brass: '#B5A642',
};

function esc(s: string): string {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

/** Nomni 2 qatorga bo'lish (uzun nomlar chetga chiqmasin). */
function wrap(name: string, max = 18): string[] {
  if (name.length <= max) {
    return [name];
  }
  const words = name.split(' ');
  const lines: string[] = [''];
  for (const w of words) {
    const cur = lines[lines.length - 1]!;
    if (cur.length + w.length + 1 > max && cur.length > 0) {
      lines.push(w);
    } else {
      lines[lines.length - 1] = cur.length === 0 ? w : `${cur} ${w}`;
    }
  }
  return lines.slice(0, 2);
}

function det(i: number, salt = 0): number {
  let x = ((i + 1) * 2654435761 + (salt + 1) * 40503) >>> 0;
  x = ((x ^ (x >>> 13)) * 1274126177) >>> 0;
  return (x % 100000) / 100000;
}

interface Target {
  url: string;
  width: number;
  height: number;
  title: string;
  subtitle: string;
  categorySlug: string;
  /** Galereya raqami (crop variatsiyasi uchun) — muqova 0. */
  seq: number;
  swatch?: string;
}

function placeholderSvg(t: Target): string {
  const [c1, c2] = CAT_COLORS[t.categorySlug] ?? DEFAULT_COLORS;
  const lines = wrap(t.title);
  const cx = t.width / 2;
  const baseY = t.height / 2 - (lines.length > 1 ? 16 : 0);
  const fontTitle = Math.round(Math.min(t.width, t.height) / 16);
  const fontSub = Math.round(fontTitle * 0.55);
  const glowR = Math.min(t.width, t.height) * 0.45;

  return `<svg width="${String(t.width)}" height="${String(t.height)}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}" stop-opacity="0.55"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.55">
      <stop offset="0" stop-color="#ffe9c4" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#ffe9c4" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <circle cx="${String(cx)}" cy="${String(t.height * 0.42)}" r="${String(glowR)}" fill="url(#glow)"/>
  <text x="${String(cx)}" y="${String(t.height * 0.14)}" text-anchor="middle" font-family="Georgia, serif" font-size="${String(fontSub)}" letter-spacing="6" fill="#e8dcc8" opacity="0.9">KELVIN</text>
  ${lines
    .map(
      (ln, i) =>
        `<text x="${String(cx)}" y="${String(baseY + i * (fontTitle + 8))}" text-anchor="middle" font-family="Georgia, serif" font-size="${String(fontTitle)}" fill="#f6efe3">${esc(ln)}</text>`,
    )
    .join('\n  ')}
  <text x="${String(cx)}" y="${String(baseY + lines.length * (fontTitle + 8) + fontSub)}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${String(fontSub)}" letter-spacing="2" fill="#d9cbb2" opacity="0.85">${esc(t.subtitle.toUpperCase())}</text>
  ${t.swatch !== undefined ? `<circle cx="${String(cx)}" cy="${String(t.height * 0.82)}" r="${String(fontSub)}" fill="${t.swatch}" stroke="#f6efe3" stroke-width="3"/>` : ''}
</svg>`;
}

/** masters/ dagi shu kategoriyaga tegishli fayllar (nom bo'yicha prefiks). */
function mastersFor(categorySlug: string, all: string[]): string[] {
  return all.filter((f) => f.startsWith(categorySlug)).sort();
}

const CROPS = ['centre', 'north', 'south', 'east', 'west'] as const;

async function render(t: Target, masters: string[], stats: { master: number; placeholder: number; skipped: number }): Promise<void> {
  const out = join(PUBLIC_DIR, t.url.replaceAll('/', '\\').replace(/^\\/, ''));
  const exists = existsSync(out);
  if (!FORCE && exists) {
    stats.skipped += 1;
    return;
  }
  mkdirSync(dirname(out), { recursive: true });

  // 1) ANIQ NOM master: masters/<fayl-nomi> (masalan home-hero-1.jpg yoki
  //    aurora-8l-1.jpg) — aynan shu yo'lga pin qilinadi.
  const base = t.url.split('/').pop()!;
  const exact = masters.find((f) => f.toLowerCase() === base.toLowerCase());
  // 2) KATEGORIYA master(lar)i — deterministik tanlov + crop variatsiyasi.
  const catMasters = mastersFor(t.categorySlug, masters);
  const master = exact ?? (catMasters.length > 0 ? catMasters[Math.floor(det(hash(t.url)) * catMasters.length) % catMasters.length]! : undefined);

  if (master !== undefined) {
    const crop = exact !== undefined ? 'centre' : CROPS[t.seq % CROPS.length]!;
    await sharp(join(MASTERS_DIR, master))
      .resize(t.width, t.height, { fit: 'cover', position: crop })
      .jpeg({ quality: 82 })
      .toFile(out);
    stats.master += 1;
    return;
  }

  // ⚠️ Placeholder MAVJUD faylni HECH QACHON qayta yozmaydi (--force bilan ham) —
  //    qo'lda joylangan real rasm placeholder'ga almashib ketmasin.
  if (exists) {
    stats.skipped += 1;
    return;
  }
  await sharp(Buffer.from(placeholderSvg(t))).jpeg({ quality: 82 }).toFile(out);
  stats.placeholder += 1;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

async function main(): Promise<void> {
  mkdirSync(MASTERS_DIR, { recursive: true });
  const masterFiles = readdirSync(MASTERS_DIR).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  console.log(`Masters: ${String(masterFiles.length)} ta (${MASTERS_DIR})`);

  const targets: Target[] = [];

  const cats = await prisma.category.findMany({ where: { imageUrl: { startsWith: '/media/' } } });
  const catNameBySlug = new Map<string, string>();
  for (const c of cats) {
    const name = (c.name as I18n)['uz-Latn'] ?? c.slug;
    catNameBySlug.set(c.slug, name);
    targets.push({ url: c.imageUrl!, width: 800, height: 800, title: name, subtitle: 'Kategoriya', categorySlug: c.slug, seq: 0 });
  }

  const media = await prisma.media.findMany({
    where: { url: { startsWith: '/media/' } },
    include: { product: { include: { category: true } } },
  });
  for (const m of media) {
    if (m.product === null) {
      continue;
    }
    const catSlug = m.product.category.slug;
    const title = ((m.product.name as I18n)['uz-Latn'] ?? m.product.slug);
    const colorMatch = /-([a-z]+)\.jpg$/.exec(m.url);
    const swatch = colorMatch !== null ? SWATCH[colorMatch[1]!] : undefined;
    targets.push({
      url: m.url, width: 800, height: 800, title,
      subtitle: catNameBySlug.get(catSlug) ?? catSlug,
      categorySlug: catSlug, seq: m.sortOrder,
      ...(swatch !== undefined && { swatch }),
    });
  }

  const banners = await prisma.banner.findMany({ where: { imageUrl: { startsWith: '/media/' } } });
  for (const b of banners) {
    const isStrip = b.imageUrl.includes('strip');
    targets.push({
      url: b.imageUrl, width: 1600, height: isStrip ? 320 : 640,
      title: (b.title as I18n)['uz-Latn'] ?? 'Kelvin', subtitle: 'Aksiya',
      categorySlug: 'banner', seq: 0,
    });
  }

  // Bir xil URL ikki marta chizilmasin (variant media takrori bo'lishi mumkin).
  const seen = new Set<string>();
  const unique = targets.filter((t) => (seen.has(t.url) ? false : (seen.add(t.url), true)));

  const stats = { master: 0, placeholder: 0, skipped: 0 };
  for (const t of unique) {
    await render(t, masterFiles, stats);
  }

  console.log(`✓ ${String(unique.length)} yo'l: master ${String(stats.master)}, placeholder ${String(stats.placeholder)}, o'tkazildi (mavjud) ${String(stats.skipped)}`);
  if (masterFiles.length === 0) {
    console.log('  Maslahat: media/masters/ ga "<category-slug>.jpg" (masalan lyustry.jpg, spoty-2.jpg)');
    console.log('  real foto tashlang va --force bilan qayta yurgizing — o\'sha kategoriya rasmlari real bo\'ladi.');
  }
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
