/**
 * Dev seed — IDEMPOTENT (upsert). `pnpm db:seed`.
 *
 * ⚠️ Prod seed HECH QANDAY hisob yaratmaydi. `dorixona`'da admin/admin123
 *    seeder har ishga tushganda ishlar va parolni konsolga chop etardi —
 *    bu TAKRORLANMAYDI. Bu yerda hisoblar faqat NODE_ENV !== production da.
 *
 * @see docs/03-data-model.md §8
 */
import { randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Prisma, PrismaClient, type Role } from '@prisma/client';
import * as argon2 from 'argon2';

import { computeIpSatisfies } from '../src/core/catalog/ip-rating';

const prisma = new PrismaClient();

type I18n = { 'uz-Latn': string; 'uz-Cyrl': string; ru: string };

// --- 1. Kategoriyalar — Figma footer'idagi 11 ta ----------------------------
const CATEGORIES: { slug: string; name: I18n }[] = [
  { slug: 'lyustry', name: { 'uz-Latn': 'Qandillar', 'uz-Cyrl': 'Қандиллар', ru: 'Люстры' } },
  { slug: 'spoty', name: { 'uz-Latn': 'Spotlar', 'uz-Cyrl': 'Спотлар', ru: 'Споты' } },
  {
    slug: 'svetilniki',
    name: { 'uz-Latn': 'Chiroqlar', 'uz-Cyrl': 'Чироқлар', ru: 'Светильники' },
  },
  {
    slug: 'trekovye-svetilniki',
    name: { 'uz-Latn': 'Trek chiroqlari', 'uz-Cyrl': 'Трек чироқлари', ru: 'Трековые светильники' },
  },
  { slug: 'bra', name: { 'uz-Latn': 'Bra (devor)', 'uz-Cyrl': 'Бра (девор)', ru: 'Бра' } },
  {
    slug: 'ulichnye-svetilniki',
    name: {
      'uz-Latn': "Ko'cha chiroqlari",
      'uz-Cyrl': 'Кўча чироқлари',
      ru: 'Уличные светильники',
    },
  },
  { slug: 'torshery', name: { 'uz-Latn': 'Torsherlar', 'uz-Cyrl': 'Торшерлар', ru: 'Торшеры' } },
  {
    slug: 'tehnicheskie',
    name: { 'uz-Latn': 'Texnik', 'uz-Cyrl': 'Техник', ru: 'Технические' },
  },
  {
    slug: 'komplektuyushchie',
    name: { 'uz-Latn': 'Butlovchi qismlar', 'uz-Cyrl': 'Бутловчи қисмлар', ru: 'Комплектующие' },
  },
  {
    slug: 'svetodiodnye-lenty',
    name: { 'uz-Latn': 'LED lentalar', 'uz-Cyrl': 'ЛЕДленталар', ru: 'Светодиодные ленты' },
  },
  {
    slug: 'nastolnye-lampy',
    name: { 'uz-Latn': 'Stol chiroqlari', 'uz-Cyrl': 'Стол чироқлари', ru: 'Настольные лампы' },
  },
];

// --- 2. Atributlar — yoritgichga xos (docs/05 §2) ---------------------------
interface AttrSeed {
  code: string;
  type: 'ENUM' | 'NUMBER' | 'BOOLEAN' | 'TEXT' | 'ORDINAL';
  name: I18n;
  unit?: string;
  isVariantAxis?: boolean;
  isFilterable?: boolean;
  values?: { code: string; label: I18n; hexColor?: string; rank?: number }[];
}

const en = (s: string): I18n => ({ 'uz-Latn': s, 'uz-Cyrl': s, ru: s });

const ATTRIBUTES: AttrSeed[] = [
  {
    code: 'color_temperature',
    type: 'ENUM',
    unit: 'K',
    name: { 'uz-Latn': 'Rang harorati', 'uz-Cyrl': 'Ранг ҳарорати', ru: 'Цветовая температура' },
    values: [
      {
        code: '2700',
        label: { 'uz-Latn': 'Issiq oq', 'uz-Cyrl': 'Иссиқ оқ', ru: 'Тёплый белый' },
        hexColor: '#FFB46B',
      },
      {
        code: '3000',
        label: { 'uz-Latn': 'Yumshoq oq', 'uz-Cyrl': 'Юмшоқ оқ', ru: 'Мягкий белый' },
        hexColor: '#FFD3A5',
      },
      {
        code: '4000',
        label: { 'uz-Latn': 'Neytral oq', 'uz-Cyrl': 'Нейтрал оқ', ru: 'Нейтральный белый' },
        hexColor: '#FFF3E0',
      },
      {
        code: '5000',
        label: { 'uz-Latn': 'Kunduzgi', 'uz-Cyrl': 'Кундузги', ru: 'Дневной' },
        hexColor: '#F5F8FF',
      },
      {
        code: '6500',
        label: { 'uz-Latn': 'Sovuq oq', 'uz-Cyrl': 'Совуқ оқ', ru: 'Холодный белый' },
        hexColor: '#E3ECFF',
      },
    ],
  },
  {
    code: 'socket_type',
    type: 'ENUM',
    isVariantAxis: false,
    name: { 'uz-Latn': 'Tsokol', 'uz-Cyrl': 'Цоколь', ru: 'Цоколь' },
    values: ['E27', 'E14', 'GU10', 'G9', 'GX53'].map((c) => ({
      code: c,
      label: { 'uz-Latn': c, 'uz-Cyrl': c, ru: c },
    })),
  },
  {
    code: 'ip_rating',
    type: 'TEXT',
    name: { 'uz-Latn': 'IP darajasi', 'uz-Cyrl': 'IP даражаси', ru: 'Степень защиты IP' },
    // ⚠️ IP — qisman tartib. ORDINAL EMAS. Filtr ProductVariant.ipSatisfies
    //    materializatsiyasi orqali (docs/03 §3.3). rank ISHLATILMAYDI.
    values: ['IP20', 'IP44', 'IP54', 'IP65', 'IP67'].map((c) => ({
      code: c,
      label: { 'uz-Latn': c, 'uz-Cyrl': c, ru: c },
    })),
  },
  {
    code: 'luminous_flux',
    type: 'NUMBER',
    unit: 'lm',
    name: { 'uz-Latn': 'Yorug‘lik oqimi', 'uz-Cyrl': 'Ёруғлик оқими', ru: 'Световой поток' },
  },
  {
    code: 'cri',
    type: 'NUMBER',
    unit: 'Ra',
    name: {
      'uz-Latn': 'Rang uzatish (CRI)',
      'uz-Cyrl': 'Ранг узатиш (CRI)',
      ru: 'Цветопередача (CRI)',
    },
  },
  {
    code: 'power',
    type: 'NUMBER',
    unit: 'W',
    name: { 'uz-Latn': 'Quvvat', 'uz-Cyrl': 'Қувват', ru: 'Мощность' },
  },
  {
    code: 'dimmable',
    type: 'BOOLEAN',
    name: { 'uz-Latn': 'Yorqinlik boshqaruvi', 'uz-Cyrl': 'Ёрқинлик бошқаруви', ru: 'Диммируемый' },
  },
  {
    code: 'color',
    type: 'ENUM',
    isVariantAxis: true,
    name: { 'uz-Latn': 'Rang', 'uz-Cyrl': 'Ранг', ru: 'Цвет' },
    values: [
      {
        code: 'chrome',
        label: { 'uz-Latn': 'Xrom', 'uz-Cyrl': 'Хром', ru: 'Хром' },
        hexColor: '#C0C0C0',
      },
      {
        code: 'gold',
        label: { 'uz-Latn': 'Oltin', 'uz-Cyrl': 'Олтин', ru: 'Золото' },
        hexColor: '#D4AF37',
      },
      {
        code: 'black',
        label: { 'uz-Latn': 'Qora', 'uz-Cyrl': 'Қора', ru: 'Чёрный' },
        hexColor: '#1A1A1A',
      },
      {
        code: 'nickel',
        label: { 'uz-Latn': 'Nikel', 'uz-Cyrl': 'Никель', ru: 'Никель' },
        hexColor: '#B0B0A8',
      },
    ],
  },
  {
    code: 'bulb_count',
    type: 'NUMBER',
    unit: 'dona',
    isVariantAxis: true,
    name: { 'uz-Latn': 'Lampalar soni', 'uz-Cyrl': 'Лампалар сони', ru: 'Количество ламп' },
    values: ['1', '3', '6', '8', '12'].map((c) => ({ code: c, label: en(c) })),
  },
  {
    code: 'voltage',
    type: 'ENUM',
    unit: 'V',
    name: { 'uz-Latn': 'Kuchlanish', 'uz-Cyrl': 'Кучланиш', ru: 'Напряжение' },
    values: ['220', '12', '24'].map((c) => ({ code: c, label: en(`${c}V`) })),
  },
  {
    code: 'beam_angle',
    type: 'NUMBER',
    unit: '°',
    name: { 'uz-Latn': 'Nur burchagi', 'uz-Cyrl': 'Нур бурчаги', ru: 'Угол луча' },
  },
  {
    code: 'bulbs_included',
    type: 'BOOLEAN',
    name: { 'uz-Latn': 'Lampalar bilan', 'uz-Cyrl': 'Лампалар билан', ru: 'Лампы в комплекте' },
  },
  {
    code: 'light_source',
    type: 'ENUM',
    name: { 'uz-Latn': 'Yorug‘lik manbai', 'uz-Cyrl': 'Ёруғлик манбаи', ru: 'Источник света' },
    values: [
      { code: 'led', label: en('LED') },
      { code: 'halogen', label: { 'uz-Latn': 'Galogen', 'uz-Cyrl': 'Галоген', ru: 'Галоген' } },
      {
        code: 'incandescent',
        label: { 'uz-Latn': 'Cho‘g‘lanma', 'uz-Cyrl': 'Чўғланма', ru: 'Лампа накаливания' },
      },
    ],
  },
  {
    code: 'mount_type',
    type: 'ENUM',
    name: { 'uz-Latn': 'O‘rnatish turi', 'uz-Cyrl': 'Ўрнатиш тури', ru: 'Тип монтажа' },
    values: [
      { code: 'ceiling', label: { 'uz-Latn': 'Shift', 'uz-Cyrl': 'Шифт', ru: 'Потолочный' } },
      { code: 'wall', label: { 'uz-Latn': 'Devor', 'uz-Cyrl': 'Девор', ru: 'Настенный' } },
      { code: 'pendant', label: { 'uz-Latn': 'Osma', 'uz-Cyrl': 'Осма', ru: 'Подвесной' } },
      {
        code: 'recessed',
        label: { 'uz-Latn': 'O‘rnatiladigan', 'uz-Cyrl': 'Ўрнатиладиган', ru: 'Встраиваемый' },
      },
    ],
  },
  {
    code: 'material',
    type: 'ENUM',
    name: { 'uz-Latn': 'Material', 'uz-Cyrl': 'Материал', ru: 'Материал' },
    values: [
      { code: 'glass', label: { 'uz-Latn': 'Shisha', 'uz-Cyrl': 'Шиша', ru: 'Стекло' } },
      { code: 'crystal', label: { 'uz-Latn': 'Kristall', 'uz-Cyrl': 'Кристалл', ru: 'Хрусталь' } },
      { code: 'metal', label: { 'uz-Latn': 'Metall', 'uz-Cyrl': 'Металл', ru: 'Металл' } },
      { code: 'wood', label: { 'uz-Latn': 'Yog‘och', 'uz-Cyrl': 'Ёғоч', ru: 'Дерево' } },
    ],
  },
  {
    code: 'dimensions',
    type: 'TEXT',
    unit: 'mm',
    name: { 'uz-Latn': 'O‘lchamlar', 'uz-Cyrl': 'Ўлчамлар', ru: 'Габариты' },
  },
  {
    code: 'weight',
    type: 'NUMBER',
    unit: 'g',
    isFilterable: false, // yetkazib berish uchun — mijozga ko'rinmaydi (§2.1)
    name: { 'uz-Latn': 'Og‘irlik', 'uz-Cyrl': 'Оғирлик', ru: 'Вес' },
  },
];

// --- 3. Omborlar ------------------------------------------------------------
const WAREHOUSES: { code: string; name: I18n; kind: string; isSellable: boolean }[] = [
  {
    code: 'MAIN',
    name: { 'uz-Latn': 'Asosiy ombor', 'uz-Cyrl': 'Асосий омбор', ru: 'Основной склад' },
    kind: 'MAIN',
    isSellable: true,
  },
  {
    code: 'SHOWROOM',
    // Do'kon zali — offline POS uchun onlayndan AJRATILGAN qoldiq (docs/15 §10.1)
    name: { 'uz-Latn': "Do'kon zali", 'uz-Cyrl': 'Дўкон зали', ru: 'Торговый зал' },
    kind: 'SHOWROOM',
    isSellable: true,
  },
];

// --- 4. Dev hisoblar (FAQAT dev) --------------------------------------------
const DEV_USERS: { email: string; role: Role }[] = [
  { email: 'owner@kelvin.uz', role: 'OWNER' },
  { email: 'admin@kelvin.uz', role: 'ADMIN' },
  { email: 'content@kelvin.uz', role: 'CONTENT_MANAGER' },
  { email: 'sales@kelvin.uz', role: 'SALES' },
  { email: 'warehouse@kelvin.uz', role: 'WAREHOUSE' },
  { email: 'accountant@kelvin.uz', role: 'ACCOUNTANT' },
  { email: 'courier@kelvin.uz', role: 'COURIER' }, // jo'natmaga tayinlash uchun
  { email: 'installer@kelvin.uz', role: 'INSTALLER' }, // o'rnatuvchi
  { email: 'sales2@kelvin.uz', role: 'SALES' }, // ikkinchi sotuvchi (lid taqsimoti)
];

async function seedCategories(): Promise<void> {
  for (let i = 0; i < CATEGORIES.length; i++) {
    const c = CATEGORIES[i]!;
    // Rasm — statik yo'l konvensiyasi (media-manifest.md). Fayl bo'lmasa
    // storefront placeholder ko'rsatadi, crash yo'q.
    const imageUrl = `/media/categories/${c.slug}.jpg`;
    await prisma.category.upsert({
      where: { slug: c.slug },
      create: {
        slug: c.slug,
        name: c.name,
        path: `/${c.slug}/`,
        depth: 0,
        sortOrder: i,
        imageUrl,
      },
      update: { name: c.name, sortOrder: i, imageUrl },
    });
  }
  console.log(`  ✓ ${String(CATEGORIES.length)} kategoriya (+imageUrl)`);
}

async function seedAttributes(): Promise<void> {
  for (let i = 0; i < ATTRIBUTES.length; i++) {
    const a = ATTRIBUTES[i]!;
    const attribute = await prisma.attribute.upsert({
      where: { code: a.code },
      create: {
        code: a.code,
        type: a.type,
        name: a.name,
        ...(a.unit !== undefined && { unit: a.unit }),
        isVariantAxis: a.isVariantAxis ?? false,
        isFilterable: a.isFilterable ?? true,
        sortOrder: i,
      },
      update: {
        name: a.name,
        isVariantAxis: a.isVariantAxis ?? false,
        isFilterable: a.isFilterable ?? true,
        sortOrder: i,
      },
    });

    for (let j = 0; j < (a.values?.length ?? 0); j++) {
      const v = a.values![j]!;
      await prisma.attributeValue.upsert({
        where: { attributeId_code: { attributeId: attribute.id, code: v.code } },
        create: {
          attributeId: attribute.id,
          code: v.code,
          label: v.label,
          ...(v.hexColor !== undefined && { hexColor: v.hexColor }),
          ...(v.rank !== undefined && { rank: v.rank }),
          sortOrder: j,
        },
        update: {
          label: v.label,
          ...(v.hexColor !== undefined && { hexColor: v.hexColor }),
          sortOrder: j,
        },
      });
    }
  }
  console.log(`  ✓ ${String(ATTRIBUTES.length)} atribut`);
}

async function seedWarehouses(): Promise<void> {
  for (const w of WAREHOUSES) {
    await prisma.warehouse.upsert({
      where: { code: w.code },
      create: {
        code: w.code,
        name: w.name,
        kind: w.kind,
        isSellable: w.isSellable,
      },
      update: { name: w.name },
    });
  }
  console.log(`  ✓ ${String(WAREHOUSES.length)} ombor`);
}

async function seedDevUsers(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    console.log('  ⏭  Prod muhiti — dev hisoblar YARATILMAYDI');
    return;
  }

  const password = process.env.SEED_DEV_PASSWORD ?? 'kelvin-dev-password';
  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  for (const u of DEV_USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      create: {
        email: u.email,
        passwordHash,
        status: 'ACTIVE',
        emailVerified: true,
        locale: 'uz-Latn',
      },
      update: { passwordHash, status: 'ACTIVE' },
    });
    // Global rol — idempotent (null scope uchun deleteMany + create).
    await prisma.userRole.deleteMany({ where: { userId: user.id, scopeType: null } });
    await prisma.userRole.create({ data: { userId: user.id, role: u.role } });
  }

  console.log(`  ✓ ${String(DEV_USERS.length)} dev hisob`);
  console.log('  ⚠️  DEV ONLY — hisoblar (barcha rollar):');
  for (const u of DEV_USERS) {
    console.log(`     ${u.email}  (${u.role})`);
  }
  // customer@kelvin.uz showcase'da yaratiladi — bir blokda ko'rinishi uchun shu yerda ham chop etamiz.
  console.log('     customer@kelvin.uz  (CUSTOMER — storefront demo mijoz)');
  console.log(`     parol: ${password}`);
  // ⚠️ INSTALLER uchun alohida profil jadvali sxemada YO'Q (Courier'dan farqli) —
  //    o'rnatuvchi hozircha faqat User+rol. Texnik profil kerak bo'lsa — alohida faza.
}

// --- 5. Demo katalog (FAQAT dev) — storefront jonli ko'rinishi uchun ----------
interface DemoVariant {
  sku: string;
  axisValues: Record<string, string>;
  colorTemperature: number;
  socketType: string;
  ipRating: string;
  priceTiyin: bigint;
  stock: number;
  // Boy atributlar — berilmasa enrich() deterministik to'ldiradi.
  luminousFlux?: number;
  cri?: number;
  powerW?: number;
  voltage?: number;
  dimmable?: boolean;
  beamAngle?: number;
  bulbsIncluded?: boolean;
  lightSource?: string;
  mountType?: string;
  material?: string;
  dimensions?: string;
  weightGrams?: number;
}
interface DemoProduct {
  slug: string;
  categorySlug: string;
  name: I18n;
  brand: string;
  isFragile: boolean;
  variants: DemoVariant[];
  description?: I18n;
  requiresInstallation?: boolean;
  variantAxes?: { attributeCode: string; valueCodes: string[] }[];
}

const DEMO_PRODUCTS: DemoProduct[] = [
  {
    slug: 'aurora-8l',
    categorySlug: 'lyustry',
    name: { 'uz-Latn': 'Aurora 8L qandil', 'uz-Cyrl': 'Aurora 8L қандил', ru: 'Люстра Aurora 8L' },
    brand: 'Kelvin',
    isFragile: true,
    variants: [
      {
        sku: 'AUR-8L-GOLD',
        axisValues: { color: 'gold' },
        colorTemperature: 3000,
        socketType: 'E27',
        ipRating: 'IP20',
        priceTiyin: 320_000_000n,
        stock: 12,
      },
      {
        sku: 'AUR-8L-CHROME',
        axisValues: { color: 'chrome' },
        colorTemperature: 4000,
        socketType: 'E27',
        ipRating: 'IP20',
        priceTiyin: 340_000_000n,
        stock: 8,
      },
    ],
  },
  {
    slug: 'bolt-spot',
    categorySlug: 'spoty',
    name: { 'uz-Latn': 'Bolt spot', 'uz-Cyrl': 'Bolt спот', ru: 'Спот Bolt' },
    brand: 'Kelvin',
    isFragile: false,
    variants: [
      {
        sku: 'BOLT-GU10-WHITE',
        axisValues: { color: 'white' },
        colorTemperature: 4000,
        socketType: 'GU10',
        ipRating: 'IP44',
        priceTiyin: 95_000_000n,
        stock: 40,
      },
      {
        sku: 'BOLT-GU10-BLACK',
        axisValues: { color: 'black' },
        colorTemperature: 3000,
        socketType: 'GU10',
        ipRating: 'IP44',
        priceTiyin: 98_000_000n,
        stock: 35,
      },
    ],
  },
  {
    slug: 'nova-bra',
    categorySlug: 'bra',
    name: { 'uz-Latn': 'Nova devor chirog‘i', 'uz-Cyrl': 'Nova девор чироғи', ru: 'Бра Nova' },
    brand: 'Kelvin',
    isFragile: true,
    variants: [
      {
        sku: 'NOVA-E14-BRASS',
        axisValues: { color: 'brass' },
        colorTemperature: 2700,
        socketType: 'E14',
        ipRating: 'IP20',
        priceTiyin: 78_000_000n,
        stock: 25,
      },
    ],
  },
  {
    slug: 'crystal-royal-12l',
    categorySlug: 'lyustry',
    name: {
      'uz-Latn': 'Royal Crystal 12L qandil',
      'uz-Cyrl': 'Royal Crystal 12L қандил',
      ru: 'Люстра Royal Crystal 12L',
    },
    brand: 'LuxLight',
    isFragile: true,
    variants: [
      {
        sku: 'ROYAL-12L-GOLD',
        axisValues: { color: 'gold' },
        colorTemperature: 2700,
        socketType: 'E14',
        ipRating: 'IP20',
        priceTiyin: 890_000_000n,
        stock: 5,
      },
      {
        sku: 'ROYAL-12L-CHROME',
        axisValues: { color: 'chrome' },
        colorTemperature: 3000,
        socketType: 'E14',
        ipRating: 'IP20',
        priceTiyin: 920_000_000n,
        stock: 3,
      },
    ],
  },
  {
    slug: 'linea-track-3',
    categorySlug: 'trekovye-svetilniki',
    name: { 'uz-Latn': 'Linea trek 3-li', 'uz-Cyrl': 'Linea трек 3-ли', ru: 'Трековый Linea 3' },
    brand: 'Kelvin',
    isFragile: false,
    variants: [
      {
        sku: 'LINEA-TR3-BLACK',
        axisValues: { color: 'black' },
        colorTemperature: 4000,
        socketType: 'GU10',
        ipRating: 'IP20',
        priceTiyin: 145_000_000n,
        stock: 30,
      },
      {
        sku: 'LINEA-TR3-WHITE',
        axisValues: { color: 'white' },
        colorTemperature: 4000,
        socketType: 'GU10',
        ipRating: 'IP20',
        priceTiyin: 145_000_000n,
        stock: 28,
      },
    ],
  },
  {
    slug: 'lumen-panel-40',
    categorySlug: 'svetilniki',
    name: { 'uz-Latn': 'Lumen panel 40W', 'uz-Cyrl': 'Lumen панел 40W', ru: 'Панель Lumen 40W' },
    brand: 'BrightPro',
    isFragile: false,
    variants: [
      {
        sku: 'LUMEN-P40-4000',
        axisValues: { color: 'white' },
        colorTemperature: 4000,
        socketType: 'E27',
        ipRating: 'IP40',
        priceTiyin: 62_000_000n,
        stock: 60,
      },
      {
        sku: 'LUMEN-P40-6500',
        axisValues: { color: 'white' },
        colorTemperature: 6500,
        socketType: 'E27',
        ipRating: 'IP40',
        priceTiyin: 62_000_000n,
        stock: 55,
      },
    ],
  },
  {
    slug: 'stella-torsher',
    categorySlug: 'torshery',
    name: { 'uz-Latn': 'Stella torsher', 'uz-Cyrl': 'Stella торшер', ru: 'Торшер Stella' },
    brand: 'HomeLux',
    isFragile: true,
    variants: [
      {
        sku: 'STELLA-TRS-BLACK',
        axisValues: { color: 'black' },
        colorTemperature: 3000,
        socketType: 'E27',
        ipRating: 'IP20',
        priceTiyin: 210_000_000n,
        stock: 14,
      },
    ],
  },
  {
    slug: 'desk-arc-lamp',
    categorySlug: 'nastolnye-lampy',
    name: {
      'uz-Latn': 'Arc stol chirog‘i',
      'uz-Cyrl': 'Arc стол чироғи',
      ru: 'Настольная лампа Arc',
    },
    brand: 'HomeLux',
    isFragile: false,
    variants: [
      {
        sku: 'ARC-DESK-WHITE',
        axisValues: { color: 'white' },
        colorTemperature: 4000,
        socketType: 'E14',
        ipRating: 'IP20',
        priceTiyin: 48_000_000n,
        stock: 42,
      },
      {
        sku: 'ARC-DESK-BLACK',
        axisValues: { color: 'black' },
        colorTemperature: 4000,
        socketType: 'E14',
        ipRating: 'IP20',
        priceTiyin: 48_000_000n,
        stock: 38,
      },
    ],
  },
  {
    slug: 'led-strip-5m',
    categorySlug: 'svetodiodnye-lenty',
    name: { 'uz-Latn': 'LED lenta 5m RGB', 'uz-Cyrl': 'LED лента 5m RGB', ru: 'LED лента 5м RGB' },
    brand: 'Kelvin',
    isFragile: false,
    variants: [
      {
        sku: 'LED-STRIP-RGB5',
        axisValues: { color: 'white' },
        colorTemperature: 6500,
        socketType: 'E27',
        ipRating: 'IP65',
        priceTiyin: 35_000_000n,
        stock: 120,
      },
    ],
  },
  {
    slug: 'orion-spot-cob',
    categorySlug: 'spoty',
    name: { 'uz-Latn': 'Orion COB spot', 'uz-Cyrl': 'Orion COB спот', ru: 'Спот Orion COB' },
    brand: 'BrightPro',
    isFragile: false,
    variants: [
      {
        sku: 'ORION-COB-WHITE',
        axisValues: { color: 'white' },
        colorTemperature: 4000,
        socketType: 'GU10',
        ipRating: 'IP44',
        priceTiyin: 72_000_000n,
        stock: 48,
      },
      {
        sku: 'ORION-COB-BLACK',
        axisValues: { color: 'black' },
        colorTemperature: 3000,
        socketType: 'GU10',
        ipRating: 'IP44',
        priceTiyin: 74_000_000n,
        stock: 44,
      },
    ],
  },
  {
    slug: 'garden-park-ip65',
    categorySlug: 'ulichnye-svetilniki',
    name: {
      'uz-Latn': 'Park ko‘cha chirog‘i',
      'uz-Cyrl': 'Park кўча чироғи',
      ru: 'Уличный светильник Park',
    },
    brand: 'OutLight',
    isFragile: false,
    variants: [
      {
        sku: 'PARK-IP65-GREY',
        axisValues: { color: 'grey' },
        colorTemperature: 4000,
        socketType: 'E27',
        ipRating: 'IP65',
        priceTiyin: 165_000_000n,
        stock: 22,
      },
    ],
  },
  {
    slug: 'vega-bra-led',
    categorySlug: 'bra',
    name: { 'uz-Latn': 'Vega LED bra', 'uz-Cyrl': 'Vega LED бра', ru: 'Бра Vega LED' },
    brand: 'Kelvin',
    isFragile: true,
    variants: [
      {
        sku: 'VEGA-LED-GOLD',
        axisValues: { color: 'gold' },
        colorTemperature: 3000,
        socketType: 'E14',
        ipRating: 'IP20',
        priceTiyin: 92_000_000n,
        stock: 33,
      },
    ],
  },
  {
    slug: 'atlas-chandelier-6l',
    categorySlug: 'lyustry',
    name: { 'uz-Latn': 'Atlas 6L qandil', 'uz-Cyrl': 'Atlas 6L қандил', ru: 'Люстра Atlas 6L' },
    brand: 'LuxLight',
    isFragile: true,
    variants: [
      {
        sku: 'ATLAS-6L-BLACK',
        axisValues: { color: 'black' },
        colorTemperature: 3000,
        socketType: 'E27',
        ipRating: 'IP20',
        priceTiyin: 260_000_000n,
        stock: 10,
      },
      {
        sku: 'ATLAS-6L-GOLD',
        axisValues: { color: 'gold' },
        colorTemperature: 2700,
        socketType: 'E27',
        ipRating: 'IP20',
        priceTiyin: 275_000_000n,
        stock: 9,
      },
    ],
  },
  {
    slug: 'mini-downlight-7w',
    categorySlug: 'svetilniki',
    name: {
      'uz-Latn': 'Mini downlight 7W',
      'uz-Cyrl': 'Mini downlight 7W',
      ru: 'Точечный Mini 7W',
    },
    brand: 'Kelvin',
    isFragile: false,
    variants: [
      {
        sku: 'MINI-DL-7W-WHITE',
        axisValues: { color: 'white' },
        colorTemperature: 4000,
        socketType: 'GU10',
        ipRating: 'IP20',
        priceTiyin: 24_000_000n,
        stock: 200,
      },
    ],
  },
];

// --- 5b. Programmatik generator — jami ~70 mahsulot (docs/05) ----------------
// ⚠️ DETERMINISTIK: Math.random YO'Q — indexdan pseudo-random. Har re-seed
//    bir xil natija beradi (barqaror demo, upsert idempotent).

function det(i: number, salt = 0): number {
  let x = ((i + 1) * 2654435761 + (salt + 1) * 40503) >>> 0;
  x = ((x ^ (x >>> 13)) * 1274126177) >>> 0;
  return (x % 100000) / 100000;
}
function detInt(i: number, salt: number, min: number, max: number): number {
  return min + Math.floor(det(i, salt) * (max - min + 1));
}
function pickDet<T>(arr: readonly T[], i: number, salt = 0): T {
  return arr[Math.floor(det(i, salt) * arr.length) % arr.length]!;
}
/** Narxni 1000 so'mga (100 000 tiyinga) yaxlitlash. */
function roundPrice(tiyin: number): bigint {
  return (BigInt(Math.round(tiyin)) / 100_000n) * 100_000n;
}

const BRANDS = [
  'Kelvin',
  'LuxLight',
  'BrightPro',
  'HomeLux',
  'OutLight',
  'NordLED',
  'Artel Light',
] as const;
const MATERIALS = ['metal', 'glass', 'crystal', 'wood'] as const;
const CRI_POOL = [80, 90, 95] as const;

interface GenConfig {
  categorySlug: string;
  count: number;
  series: string[];
  /** uz-Latn / uz-Cyrl / ru shablonlar. {s}=seriya, {p}=quvvat W. */
  nameUz: string;
  nameCyr: string;
  nameRu: string;
  descUz: string;
  descRu: string;
  axes: 'color-bulbs' | 'color-ct' | 'ct-only' | 'color-only';
  colors: string[];
  cts: number[];
  bulbs?: number[];
  sockets: string[];
  ips: string[];
  mountType: string;
  lightSource: string;
  powers: number[];
  /** Narx oralig'i SO'MDA (tiyinga o'zgartiriladi). */
  priceSom: [number, number];
  voltage?: number[];
  beamAngles?: number[];
  isFragile: boolean;
  requiresInstallation: boolean;
  dims: string[];
  weightG: [number, number];
}

const GEN_CONFIGS: GenConfig[] = [
  {
    categorySlug: 'lyustry',
    count: 6,
    series: ['Milan', 'Verona', 'Sofia', 'Palazzo', 'Firenze', 'Riviera'],
    nameUz: '{s} qandil',
    nameCyr: '{s} қандил',
    nameRu: 'Люстра {s}',
    descUz: 'Mehmonxona va zal uchun zamonaviy qandil. Yumshoq, iliq yorug‘lik taratadi.',
    descRu: 'Современная люстра для гостиной и зала. Даёт мягкий тёплый свет.',
    axes: 'color-bulbs',
    colors: ['gold', 'chrome', 'black'],
    cts: [2700, 3000],
    bulbs: [6, 8, 12],
    sockets: ['E27', 'E14'],
    ips: ['IP20'],
    mountType: 'pendant',
    lightSource: 'incandescent',
    powers: [40, 60],
    priceSom: [1_800_000, 9_500_000],
    isFragile: true,
    requiresInstallation: true,
    dims: ['600x600x450', '800x800x500', '700x700x480'],
    weightG: [4000, 12000],
  },
  {
    categorySlug: 'spoty',
    count: 6,
    series: ['Pixel', 'Dot', 'Focus', 'Zoom', 'Beam', 'Punto'],
    nameUz: '{s} spot {p}W',
    nameCyr: '{s} спот {p}W',
    nameRu: 'Спот {s} {p}W',
    descUz: 'Aniq yo‘naltirilgan yorug‘lik uchun ixcham spot. Do‘kon va uy uchun.',
    descRu: 'Компактный спот для акцентного освещения. Для дома и магазина.',
    axes: 'color-ct',
    colors: ['white', 'black'],
    cts: [3000, 4000, 6500],
    sockets: ['GU10'],
    ips: ['IP20', 'IP44'],
    mountType: 'recessed',
    lightSource: 'led',
    powers: [7, 10, 12],
    priceSom: [180_000, 750_000],
    isFragile: false,
    requiresInstallation: false,
    beamAngles: [24, 36, 60],
    dims: ['90x90x60', '110x110x70'],
    weightG: [150, 500],
  },
  {
    categorySlug: 'svetilniki',
    count: 6,
    series: ['Orbit', 'Disk', 'Halo', 'Ring', 'Plate', 'Slim'],
    nameUz: '{s} LED chiroq {p}W',
    nameCyr: '{s} LED чироқ {p}W',
    nameRu: 'Светильник {s} LED {p}W',
    descUz: 'Shift uchun tekis LED chiroq — oshxona, koridor va ofis uchun ideal.',
    descRu: 'Плоский LED-светильник для потолка — кухня, коридор, офис.',
    axes: 'color-ct',
    colors: ['white', 'black'],
    cts: [4000, 6500],
    sockets: ['E27'],
    ips: ['IP20', 'IP40'],
    mountType: 'ceiling',
    lightSource: 'led',
    powers: [18, 24, 36, 48],
    priceSom: [250_000, 1_200_000],
    isFragile: false,
    requiresInstallation: false,
    dims: ['300x300x40', '450x450x45', '595x595x40'],
    weightG: [400, 1800],
  },
  {
    categorySlug: 'trekovye-svetilniki',
    count: 5,
    series: ['Rail', 'Vector', 'Axis', 'Motion', 'Line'],
    nameUz: '{s} trek chiroq {p}W',
    nameCyr: '{s} трек чироқ {p}W',
    nameRu: 'Трековый {s} {p}W',
    descUz: 'Magnit trek tizimi uchun yo‘naltiriluvchi chiroq. Galereya effekti.',
    descRu: 'Поворотный светильник для трековой системы. Эффект галереи.',
    axes: 'color-ct',
    colors: ['black', 'white'],
    cts: [3000, 4000],
    sockets: ['GU10'],
    ips: ['IP20'],
    mountType: 'ceiling',
    lightSource: 'led',
    powers: [10, 15, 20, 30],
    priceSom: [350_000, 1_600_000],
    isFragile: false,
    requiresInstallation: true,
    beamAngles: [24, 36],
    dims: ['160x60x120', '200x65x140'],
    weightG: [300, 900],
  },
  {
    categorySlug: 'bra',
    count: 4,
    series: ['Luna', 'Aria', 'Muse', 'Onda'],
    nameUz: '{s} devor chirog‘i',
    nameCyr: '{s} девор чироғи',
    nameRu: 'Бра {s}',
    descUz: 'Yotoqxona va mehmonxona uchun devor chirog‘i. Intim muhit yaratadi.',
    descRu: 'Настенное бра для спальни и гостиной. Создаёт уютную атмосферу.',
    axes: 'color-ct',
    colors: ['gold', 'black', 'chrome'],
    cts: [2700, 3000],
    sockets: ['E14', 'G9'],
    ips: ['IP20'],
    mountType: 'wall',
    lightSource: 'led',
    powers: [6, 9, 12],
    priceSom: [280_000, 1_400_000],
    isFragile: true,
    requiresInstallation: true,
    dims: ['180x120x250', '220x140x300'],
    weightG: [500, 1500],
  },
  {
    categorySlug: 'ulichnye-svetilniki',
    count: 5,
    series: ['Bastion', 'Fence', 'Alley', 'Bollard', 'Fasad'],
    nameUz: '{s} ko‘cha chirog‘i {p}W',
    nameCyr: '{s} кўча чироғи {p}W',
    nameRu: 'Уличный {s} {p}W',
    descUz: 'Hovli, fasad va yo‘lak uchun namgarchilikka chidamli chiroq.',
    descRu: 'Влагозащищённый светильник для двора, фасада и дорожек.',
    axes: 'color-ct',
    colors: ['black', 'grey'],
    cts: [3000, 4000],
    sockets: ['E27'],
    ips: ['IP54', 'IP65'],
    mountType: 'wall',
    lightSource: 'led',
    powers: [10, 15, 20, 30],
    priceSom: [420_000, 2_400_000],
    isFragile: false,
    requiresInstallation: true,
    dims: ['150x150x400', '180x180x600'],
    weightG: [800, 3500],
  },
  {
    categorySlug: 'torshery',
    count: 5,
    series: ['Piano', 'Sketch', 'Curve', 'Tower', 'Salon'],
    nameUz: '{s} torsher',
    nameCyr: '{s} торшер',
    nameRu: 'Торшер {s}',
    descUz: 'O‘qish burchagi va divan yoni uchun zamonaviy torsher.',
    descRu: 'Современный торшер для уголка чтения и зоны у дивана.',
    axes: 'color-only',
    colors: ['black', 'gold', 'nickel'],
    cts: [3000],
    sockets: ['E27'],
    ips: ['IP20'],
    mountType: 'ceiling',
    lightSource: 'led',
    powers: [12, 15],
    priceSom: [900_000, 3_800_000],
    isFragile: true,
    requiresInstallation: false,
    dims: ['350x350x1600', '400x400x1750'],
    weightG: [3000, 7000],
  },
  {
    categorySlug: 'tehnicheskie',
    count: 6,
    series: ['Industro', 'Hangar', 'Bay', 'Fabrik', 'Store', 'Depo'],
    nameUz: '{s} sanoat chirog‘i {p}W',
    nameCyr: '{s} саноат чироғи {p}W',
    nameRu: 'Промышленный {s} {p}W',
    descUz: 'Ombor, sex va savdo zali uchun yuqori oqimli texnik yoritgich.',
    descRu: 'Технический светильник высокой мощности для складов и цехов.',
    axes: 'ct-only',
    colors: ['grey'],
    cts: [4000, 5000, 6500],
    sockets: ['E27'],
    ips: ['IP54', 'IP65'],
    mountType: 'ceiling',
    lightSource: 'led',
    powers: [50, 100, 150, 200],
    priceSom: [600_000, 4_500_000],
    isFragile: false,
    requiresInstallation: true,
    dims: ['350x350x250', '400x400x300'],
    weightG: [1500, 6000],
  },
  {
    categorySlug: 'komplektuyushchie',
    count: 6,
    series: ['Driver', 'TrackPro', 'Konnekt', 'Patron', 'Profil', 'Blok'],
    nameUz: '{s} butlovchi {p}W',
    nameCyr: '{s} бутловчи {p}W',
    nameRu: 'Комплектующее {s} {p}W',
    descUz: 'LED tizimlar uchun butlovchi qism: drayver, profil, ulagich va boshqalar.',
    descRu: 'Комплектующие для LED-систем: драйверы, профили, коннекторы.',
    axes: 'color-only',
    colors: ['white', 'black'],
    cts: [4000],
    sockets: ['E27'],
    ips: ['IP20', 'IP44'],
    mountType: 'recessed',
    lightSource: 'led',
    powers: [30, 50, 100],
    priceSom: [60_000, 550_000],
    isFragile: false,
    requiresInstallation: false,
    dims: ['120x40x30', '200x50x35', '1000x20x20'],
    weightG: [80, 600],
  },
  {
    categorySlug: 'svetodiodnye-lenty',
    count: 5,
    series: ['Neo', 'Flex', 'Cinta', 'Strip Pro', 'Glow'],
    nameUz: '{s} LED lenta 5m',
    nameCyr: '{s} LED лента 5m',
    nameRu: 'LED лента {s} 5м',
    descUz: 'Shift gardishi va mebel yoritish uchun 5 metrli LED lenta.',
    descRu: 'LED-лента 5 метров для подсветки потолка и мебели.',
    axes: 'ct-only',
    colors: ['white'],
    cts: [2700, 4000, 6500],
    sockets: ['E27'],
    ips: ['IP20', 'IP65'],
    mountType: 'recessed',
    lightSource: 'led',
    powers: [24, 48, 60],
    priceSom: [120_000, 700_000],
    voltage: [12, 24],
    isFragile: false,
    requiresInstallation: false,
    dims: ['5000x10x3', '5000x12x4'],
    weightG: [150, 400],
  },
  {
    categorySlug: 'nastolnye-lampy',
    count: 5,
    series: ['Study', 'Office', 'Kids', 'Loft', 'Banker'],
    nameUz: '{s} stol chirog‘i',
    nameCyr: '{s} стол чироғи',
    nameRu: 'Настольная лампа {s}',
    descUz: 'Ish stoli va o‘qish uchun ko‘zni charchatmaydigan stol chirog‘i.',
    descRu: 'Настольная лампа для работы и чтения, не утомляет глаза.',
    axes: 'color-only',
    colors: ['white', 'black', 'gold'],
    cts: [4000],
    sockets: ['E14', 'E27'],
    ips: ['IP20'],
    mountType: 'ceiling',
    lightSource: 'led',
    powers: [7, 9, 12],
    priceSom: [180_000, 1_100_000],
    isFragile: false,
    requiresInstallation: false,
    dims: ['150x150x420', '180x180x480'],
    weightG: [600, 1800],
  },
];

/**
 * SKU prefiksi = qisqa kategoriya kodi + seriya.
 * ⚠️ Slug'ni kesish MUMKIN EMAS: 'trekovye-svetilniki-rail' va '-vector'
 *    bir xil 20 belgiga tushib, mahsulotlararo SKU to'qnashardi.
 */
const CAT_SKU_CODE: Record<string, string> = {
  lyustry: 'LYU',
  spoty: 'SPT',
  svetilniki: 'SVT',
  'trekovye-svetilniki': 'TRK',
  bra: 'BRA',
  'ulichnye-svetilniki': 'ULI',
  torshery: 'TRS',
  tehnicheskie: 'TEH',
  komplektuyushchie: 'KMP',
  'svetodiodnye-lenty': 'LED',
  'nastolnye-lampy': 'NST',
};
function skuPrefix(categorySlug: string, series: string): string {
  const code = CAT_SKU_CODE[categorySlug] ?? categorySlug.slice(0, 3).toUpperCase();
  return `${code}-${series.toUpperCase().replace(/[^A-Z0-9]+/g, '')}`;
}

function generateProducts(): DemoProduct[] {
  const out: DemoProduct[] = [];
  let gi = 100; // global deterministik index (qo'lda yozilganlardan uzoq)

  for (const cfg of GEN_CONFIGS) {
    for (let k = 0; k < cfg.count; k++) {
      gi += 1;
      const series = cfg.series[k % cfg.series.length]!;
      const power = pickDet(cfg.powers, gi, 1);
      const nameOf = (tpl: string): string =>
        tpl.replace('{s}', series).replace('{p}', String(power));
      const slug = `${cfg.categorySlug}-${series.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      const brand = pickDet(BRANDS, gi, 2);
      const material = pickDet(MATERIALS, gi, 3);
      const basePrice = cfg.priceSom[0] + det(gi, 4) * (cfg.priceSom[1] - cfg.priceSom[0]);

      // O'q kombinatsiyalari (3–6 variant)
      const combos: { color?: string; ct: number; bulbs?: number }[] = [];
      if (cfg.axes === 'color-bulbs') {
        for (const color of cfg.colors.slice(0, 2 + (gi % 2))) {
          for (const bulbs of cfg.bulbs!.slice(0, 2)) {
            combos.push({ color, ct: pickDet(cfg.cts, gi + bulbs, 5), bulbs });
          }
        }
      } else if (cfg.axes === 'color-ct') {
        for (const color of cfg.colors.slice(0, 2)) {
          for (const ct of cfg.cts.slice(0, 2 + (gi % 2))) {
            combos.push({ color, ct });
          }
        }
      } else if (cfg.axes === 'ct-only') {
        for (const ct of cfg.cts) {
          combos.push({ ct });
        }
      } else {
        for (const color of cfg.colors) {
          combos.push({ color, ct: cfg.cts[0]! });
        }
      }

      const variants: DemoVariant[] = combos.slice(0, 6).map((c, vi) => {
        const axisValues: Record<string, string> = {};
        if (c.color !== undefined) axisValues.color = c.color;
        if (c.bulbs !== undefined) axisValues.bulb_count = String(c.bulbs);
        // ⚠️ ct o'q bo'lgan joyda SKU'ga ham kiradi — aks holda ikki harorat
        //    bitta SKU'ga to'qnashib, upsert variantlarni yutib yuboradi.
        if (cfg.axes === 'ct-only' || cfg.axes === 'color-ct') {
          axisValues.color_temperature = String(c.ct);
        }

        const suffix = [
          c.color?.toUpperCase(),
          c.bulbs !== undefined ? `${String(c.bulbs)}L` : undefined,
          cfg.axes === 'ct-only' || cfg.axes === 'color-ct' ? `${String(c.ct)}K` : undefined,
        ]
          .filter(Boolean)
          .join('-');
        const stockRoll = det(gi, 10 + vi);
        const totalPower = power * (c.bulbs ?? 1);
        return {
          sku: `${skuPrefix(cfg.categorySlug, series)}-${suffix || String(vi + 1)}`,
          axisValues,
          colorTemperature: c.ct,
          socketType: pickDet(cfg.sockets, gi + vi, 6),
          ipRating: pickDet(cfg.ips, gi + vi, 7),
          priceTiyin: roundPrice(basePrice * 100 * (1 + vi * 0.03)),
          // Qoldiq taqsimoti: ~15% "sotuvda yo'q", ~25% kam qoldiq, qolgani mo'l
          stock:
            stockRoll < 0.15
              ? 0
              : stockRoll < 0.4
                ? detInt(gi, 20 + vi, 1, 4)
                : detInt(gi, 30 + vi, 8, 120),
          luminousFlux:
            totalPower * (cfg.lightSource === 'led' ? detInt(gi, 40 + vi, 90, 110) : 14),
          cri: pickDet(CRI_POOL, gi + vi, 8),
          powerW: totalPower,
          voltage: cfg.voltage !== undefined ? pickDet(cfg.voltage, gi + vi, 9) : 220,
          dimmable: det(gi, 50 + vi) < 0.4,
          ...(cfg.beamAngles !== undefined && { beamAngle: pickDet(cfg.beamAngles, gi + vi, 11) }),
          bulbsIncluded: cfg.lightSource === 'led' ? true : det(gi, 60 + vi) < 0.5,
          lightSource: cfg.lightSource,
          mountType: cfg.mountType,
          material,
          dimensions: pickDet(cfg.dims, gi + vi, 12),
          weightGrams: detInt(gi, 70 + vi, cfg.weightG[0], cfg.weightG[1]),
        };
      });

      const axes: { attributeCode: string; valueCodes: string[] }[] = [];
      if (combos.some((c) => c.color !== undefined)) {
        axes.push({
          attributeCode: 'color',
          valueCodes: [
            ...new Set(combos.map((c) => c.color).filter((x): x is string => x !== undefined)),
          ],
        });
      }
      if (combos.some((c) => c.bulbs !== undefined)) {
        axes.push({
          attributeCode: 'bulb_count',
          valueCodes: [
            ...new Set(combos.map((c) => String(c.bulbs)).filter((x) => x !== 'undefined')),
          ],
        });
      }
      if (cfg.axes === 'ct-only' || cfg.axes === 'color-ct') {
        axes.push({
          attributeCode: 'color_temperature',
          valueCodes: [...new Set(combos.map((c) => String(c.ct)))],
        });
      }

      out.push({
        slug,
        categorySlug: cfg.categorySlug,
        name: {
          'uz-Latn': nameOf(cfg.nameUz),
          'uz-Cyrl': nameOf(cfg.nameCyr),
          ru: nameOf(cfg.nameRu),
        },
        brand,
        isFragile: cfg.isFragile,
        requiresInstallation: cfg.requiresInstallation,
        description: {
          'uz-Latn': `${cfg.descUz} Brend: ${brand}.`,
          'uz-Cyrl': `${cfg.descUz} Бренд: ${brand}.`,
          ru: `${cfg.descRu} Бренд: ${brand}.`,
        },
        variantAxes: axes,
        variants,
      });
    }
  }
  return out;
}

/** Qo'lda yozilgan 15 flagman uchun yetishmagan boy maydonlarni to'ldirish. */
function enrichVariant(
  v: DemoVariant,
  cat: string,
  idx: number,
): Required<Omit<DemoVariant, 'beamAngle'>> & { beamAngle?: number } {
  const cfg = GEN_CONFIGS.find((c) => c.categorySlug === cat);
  const power = v.powerW ?? (cfg !== undefined ? pickDet(cfg.powers, idx, 1) : 12);
  return {
    ...v,
    luminousFlux: v.luminousFlux ?? power * 95,
    cri: v.cri ?? pickDet(CRI_POOL, idx, 8),
    powerW: power,
    voltage: v.voltage ?? 220,
    dimmable: v.dimmable ?? det(idx, 50) < 0.4,
    ...(v.beamAngle !== undefined
      ? { beamAngle: v.beamAngle }
      : cfg?.beamAngles !== undefined
        ? { beamAngle: pickDet(cfg.beamAngles, idx, 11) }
        : {}),
    bulbsIncluded: v.bulbsIncluded ?? true,
    lightSource: v.lightSource ?? cfg?.lightSource ?? 'led',
    mountType: v.mountType ?? cfg?.mountType ?? 'ceiling',
    material: v.material ?? pickDet(MATERIALS, idx, 3),
    dimensions: v.dimensions ?? (cfg !== undefined ? pickDet(cfg.dims, idx, 12) : '300x300x100'),
    weightGrams:
      v.weightGrams ?? (cfg !== undefined ? detInt(idx, 70, cfg.weightG[0], cfg.weightG[1]) : 1000),
  };
}

async function seedDemoProducts(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    return; // ⚠️ Demo ma'lumot faqat dev/test'da
  }
  const priceList = await prisma.priceList.upsert({
    where: { code: 'RETAIL' },
    create: { code: 'RETAIL', name: { ru: 'Розница', 'uz-Latn': 'Chakana' }, priority: 0 },
    update: {},
  });
  const mainWh = await prisma.warehouse.findUnique({ where: { code: 'MAIN' } });
  if (mainWh === null) {
    return;
  }

  // Qo'lda yozilgan 15 flagman + generator (~58) = ~73 mahsulot.
  const ALL_PRODUCTS = [...DEMO_PRODUCTS, ...generateProducts()];

  let pi = 0;
  let variantCount = 0;
  for (const p of ALL_PRODUCTS) {
    pi += 1;
    const cat = await prisma.category.findUnique({ where: { slug: p.categorySlug } });
    if (cat === null) {
      continue;
    }
    const productData = {
      name: p.name,
      brand: p.brand,
      isFragile: p.isFragile,
      status: 'ACTIVE' as const,
      requiresInstallation: p.requiresInstallation ?? false,
      ...(p.description !== undefined && { description: p.description }),
      ...(p.variantAxes !== undefined && {
        variantAxes: p.variantAxes as unknown as Prisma.InputJsonValue,
      }),
    };
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      create: { slug: p.slug, categoryId: cat.id, ...productData },
      update: productData,
    });

    const expectedSkus = p.variants.map((v) => v.sku);
    let vi = 0;
    for (const raw of p.variants) {
      vi += 1;
      const v = enrichVariant(raw, p.categorySlug, pi * 10 + vi);
      variantCount += 1;
      const richData = {
        axisValues: v.axisValues,
        colorTemperature: v.colorTemperature,
        socketType: v.socketType,
        ipRating: v.ipRating,
        ipSatisfies: computeIpSatisfies(v.ipRating),
        luminousFlux: v.luminousFlux,
        cri: v.cri,
        power: v.powerW,
        voltage: v.voltage,
        dimmable: v.dimmable,
        ...(v.beamAngle !== undefined && { beamAngle: v.beamAngle }),
        bulbsIncluded: v.bulbsIncluded,
        lightSource: v.lightSource,
        mountType: v.mountType,
        attributes: { material: v.material, dimensions: v.dimensions } as Prisma.InputJsonValue,
        weightGrams: v.weightGrams,
        costPriceAmount: (v.priceTiyin * 55n) / 100n,
      };
      const variant = await prisma.productVariant.upsert({
        where: { sku: v.sku },
        create: { productId: product.id, sku: v.sku, ...richData },
        update: richData,
      });
      await prisma.price.upsert({
        where: {
          priceListId_variantId_minQuantity: {
            priceListId: priceList.id,
            variantId: variant.id,
            minQuantity: 1,
          },
        },
        create: { priceListId: priceList.id, variantId: variant.id, amount: v.priceTiyin },
        update: { amount: v.priceTiyin },
      });
      const existing = await prisma.stockItem.findUnique({
        where: { variantId_warehouseId: { variantId: variant.id, warehouseId: mainWh.id } },
      });
      if (existing === null) {
        await prisma.stockItem.create({
          data: { variantId: variant.id, warehouseId: mainWh.id, onHand: v.stock, reserved: 0 },
        });
        if (v.stock > 0) {
          await prisma.stockMovement.create({
            data: {
              variantId: variant.id,
              warehouseId: mainWh.id,
              type: 'PURCHASE_RECEIPT',
              quantity: v.stock,
              note: 'seed',
            },
          });
        }
      }
    }

    // Seed ro'yxatida YO'Q eski variantlar (masalan SKU sxemasi o'zgarganda
    // qolgan qoldiqlar) — SOFT delete. O'chirib bo'lmaydi: buyurtmalar FK
    // bilan bog'langan bo'lishi mumkin (tarixiy ma'lumot saqlanadi).
    await prisma.productVariant.updateMany({
      where: { productId: product.id, sku: { notIn: expectedSkus }, deletedAt: null },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
  console.log(
    `  ✓ ${String(ALL_PRODUCTS.length)} demo mahsulot, ${String(variantCount)} variant (narx+qoldiq, boy atributlar)`,
  );
}

// --- 5c. MEDIA — statik yo'llar + MANIFEST (docs/05 §1.5) --------------------
// Egasi rasmlarni o'zi joylaydi (AI/internet). Seed Media QATORLARINI oldindan
// belgilangan yo'llar bilan yaratadi; fayl yo'q bo'lsa storefront placeholder
// ko'rsatadi (crash yo'q). Ro'yxat: apps/api/prisma/media-manifest.md

const BANNERS: {
  title: I18n;
  imageUrl: string;
  linkUrl?: string;
  position: string;
  sortOrder: number;
  desc: string;
}[] = [
  {
    title: {
      'uz-Latn': 'Yangi qandillar 30% chegirma',
      'uz-Cyrl': 'Янги қандиллар 30% чегирма',
      ru: 'Новые люстры -30%',
    },
    imageUrl: '/media/banners/home-hero-1.jpg',
    linkUrl: '/catalog/lyustry',
    position: 'HOME_HERO',
    sortOrder: 0,
    desc: 'Bosh sahifa hero (1600×640) — hashamatli qandil interyerda, chegirma aksiyasi',
  },
  {
    title: {
      'uz-Latn': 'LED yoritish yechimlari',
      'uz-Cyrl': 'LED ёритиш ечимлари',
      ru: 'LED решения для дома',
    },
    imageUrl: '/media/banners/home-hero-2.jpg',
    linkUrl: '/catalog',
    position: 'HOME_HERO',
    sortOrder: 1,
    desc: 'Bosh sahifa hero (1600×640) — zamonaviy LED yoritilgan xona',
  },
  {
    title: {
      'uz-Latn': 'Bepul yetkazib berish',
      'uz-Cyrl': 'Бепул етказиб бериш',
      ru: 'Бесплатная доставка',
    },
    imageUrl: '/media/banners/home-strip-1.jpg',
    position: 'HOME_STRIP',
    sortOrder: 0,
    desc: "Bosh sahifa strip (1600×320) — yetkazib berish aksiyasi (5 mln so'mdan yuqori bepul)",
  },
];

const CATEGORY_IMG_DESC: Record<string, string> = {
  lyustry: 'kristal qandil, iliq nur',
  spoty: 'ichki o‘rnatilgan spot to‘plami',
  svetilniki: 'yumaloq LED panel shiftda',
  'trekovye-svetilniki': 'qora trek tizimi galereyada',
  bra: 'devor bra yotoqxonada',
  'ulichnye-svetilniki': 'hovli fasad chirog‘i kechqurun',
  torshery: 'torsher divan yonida',
  tehnicheskie: 'sanoat chirog‘i omborda',
  komplektuyushchie: 'drayver/profil/ulagichlar to‘plami',
  'svetodiodnye-lenty': 'LED lenta shift gardishida',
  'nastolnye-lampy': 'stol chirog‘i ish stolida',
};

async function seedMedia(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    include: { variants: { where: { deletedAt: null }, orderBy: { sku: 'asc' } } },
    orderBy: { slug: 'asc' },
  });

  const manifest: string[] = [
    '# Kelvin — media manifest (rasm joylash ro‘yxati)',
    '',
    '> **Qayerga:** `apps/storefront/public/media/...` (yo‘l `/media/...` bilan boshlanadi).',
    '> Fayl JPG (sifat ~80). Rasm hali yo‘q bo‘lsa storefront placeholder ko‘rsatadi — crash bo‘lmaydi.',
    '> Bu fayl `pnpm db:seed` tomonidan avtomatik yangilanadi — QO‘LDA TAHRIRLAMANG.',
    '',
    `## Kategoriyalar (${String(CATEGORIES.length)} ta, kvadrat ~800×800)`,
    '',
  ];
  for (const c of CATEGORIES) {
    manifest.push(
      `- \`/media/categories/${c.slug}.jpg\` — ${c.name['uz-Latn']} / ${c.name.ru} (${CATEGORY_IMG_DESC[c.slug] ?? ''})`,
    );
  }

  manifest.push('', `## Bannerlar (${String(BANNERS.length)} ta)`, '');
  for (const b of BANNERS) {
    manifest.push(`- \`${b.imageUrl}\` — ${b.desc}`);
  }

  // Banner qatorlari — idempotent: seed'niki (picsum yoki /media/) o'chirilib qayta yaratiladi.
  await prisma.banner.deleteMany({
    where: {
      OR: [
        { imageUrl: { startsWith: '/media/banners/' } },
        { imageUrl: { contains: 'picsum.photos' } },
      ],
    },
  });
  await prisma.banner.createMany({
    data: BANNERS.map((b) => ({
      title: b.title,
      imageUrl: b.imageUrl,
      position: b.position,
      sortOrder: b.sortOrder,
      ...(b.linkUrl !== undefined && { linkUrl: b.linkUrl }),
    })),
  });

  let mediaCount = 0;
  manifest.push('', `## Mahsulotlar (${String(products.length)} ta)`, '');
  for (let i = 0; i < products.length; i++) {
    const p = products[i]!;
    const name = p.name as I18n;
    const alt = { 'uz-Latn': name['uz-Latn'], 'uz-Cyrl': name['uz-Cyrl'], ru: name.ru };
    const galleryCount = det(i, 80) < 0.35 ? 3 : 2; // muqova + 2–3 galereya

    // Idempotent: faqat seed'ning statik yo'llari o'chiriladi (admin yuklagan S3 media tegilmaydi).
    await prisma.media.deleteMany({ where: { productId: p.id, url: { startsWith: '/media/' } } });

    manifest.push(`### ${p.slug} — ${name['uz-Latn']} / ${name.ru}`);
    const rows: Prisma.MediaCreateManyInput[] = [];
    for (let n = 1; n <= galleryCount + 1; n++) {
      const url = `/media/products/${p.slug}-${String(n)}.jpg`;
      rows.push({ productId: p.id, kind: 'IMAGE', url, alt, sortOrder: n - 1, isPrimary: n === 1 });
      manifest.push(
        n === 1
          ? `- \`${url}\` — **muqova** (oq/neytral fon, mahsulot markazda) [PRIMARY]`
          : `- \`${url}\` — galereya ${String(n - 1)} (interyerda / yaqin plan / o‘lcham sxemasi)`,
      );
    }

    // Rang o'qi bo'lgan mahsulotga — 2 tagacha rang varianti rasmi (variantId bilan).
    const colorVariants = p.variants.filter(
      (v) => typeof (v.axisValues as Record<string, unknown>).color === 'string',
    );
    const seenColors = new Set<string>();
    for (const v of colorVariants) {
      const color = (v.axisValues as Record<string, string>).color!;
      if (seenColors.has(color) || seenColors.size >= 2) {
        continue;
      }
      seenColors.add(color);
      const url = `/media/products/${p.slug}-${color}.jpg`;
      rows.push({
        productId: p.id,
        variantId: v.id,
        kind: 'IMAGE',
        url,
        alt,
        sortOrder: 10 + seenColors.size,
        isPrimary: false,
      });
      manifest.push(`- \`${url}\` — «${color}» rang varianti (muqova rakursida)`);
    }
    manifest.push('');

    await prisma.media.createMany({ data: rows });
    mediaCount += rows.length;
  }

  const manifestPath = join(process.cwd(), 'prisma', 'media-manifest.md');
  manifest.push(
    '---',
    `Jami: ${String(CATEGORIES.length)} kategoriya + ${String(BANNERS.length)} banner + ${String(mediaCount)} mahsulot rasmi.`,
    '',
  );
  writeFileSync(manifestPath, manifest.join('\n'));

  console.log(
    `  ✓ Media: ${String(mediaCount)} qator (${String(products.length)} mahsulot), 3 banner, manifest → prisma/media-manifest.md`,
  );
}

// --- 6. Yetkazish zonalari (docs/09, docs/07 §8) ----------------------------
interface ZoneSeed {
  name: I18n;
  districts: string[];
  priceTiyin: bigint;
  freeThresholdTiyin: bigint | null;
  etaDaysMin: number;
  etaDaysMax: number;
}

// ⚠️ Narx TIYINDA (1 so'm = 100 tiyin). freeThreshold'dan yuqori → bepul (§07 §5).
const DELIVERY_ZONES: ZoneSeed[] = [
  {
    name: { 'uz-Latn': 'Toshkent shahri', 'uz-Cyrl': 'Тошкент шаҳри', ru: 'город Ташкент' },
    districts: [
      'Chilonzor',
      'Yunusobod',
      'Mirzo Ulugʻbek',
      'Yakkasaroy',
      'Shayxontohur',
      'Mirobod',
      'Olmazor',
      'Sergeli',
      'Yashnobod',
      'Bektemir',
      'Uchtepa',
    ],
    priceTiyin: 3_000_000n, // 30 000 so'm
    freeThresholdTiyin: 500_000_000n, // 5 000 000 so'mdan yuqori → bepul
    etaDaysMin: 1,
    etaDaysMax: 2,
  },
  {
    name: {
      'uz-Latn': 'Toshkent viloyati',
      'uz-Cyrl': 'Тошкент вилояти',
      ru: 'Ташкентская область',
    },
    districts: [
      'Zangiota',
      'Qibray',
      'Yangiyoʻl',
      'Chirchiq',
      'Angren',
      'Bekobod',
      'Ohangaron',
      'Parkent',
    ],
    priceTiyin: 5_000_000n, // 50 000 so'm
    freeThresholdTiyin: 800_000_000n,
    etaDaysMin: 2,
    etaDaysMax: 4,
  },
  {
    name: { 'uz-Latn': 'Boshqa viloyatlar', 'uz-Cyrl': 'Бошқа вилоятлар', ru: 'Другие регионы' },
    districts: [
      'Samarqand',
      'Buxoro',
      'Andijon',
      'Fargʻona',
      'Namangan',
      'Qashqadaryo',
      'Surxondaryo',
      'Xorazm',
      'Navoiy',
      'Jizzax',
      'Sirdaryo',
      'Qoraqalpogʻiston',
    ],
    priceTiyin: 8_000_000n, // 80 000 so'm — bepul yetkazish yo'q
    freeThresholdTiyin: null,
    etaDaysMin: 3,
    etaDaysMax: 7,
  },
];

async function seedCouriers(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    return; // dev/test — courier@kelvin.uz hisobiga bog'langan profil
  }
  const user = await prisma.user.findUnique({ where: { email: 'courier@kelvin.uz' } });
  if (user === null) {
    return;
  }
  const existing = await prisma.courier.findUnique({ where: { userId: user.id } });
  if (existing === null) {
    await prisma.courier.create({
      data: {
        userId: user.id,
        fullName: 'Kuryer Aliyev',
        phone: '+998901112233',
        vehicleType: 'car',
        isActive: true,
      },
    });
  }
  console.log('  ✓ 1 kuryer profili (courier@kelvin.uz)');
}

async function seedDeliveryZones(): Promise<void> {
  for (const z of DELIVERY_ZONES) {
    // ⚠️ DeliveryZone'da tabiiy unique kalit yo'q — birinchi tuman bilan izlaymiz
    //    (har zonaning tumanlar to'plami ajralib turadi). Idempotent.
    const existing = await prisma.deliveryZone.findFirst({
      where: { districts: { has: z.districts[0]! } },
    });
    const data = {
      name: z.name,
      districts: z.districts,
      priceAmount: z.priceTiyin,
      freeThresholdAmount: z.freeThresholdTiyin,
      etaDaysMin: z.etaDaysMin,
      etaDaysMax: z.etaDaysMax,
      isActive: true,
    };
    if (existing === null) {
      await prisma.deliveryZone.create({ data });
    } else {
      await prisma.deliveryZone.update({ where: { id: existing.id }, data });
    }
  }
  console.log(`  ✓ ${String(DELIVERY_ZONES.length)} yetkazish zonasi`);
}

// --- 7. Kontent (blog + statik sahifalar) — FAQAT dev -----------------------
async function seedContent(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  const posts = [
    {
      slug: 'uyni-tashqaridan-yoritish',
      title: {
        'uz-Latn': 'Uyni tashqaridan qanday yoritish kerak?',
        ru: 'Как правильно освещать дом снаружи?',
      },
      excerpt: {
        'uz-Latn': 'Fasad va hovli yoritishning asosiy tamoyillari.',
        ru: 'Основные принципы фасадного и уличного освещения.',
      },
      body: {
        'uz-Latn': 'Tashqi yoritishda IP darajasi va harorat muhim...',
        ru: 'При наружном освещении важны степень защиты IP и температура...',
      },
    },
    {
      slug: 'qandil-tanlash',
      title: { 'uz-Latn': 'Zal uchun qandil tanlash', ru: 'Как выбрать люстру для зала' },
      excerpt: {
        'uz-Latn': 'O‘lcham, yorug‘lik oqimi va uslub.',
        ru: 'Размер, световой поток и стиль.',
      },
      body: {
        'uz-Latn': 'Xona maydoniga qarab lampalar sonini tanlang...',
        ru: 'Выбирайте количество ламп по площади комнаты...',
      },
    },
  ];
  for (const p of posts) {
    const existing = await prisma.blogPost.findUnique({ where: { slug: p.slug } });
    if (existing === null) {
      await prisma.blogPost.create({
        data: {
          slug: p.slug,
          title: p.title,
          excerpt: p.excerpt,
          body: p.body,
          isPublished: true,
          publishedAt: new Date('2026-01-15'),
        },
      });
    }
  }
  const pages = [
    {
      slug: 'o-kompanii',
      title: { 'uz-Latn': 'Kompaniya haqida', ru: 'О компании' },
      body: { 'uz-Latn': 'Kelvin — yoritish do‘koni.', ru: 'Kelvin — магазин освещения.' },
    },
    {
      slug: 'dostavka-i-oplata',
      title: { 'uz-Latn': 'Yetkazib berish va to‘lov', ru: 'Доставка и оплата' },
      body: { 'uz-Latn': 'Toshkent bo‘ylab yetkazib beramiz.', ru: 'Доставляем по Ташкенту.' },
    },
    {
      slug: 'vozvrat',
      title: { 'uz-Latn': 'Qaytarish', ru: 'Возврат' },
      body: {
        'uz-Latn': 'Tovarni 7 kun ichida qaytarish mumkin.',
        ru: 'Товар можно вернуть в течение 7 дней.',
      },
    },
    {
      slug: 'garantiya',
      title: { 'uz-Latn': 'Kafolat', ru: 'Гарантия' },
      body: {
        'uz-Latn': 'Barcha mahsulotlarga kafolat beriladi.',
        ru: 'На все товары предоставляется гарантия.',
      },
    },
  ];
  for (const pg of pages) {
    await prisma.page.upsert({
      where: { slug: pg.slug },
      create: { slug: pg.slug, title: pg.title, body: pg.body, isPublished: true },
      update: { title: pg.title, body: pg.body },
    });
  }
  console.log(`  ✓ ${String(posts.length)} blog maqolasi + ${String(pages.length)} statik sahifa`);
}

// --- 8. SHOWCASE — "jonli do'kon" ko'rinishi (FAQAT dev, IDEMPOTENT) ---------
// ⚠️ Re-seed xavfsiz: har obyekt tabiiy kaliti bo'yicha tekshiriladi (buyurtma
//    raqami, mijoz telefoni, PO raqami...) — bor bo'lsa o'tkazib yuboriladi.
//    Ledger IMMUTABLE (trigger) — hech narsa o'chirilmaydi, faqat qo'shiladi.

const SHOWCASE_TARGETS = {
  customers: 40,
  orders: 120,
  reviews: 60,
  questions: 30,
  leads: 40,
  suppliers: 5,
  purchaseOrders: 15,
} as const;

const FIRST_NAMES = [
  'Sardor',
  'Nilufar',
  'Jasur',
  'Dilnoza',
  'Bekzod',
  'Malika',
  'Otabek',
  'Kamola',
  'Aziz',
  'Gulnora',
  'Rustam',
  'Zarina',
  'Sherzod',
  'Feruza',
  'Dilshod',
  'Nodira',
  'Akmal',
  'Sevara',
  'Ulug‘bek',
  'Mohira',
] as const;
const LAST_NAMES = [
  'Karimov',
  'Azizova',
  'Toshmatov',
  'Rahimova',
  'Yusupov',
  'Ergasheva',
  'Nazarov',
  'Islomova',
  'Qodirov',
  'Sattorova',
  'Yo‘ldoshev',
  'Umarova',
] as const;
const DISTRICTS = [
  'Chilonzor',
  'Yunusobod',
  'Mirzo Ulugʻbek',
  'Yakkasaroy',
  'Shayxontohur',
  'Sergeli',
  'Mirobod',
  'Olmazor',
  'Chirchiq',
  'Samarqand',
] as const;

async function seedShowcase(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  const DAY = 86_400_000;
  const daysAgo = (n: number): Date => new Date(Date.now() - n * DAY);
  const daysAhead = (n: number): Date => new Date(Date.now() + n * DAY);

  const mainWh = await prisma.warehouse.findUnique({ where: { code: 'MAIN' } });
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@kelvin.uz' } });
  const salesUser = await prisma.user.findUnique({ where: { email: 'sales@kelvin.uz' } });
  const sales2User = await prisma.user.findUnique({ where: { email: 'sales2@kelvin.uz' } });
  const zones = await prisma.deliveryZone.findMany();
  if (mainWh === null || adminUser === null || salesUser === null || zones.length === 0) {
    return;
  }
  const salesPool = [salesUser, sales2User ?? salesUser];

  const variants = await prisma.productVariant.findMany({
    include: { product: true, prices: true },
  });
  const priced = variants
    .filter((v) => v.prices.length > 0)
    .map((v) => ({
      id: v.id,
      sku: v.sku,
      productId: v.productId,
      name: v.product.name as I18n,
      axis: v.axisValues,
      price: v.prices[0]!.amount,
    }));
  if (priced.length === 0) {
    return;
  }
  const pick = (i: number): (typeof priced)[number] => priced[i % priced.length]!;

  // --- Mijozlar ~40 (idempotent: telefon bo'yicha) ---------------------------
  const customerPassword = process.env.SEED_DEV_PASSWORD ?? 'kelvin-dev-password';
  const customerPasswordHash = await argon2.hash(customerPassword, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
  const customers: { id: string; first: string }[] = [];
  let newCustomers = 0;
  for (let i = 0; i < SHOWCASE_TARGETS.customers; i++) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length]!;
    const last = LAST_NAMES[(i * 3 + Math.floor(i / FIRST_NAMES.length)) % LAST_NAMES.length]!;
    const phone = `+9989012345${String(i + 1).padStart(2, '0')}`;
    const email = i === 0 ? 'customer@kelvin.uz' : undefined;

    const existing = await prisma.customer.findFirst({ where: { phone } });
    if (existing !== null) {
      customers.push({ id: existing.id, first });
      continue;
    }
    newCustomers += 1;

    let userId: string | undefined;
    if (email !== undefined) {
      const u = await prisma.user.upsert({
        where: { email },
        create: {
          email,
          passwordHash: customerPasswordHash,
          status: 'ACTIVE',
          emailVerified: true,
          locale: 'uz-Latn',
        },
        update: { passwordHash: customerPasswordHash, status: 'ACTIVE' },
      });
      await prisma.userRole.deleteMany({ where: { userId: u.id, scopeType: null } });
      await prisma.userRole.create({ data: { userId: u.id, role: 'CUSTOMER' } });
      userId = u.id;
    }
    const isBusiness = i % 13 === 5; // bir nechta B2B (dizayner/brigada)
    const cust = await prisma.customer.create({
      data: {
        phone,
        firstName: first,
        lastName: last,
        ...(email !== undefined && { email }),
        ...(userId !== undefined && { userId }),
        ...(isBusiness && { isBusiness: true, companyName: `${last} Design Studio` }),
      },
    });
    if (i < 20) {
      const district = DISTRICTS[i % DISTRICTS.length]!;
      await prisma.address.create({
        data: {
          customerId: cust.id,
          region: 'Toshkent',
          city: 'Toshkent',
          district,
          street: `${district} ko‘chasi, ${String(10 + i)}-uy`,
          isDefault: true,
        },
      });
    }
    customers.push({ id: cust.id, first });
  }

  // --- Buyurtmalar ~120 — oxirgi 90 kun, barcha holatlar ----------------------
  // paid=true → Payment(PAID) + double-entry ledger (mavjud naqsh).
  const ORDER_MIX: { status: string; count: number; paid: boolean; age: [number, number] }[] = [
    { status: 'DRAFT', count: 4, paid: false, age: [0, 2] },
    { status: 'PENDING_PAYMENT', count: 8, paid: false, age: [0, 3] },
    { status: 'PAYMENT_FAILED', count: 3, paid: false, age: [1, 6] },
    { status: 'PAID', count: 10, paid: true, age: [0, 6] },
    { status: 'CONFIRMED', count: 14, paid: true, age: [1, 8] },
    { status: 'PICKING', count: 6, paid: true, age: [1, 6] },
    { status: 'PACKED', count: 8, paid: true, age: [2, 8] },
    { status: 'SHIPPED', count: 10, paid: true, age: [2, 10] },
    { status: 'DELIVERED', count: 26, paid: true, age: [5, 80] },
    { status: 'COMPLETED', count: 24, paid: true, age: [10, 90] },
    { status: 'CANCELLED', count: 5, paid: false, age: [3, 60] },
    { status: 'RETURNED', count: 2, paid: true, age: [15, 60] },
  ];

  const installmentCandidates: string[] = [];
  let orderIdx = 0;
  let newOrders = 0;
  for (const mix of ORDER_MIX) {
    for (let k = 0; k < mix.count; k++) {
      const oi = orderIdx++;
      const number = `KLV-2026-${String(900001 + oi)}`;
      const already = await prisma.order.findUnique({ where: { number } });
      if (already !== null) {
        if (['CONFIRMED', 'COMPLETED'].includes(already.status)) {
          installmentCandidates.push(already.id);
        }
        continue;
      }
      newOrders += 1;

      const cust = customers[oi % customers.length]!;
      const zone = zones[oi % zones.length]!;
      const itemCount = detInt(oi, 100, 1, 3);
      const items = Array.from({ length: itemCount }, (_, j) => ({
        v: pick(oi * 3 + j),
        qty: detInt(oi, 110 + j, 1, 2),
      }));
      const subtotal = items.reduce((s, it) => s + it.v.price * BigInt(it.qty), 0n);
      const deliveryFee = subtotal >= 500_000_000n ? 0n : zone.priceAmount;
      const total = subtotal + deliveryFee;
      const createdAt = daysAgo(detInt(oi, 120, mix.age[0], mix.age[1]));
      const provider: 'CASH' | 'CLICK' = det(oi, 130) < 0.4 ? 'CASH' : 'CLICK';

      const order = await prisma.order.create({
        data: {
          number,
          customerId: cust.id,
          status: mix.status as never,
          channel: 'ONLINE',
          subtotalAmount: subtotal,
          discountAmount: 0n,
          deliveryAmount: deliveryFee,
          totalAmount: total,
          currency: 'UZS',
          createdAt,
          ...(mix.status !== 'DRAFT' && { placedAt: createdAt }),
          ...(mix.status === 'CANCELLED' && {
            cancelledAt: createdAt,
            cancelReason: 'Mijoz bekor qildi',
          }),
          ...(mix.status === 'COMPLETED' && { completedAt: createdAt }),
          items: {
            create: items.map((it) => ({
              variantId: it.v.id,
              sku: it.v.sku,
              productName: it.v.name,
              variantAxis: it.v.axis as Prisma.InputJsonValue,
              attributesSnapshot: {},
              quantity: it.qty,
              unitAmount: it.v.price,
              totalAmount: it.v.price * BigInt(it.qty),
              currency: 'UZS',
            })),
          },
          statusHistory: { create: { toStatus: mix.status as never, reason: 'seed showcase' } },
        },
      });
      if (['CONFIRMED', 'COMPLETED'].includes(mix.status)) {
        installmentCandidates.push(order.id);
      }

      if (mix.paid) {
        const landing = provider === 'CASH' ? 'asset.cash.courier' : 'asset.receivable.provider';
        const payment = await prisma.payment.create({
          data: {
            orderId: order.id,
            provider,
            status: 'PAID',
            amount: total,
            currency: 'UZS',
            idempotencyKey: `seed-${order.id}`,
            paidAt: createdAt,
            providerTransactionId: `seed-${provider}-${number}`,
            createdAt,
          },
        });
        const txId = randomUUID();
        await prisma.ledgerEntry.createMany({
          data: [
            {
              transactionId: txId,
              paymentId: payment.id,
              account: landing,
              direction: 'DEBIT',
              amount: total,
              description: 'Sotuv to‘lovi',
            },
            {
              transactionId: txId,
              paymentId: payment.id,
              account: 'revenue.product',
              direction: 'CREDIT',
              amount: total,
              description: 'Mahsulot daromadi',
            },
          ],
        });
        // Onlayn to'lovlarning yarmi settlement qilingan (receivable→bank).
        if (provider === 'CLICK' && oi % 2 === 0) {
          const fee = total / 100n; // 1% komissiya
          const stId = randomUUID();
          await prisma.ledgerEntry.createMany({
            data: [
              {
                transactionId: stId,
                paymentId: payment.id,
                account: 'asset.cash.bank',
                direction: 'DEBIT',
                amount: total - fee,
                description: 'Settlement — net',
              },
              {
                transactionId: stId,
                paymentId: payment.id,
                account: 'expense.provider_fee',
                direction: 'DEBIT',
                amount: fee,
                description: 'Provayder komissiyasi',
              },
              {
                transactionId: stId,
                paymentId: payment.id,
                account: 'asset.receivable.provider',
                direction: 'CREDIT',
                amount: total,
                description: 'Qarz yopildi',
              },
            ],
          });
        }
      }
    }
  }

  // --- Sharhlar ~60 (unique(product,customer) — try/catch skip) ---------------
  const REVIEW_TEXTS = [
    { r: 5, t: 'Ajoyib sifat', b: 'Juda chiroyli, uyimga mos keldi. Tavsiya qilaman!' },
    { r: 5, t: 'Отличный товар', b: 'Качество на высоте, доставили быстро.' },
    { r: 4, t: 'Yaxshi', b: 'Yorug‘lik yaxshi, lekin biroz kichik ko‘rindi.' },
    { r: 5, t: 'Zo‘r', b: 'Narxi sifatiga arziydi, rahmat!' },
    { r: 4, t: 'Хорошо', b: 'Всё понравилось, упаковка надёжная.' },
    { r: 3, t: 'O‘rtacha', b: 'Ishlaydi, lekin montaj biroz qiyin bo‘ldi.' },
    { r: 5, t: 'Tavsiya qilaman', b: 'Ikkinchi marta olyapman, sifati barqaror.' },
    { r: 5, t: 'Интерьер преобразился', b: 'Свет тёплый, смотрится дорого. Советую!' },
    { r: 4, t: 'Sifatli mahsulot', b: 'Qadoqlash zo‘r, yetkazish tez bo‘ldi.' },
    { r: 2, t: 'Kutganimdek emas', b: 'Rasmdagidan farq qiladi, yorug‘ligi kuchsizroq.' },
    { r: 5, t: 'Rahmat!', b: 'Montajchi ham keldi, hammasi joyida.' },
    { r: 4, t: 'Норм', b: 'За свои деньги отличный вариант.' },
  ];
  // ⚠️ orderBy MAJBURIY: tartib barqaror bo'lmasa det() kombinatsiyalari har
  //    yurgizishda o'zgarib, dedup ishlamaydi (re-seed'da dublikatlar).
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    orderBy: { slug: 'asc' },
  });
  let reviewCount = 0;
  for (let i = 0; i < SHOWCASE_TARGETS.reviews; i++) {
    const p = products[detInt(i, 200, 0, products.length - 1)]!;
    const rev = REVIEW_TEXTS[i % REVIEW_TEXTS.length]!;
    const cust = customers[(i * 7) % customers.length]!;
    try {
      await prisma.review.create({
        data: {
          productId: p.id,
          customerId: cust.id,
          rating: rev.r,
          title: rev.t,
          body: rev.b,
          status: 'APPROVED',
          isVerifiedPurchase: i % 2 === 0,
          moderatedBy: adminUser.id,
          createdAt: daysAgo(detInt(i, 210, 1, 60)),
        },
      });
      reviewCount++;
    } catch {
      // unique(product, customer) — o'tkazib yuborish
    }
  }

  // --- Savol-javob ~30 (idempotent: product+body) -----------------------------
  const QA = [
    { q: 'Lampalar komplektda bormi?', a: 'Ha, barcha lampalar to‘plamda keladi.' },
    { q: 'Гарантия сколько?', a: '24 месяца официальной гарантии.' },
    { q: 'Montaj xizmati bormi?', a: 'Ha, Toshkent bo‘ylab o‘rnatish xizmati mavjud.' },
    { q: 'Ranglari boshqa bormi?', a: 'Katalogdagi rang variantlarini tanlashingiz mumkin.' },
    {
      q: 'Dimmer bilan ishlaydimi?',
      a: 'Texnik xususiyatlarda "Yorqinlik boshqaruvi" belgisiga qarang.',
    },
    { q: 'Сколько ватт потребляет?', a: 'Мощность указана в характеристиках варианта.' },
    {
      q: 'Namlikka chidamlimi?',
      a: 'IP darajasi xususiyatlarda ko‘rsatilgan — IP44+ hammom uchun mos.',
    },
    { q: 'Yetkazib berish qancha?', a: 'Toshkent bo‘ylab 30 000 so‘m, 5 mln dan yuqori — bepul.' },
    { q: 'Можно самовывоз?', a: 'Да, из шоурума в Ташкенте.' },
    { q: 'Kafolat muddati qancha?', a: 'Barcha mahsulotlarga 24 oy kafolat.' },
  ];
  let qaCount = 0;
  for (let i = 0; i < SHOWCASE_TARGETS.questions; i++) {
    const p = products[detInt(i, 220, 0, products.length - 1)]!;
    const qa = QA[i % QA.length]!;
    const cust = customers[(i * 11 + 3) % customers.length]!;
    const exists = await prisma.question.findFirst({ where: { productId: p.id, body: qa.q } });
    if (exists !== null) {
      continue;
    }
    const question = await prisma.question.create({
      data: {
        productId: p.id,
        customerId: cust.id,
        body: qa.q,
        status: 'APPROVED',
        createdAt: daysAgo(detInt(i, 230, 1, 45)),
      },
    });
    await prisma.answer.create({
      data: { questionId: question.id, body: qa.a, authorUserId: adminUser.id, isOfficial: true },
    });
    qaCount += 1;
  }

  // --- Lidlar ~40 — butun voronka (idempotent: telefon) -----------------------
  const LEAD_MIX: { status: string; count: number }[] = [
    { status: 'NEW', count: 10 },
    { status: 'CONTACTED', count: 8 },
    { status: 'QUALIFIED', count: 6 },
    { status: 'PROPOSAL', count: 6 },
    { status: 'WON', count: 5 },
    { status: 'LOST', count: 5 },
  ];
  let leadIdx = 0;
  let leadCount = 0;
  for (const mix of LEAD_MIX) {
    for (let k = 0; k < mix.count; k++) {
      const i = leadIdx++;
      const phone = `+9989355502${String(i + 1).padStart(2, '0')}`;
      const exists = await prisma.lead.findFirst({ where: { phone } });
      if (exists !== null) {
        continue;
      }
      leadCount += 1;
      const name = `${FIRST_NAMES[(i * 5) % FIRST_NAMES.length]!} ${LAST_NAMES[(i * 7) % LAST_NAMES.length]!}`;
      await prisma.lead.create({
        data: {
          name,
          phone,
          source: ['WEBSITE_FORM', 'PHONE', 'TELEGRAM', 'INSTAGRAM'][i % 4]!,
          status: mix.status as never,
          assignedTo: salesPool[i % salesPool.length]!.id,
          ...(mix.status === 'WON' && {
            estimatedAmount: BigInt(detInt(i, 240, 15, 90)) * 10_000_000n,
          }),
          ...(mix.status === 'LOST' && {
            lostReason: i % 2 === 0 ? 'Narx qimmat' : 'Boshqa joydan oldi',
          }),
          createdAt: daysAgo(detInt(i, 250, 0, 40)),
        },
      });
    }
  }

  // --- Yetkazish slotlari (kelasi 7 kun, idempotent) --------------------------
  // ⚠️ `date` — @db.Date (UTC kesiladi). Unique (zone,date,startTime) bo'yicha
  //    upsert — mahalliy vaqt/UTC chegarasidagi off-by-one'dan qochamiz.
  for (const z of zones) {
    for (let d = 1; d <= 7; d++) {
      for (const w of [
        { s: '10:00', e: '13:00' },
        { s: '14:00', e: '18:00' },
      ]) {
        const slotDate = new Date(daysAhead(d).toISOString().slice(0, 10));
        await prisma.deliverySlot.upsert({
          where: { zoneId_date_startTime: { zoneId: z.id, date: slotDate, startTime: w.s } },
          create: {
            zoneId: z.id,
            date: slotDate,
            startTime: w.s,
            endTime: w.e,
            capacity: 5,
            booked: (d + w.s.length) % 4,
          },
          update: {},
        });
      }
    }
  }

  // --- Ta'minotchilar (5) + xarid buyurtmalari (~15) --------------------------
  const SUPPLIERS = [
    {
      name: 'LuxLight Import MChJ',
      code: 'LUXLIGHT',
      phone: '+998712001020',
      email: 'sales@luxlight.uz',
    },
    {
      name: 'BrightPro Distribution',
      code: 'BRIGHTPRO',
      phone: '+998712001021',
      email: 'order@brightpro.uz',
    },
    { name: 'NordLED Trading', code: 'NORDLED', phone: '+998712001022', email: 'info@nordled.uz' },
    {
      name: 'Shanghai Lighting Co',
      code: 'SHLIGHT',
      phone: '+998712001023',
      email: 'export@shlight.cn',
    },
    {
      name: 'Artel Light Zavodi',
      code: 'ARTELLIGHT',
      phone: '+998712001024',
      email: 'b2b@artellight.uz',
    },
  ];
  const suppliers = [];
  for (const s of SUPPLIERS) {
    suppliers.push(
      await prisma.supplier.upsert({
        where: { code: s.code },
        create: s,
        update: { name: s.name, phone: s.phone, email: s.email },
      }),
    );
  }

  const PO_STATUSES = [
    'DRAFT',
    'DRAFT',
    'DRAFT',
    'ORDERED',
    'ORDERED',
    'ORDERED',
    'ORDERED',
    'RECEIVED',
    'RECEIVED',
    'RECEIVED',
    'RECEIVED',
    'RECEIVED',
    'RECEIVED',
    'CANCELLED',
    'CANCELLED',
  ] as const;
  let poCount = 0;
  for (let i = 0; i < SHOWCASE_TARGETS.purchaseOrders; i++) {
    const number = `PO-2026-9000${String(i + 1).padStart(2, '0')}`;
    const exists = await prisma.purchaseOrder.findFirst({ where: { number } });
    if (exists !== null) {
      continue;
    }
    poCount += 1;
    const status = PO_STATUSES[i]!;
    const poItems = Array.from({ length: detInt(i, 300, 2, 4) }, (_, j) => {
      const v = pick(i * 5 + j);
      const qty = detInt(i, 310 + j, 10, 40);
      return {
        variantId: v.id,
        quantityOrdered: qty,
        quantityReceived: status === 'RECEIVED' ? qty : 0,
        unitCostAmount: (v.price * 55n) / 100n,
      };
    });
    const totalAmount = poItems.reduce(
      (s, it) => s + it.unitCostAmount * BigInt(it.quantityOrdered),
      0n,
    );
    await prisma.purchaseOrder.create({
      data: {
        number,
        supplierId: suppliers[i % suppliers.length]!.id,
        warehouseId: mainWh.id,
        status,
        totalAmount,
        currency: 'UZS',
        createdAt: daysAgo(detInt(i, 320, 1, 70)),
        items: { create: poItems },
      },
    });
  }

  // --- POS smenalar (2 yopiq + 1 ochiq) + tranzaksiyalar ----------------------
  let posShifts = 0;
  if ((await prisma.posShift.count()) < 3) {
    let posSeq = 9001;
    const SHIFTS: { status: 'CLOSED' | 'OPEN'; opened: number; txCount: number }[] = [
      { status: 'CLOSED', opened: 2, txCount: 4 },
      { status: 'CLOSED', opened: 1, txCount: 3 },
      { status: 'OPEN', opened: 0, txCount: 2 },
    ];
    for (const sh of SHIFTS) {
      const txTotal = Array.from({ length: sh.txCount }, (_, j) => pick(posSeq + j).price).reduce(
        (s, p) => s + p,
        0n,
      );
      const shift = await prisma.posShift.create({
        data: {
          userId: salesPool[posShifts % salesPool.length]!.id,
          status: sh.status,
          openingCashAmount: 50_000_000n,
          ...(sh.status === 'CLOSED' && {
            closingCashAmount: 50_000_000n + txTotal,
            cashDifferenceAmount: 0n,
            closedAt: daysAgo(sh.opened),
          }),
          openedAt: daysAgo(sh.opened),
        },
      });
      posShifts += 1;
      for (let j = 0; j < sh.txCount; j++) {
        const v = pick(posSeq + j);
        const txId = randomUUID();
        await prisma.posTransaction.create({
          data: {
            shiftId: shift.id,
            number: `POS-00${String(posSeq++)}`,
            paymentMethod: j % 2 === 0 ? 'CASH' : 'CARD',
            totalAmount: v.price,
            warehouseId: mainWh.id,
            status: 'COMPLETED',
            createdAt: daysAgo(sh.opened),
            items: {
              create: [
                {
                  variantId: v.id,
                  sku: v.sku,
                  quantity: 1,
                  unitAmount: v.price,
                  totalAmount: v.price,
                },
              ],
            },
          },
        });
        await prisma.ledgerEntry.createMany({
          data: [
            {
              transactionId: txId,
              account: 'asset.cash.register',
              direction: 'DEBIT',
              amount: v.price,
              description: 'POS sotuvi',
            },
            {
              transactionId: txId,
              account: 'revenue.product',
              direction: 'CREDIT',
              amount: v.price,
              description: 'POS daromadi',
            },
          ],
        });
      }
    }
  }

  // --- Rassrochka rejalari (3 xil holat: faol / to'langan / muddati o'tgan) ----
  let planCount = 0;
  const PLAN_KINDS: { status: 'PENDING' | 'PAID' | 'OVERDUE'; months: number }[] = [
    { status: 'PENDING', months: 3 }, // faol — birinchi badal to'langan
    { status: 'PAID', months: 3 }, // to'liq yopilgan
    { status: 'OVERDUE', months: 6 }, // muddati o'tgan
  ];
  for (const pk of PLAN_KINDS) {
    const orderId = installmentCandidates[planCount];
    if (orderId === undefined) {
      break;
    }
    const existsPlan = await prisma.installmentPlan.findUnique({ where: { orderId } });
    if (existsPlan !== null) {
      planCount += 1;
      continue;
    }
    const ord = await prisma.order.findUnique({ where: { id: orderId } });
    if (ord === null) {
      continue;
    }
    const principal = ord.totalAmount;
    const monthly = principal / BigInt(pk.months);
    const remainder = principal - monthly * BigInt(pk.months);
    const amountOf = (m: number): bigint => (m === 0 ? monthly + remainder : monthly);
    // PAID: hammasi to'langan; PENDING: faqat 1-badal; OVERDUE: 1-badal to'langan, 2-chisi kechikkan.
    const paidUpTo = pk.status === 'PAID' ? pk.months : 1;
    await prisma.installmentPlan.create({
      data: {
        orderId,
        kind: 'OWN',
        principalAmount: principal,
        downPaymentAmount: 0n,
        totalPayableAmount: principal,
        interestRateBp: 0,
        termMonths: pk.months,
        status: pk.status,
        schedule: {
          create: Array.from({ length: pk.months }, (_, m) => ({
            installmentNumber: m + 1,
            // OVERDUE: muddatlar o'tmishda qolgan; boshqalari kelajakda.
            dueDate:
              pk.status === 'OVERDUE'
                ? daysAgo((pk.months - m) * 30 - 15)
                : daysAhead((m + 1) * 30),
            amount: amountOf(m),
            paidAmount: m < paidUpTo ? amountOf(m) : 0n,
            status: m < paidUpTo ? 'PAID' : pk.status === 'OVERDUE' ? 'OVERDUE' : 'PENDING',
            ...(m < paidUpTo && { paidAt: daysAgo((pk.months - m) * 10) }),
          })),
        },
      },
    });
    planCount += 1;
  }

  console.log(
    `  ✓ Showcase: mijoz +${String(newCustomers)} (jami ${String(customers.length)}), buyurtma +${String(newOrders)} (reja ${String(orderIdx)}), sharh +${String(reviewCount)}, savol +${String(qaCount)}, lid +${String(leadCount)}, PO +${String(poCount)}, POS smena ${String(posShifts)}, rassrochka ${String(planCount)}`,
  );
}

async function main(): Promise<void> {
  console.log('Kelvin seed boshlandi...');
  await seedCategories();
  await seedAttributes();
  await seedWarehouses();
  await seedDevUsers();
  await seedDemoProducts();
  await seedMedia();
  await seedDeliveryZones();
  await seedCouriers();
  await seedContent();
  await seedShowcase();
  console.log('Seed tugadi.');
  console.log('  → Rasmlar ro‘yxati: apps/api/prisma/media-manifest.md (egasi joylaydi)');
  console.log(
    '  → Qidiruv indeksi: POST /api/v1/products/reindex (product:publish ruxsati) — yangi mahsulotlar qidiruvda chiqishi uchun',
  );
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
