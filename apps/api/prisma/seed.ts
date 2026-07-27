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
    await prisma.category.upsert({
      where: { slug: c.slug },
      create: {
        slug: c.slug,
        name: c.name,
        path: `/${c.slug}/`,
        depth: 0,
        sortOrder: i,
      },
      update: { name: c.name, sortOrder: i },
    });
  }
  console.log(`  ✓ ${String(CATEGORIES.length)} kategoriya`);
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
  console.log('  ⚠️  DEV ONLY — hisoblar:');
  for (const u of DEV_USERS) {
    console.log(`     ${u.email}  (${u.role})`);
  }
  console.log(`     parol: ${password}`);
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
}
interface DemoProduct {
  slug: string;
  categorySlug: string;
  name: I18n;
  brand: string;
  isFragile: boolean;
  variants: DemoVariant[];
}

const DEMO_PRODUCTS: DemoProduct[] = [
  {
    slug: 'aurora-8l',
    categorySlug: 'lyustry',
    name: { 'uz-Latn': 'Aurora 8L qandil', 'uz-Cyrl': 'Aurora 8L қандил', ru: 'Люстра Aurora 8L' },
    brand: 'Kelvin',
    isFragile: true,
    variants: [
      { sku: 'AUR-8L-GOLD', axisValues: { color: 'gold' }, colorTemperature: 3000, socketType: 'E27', ipRating: 'IP20', priceTiyin: 320_000_000n, stock: 12 },
      { sku: 'AUR-8L-CHROME', axisValues: { color: 'chrome' }, colorTemperature: 4000, socketType: 'E27', ipRating: 'IP20', priceTiyin: 340_000_000n, stock: 8 },
    ],
  },
  {
    slug: 'bolt-spot',
    categorySlug: 'spoty',
    name: { 'uz-Latn': 'Bolt spot', 'uz-Cyrl': 'Bolt спот', ru: 'Спот Bolt' },
    brand: 'Kelvin',
    isFragile: false,
    variants: [
      { sku: 'BOLT-GU10-WHITE', axisValues: { color: 'white' }, colorTemperature: 4000, socketType: 'GU10', ipRating: 'IP44', priceTiyin: 95_000_000n, stock: 40 },
      { sku: 'BOLT-GU10-BLACK', axisValues: { color: 'black' }, colorTemperature: 3000, socketType: 'GU10', ipRating: 'IP44', priceTiyin: 98_000_000n, stock: 35 },
    ],
  },
  {
    slug: 'nova-bra',
    categorySlug: 'bra',
    name: { 'uz-Latn': 'Nova devor chirog‘i', 'uz-Cyrl': 'Nova девор чироғи', ru: 'Бра Nova' },
    brand: 'Kelvin',
    isFragile: true,
    variants: [
      { sku: 'NOVA-E14-BRASS', axisValues: { color: 'brass' }, colorTemperature: 2700, socketType: 'E14', ipRating: 'IP20', priceTiyin: 78_000_000n, stock: 25 },
    ],
  },
  {
    slug: 'crystal-royal-12l',
    categorySlug: 'lyustry',
    name: { 'uz-Latn': 'Royal Crystal 12L qandil', 'uz-Cyrl': 'Royal Crystal 12L қандил', ru: 'Люстра Royal Crystal 12L' },
    brand: 'LuxLight',
    isFragile: true,
    variants: [
      { sku: 'ROYAL-12L-GOLD', axisValues: { color: 'gold' }, colorTemperature: 2700, socketType: 'E14', ipRating: 'IP20', priceTiyin: 890_000_000n, stock: 5 },
      { sku: 'ROYAL-12L-CHROME', axisValues: { color: 'chrome' }, colorTemperature: 3000, socketType: 'E14', ipRating: 'IP20', priceTiyin: 920_000_000n, stock: 3 },
    ],
  },
  {
    slug: 'linea-track-3',
    categorySlug: 'trekovye-svetilniki',
    name: { 'uz-Latn': 'Linea trek 3-li', 'uz-Cyrl': 'Linea трек 3-ли', ru: 'Трековый Linea 3' },
    brand: 'Kelvin',
    isFragile: false,
    variants: [
      { sku: 'LINEA-TR3-BLACK', axisValues: { color: 'black' }, colorTemperature: 4000, socketType: 'GU10', ipRating: 'IP20', priceTiyin: 145_000_000n, stock: 30 },
      { sku: 'LINEA-TR3-WHITE', axisValues: { color: 'white' }, colorTemperature: 4000, socketType: 'GU10', ipRating: 'IP20', priceTiyin: 145_000_000n, stock: 28 },
    ],
  },
  {
    slug: 'lumen-panel-40',
    categorySlug: 'svetilniki',
    name: { 'uz-Latn': 'Lumen panel 40W', 'uz-Cyrl': 'Lumen панел 40W', ru: 'Панель Lumen 40W' },
    brand: 'BrightPro',
    isFragile: false,
    variants: [
      { sku: 'LUMEN-P40-4000', axisValues: { color: 'white' }, colorTemperature: 4000, socketType: 'E27', ipRating: 'IP40', priceTiyin: 62_000_000n, stock: 60 },
      { sku: 'LUMEN-P40-6500', axisValues: { color: 'white' }, colorTemperature: 6500, socketType: 'E27', ipRating: 'IP40', priceTiyin: 62_000_000n, stock: 55 },
    ],
  },
  {
    slug: 'stella-torsher',
    categorySlug: 'torshery',
    name: { 'uz-Latn': 'Stella torsher', 'uz-Cyrl': 'Stella торшер', ru: 'Торшер Stella' },
    brand: 'HomeLux',
    isFragile: true,
    variants: [
      { sku: 'STELLA-TRS-BLACK', axisValues: { color: 'black' }, colorTemperature: 3000, socketType: 'E27', ipRating: 'IP20', priceTiyin: 210_000_000n, stock: 14 },
    ],
  },
  {
    slug: 'desk-arc-lamp',
    categorySlug: 'nastolnye-lampy',
    name: { 'uz-Latn': 'Arc stol chirog‘i', 'uz-Cyrl': 'Arc стол чироғи', ru: 'Настольная лампа Arc' },
    brand: 'HomeLux',
    isFragile: false,
    variants: [
      { sku: 'ARC-DESK-WHITE', axisValues: { color: 'white' }, colorTemperature: 4000, socketType: 'E14', ipRating: 'IP20', priceTiyin: 48_000_000n, stock: 42 },
      { sku: 'ARC-DESK-BLACK', axisValues: { color: 'black' }, colorTemperature: 4000, socketType: 'E14', ipRating: 'IP20', priceTiyin: 48_000_000n, stock: 38 },
    ],
  },
  {
    slug: 'led-strip-5m',
    categorySlug: 'svetodiodnye-lenty',
    name: { 'uz-Latn': 'LED lenta 5m RGB', 'uz-Cyrl': 'LED лента 5m RGB', ru: 'LED лента 5м RGB' },
    brand: 'Kelvin',
    isFragile: false,
    variants: [
      { sku: 'LED-STRIP-RGB5', axisValues: { color: 'white' }, colorTemperature: 6500, socketType: 'E27', ipRating: 'IP65', priceTiyin: 35_000_000n, stock: 120 },
    ],
  },
  {
    slug: 'orion-spot-cob',
    categorySlug: 'spoty',
    name: { 'uz-Latn': 'Orion COB spot', 'uz-Cyrl': 'Orion COB спот', ru: 'Спот Orion COB' },
    brand: 'BrightPro',
    isFragile: false,
    variants: [
      { sku: 'ORION-COB-WHITE', axisValues: { color: 'white' }, colorTemperature: 4000, socketType: 'GU10', ipRating: 'IP44', priceTiyin: 72_000_000n, stock: 48 },
      { sku: 'ORION-COB-BLACK', axisValues: { color: 'black' }, colorTemperature: 3000, socketType: 'GU10', ipRating: 'IP44', priceTiyin: 74_000_000n, stock: 44 },
    ],
  },
  {
    slug: 'garden-park-ip65',
    categorySlug: 'ulichnye-svetilniki',
    name: { 'uz-Latn': 'Park ko‘cha chirog‘i', 'uz-Cyrl': 'Park кўча чироғи', ru: 'Уличный светильник Park' },
    brand: 'OutLight',
    isFragile: false,
    variants: [
      { sku: 'PARK-IP65-GREY', axisValues: { color: 'grey' }, colorTemperature: 4000, socketType: 'E27', ipRating: 'IP65', priceTiyin: 165_000_000n, stock: 22 },
    ],
  },
  {
    slug: 'vega-bra-led',
    categorySlug: 'bra',
    name: { 'uz-Latn': 'Vega LED bra', 'uz-Cyrl': 'Vega LED бра', ru: 'Бра Vega LED' },
    brand: 'Kelvin',
    isFragile: true,
    variants: [
      { sku: 'VEGA-LED-GOLD', axisValues: { color: 'gold' }, colorTemperature: 3000, socketType: 'E14', ipRating: 'IP20', priceTiyin: 92_000_000n, stock: 33 },
    ],
  },
  {
    slug: 'atlas-chandelier-6l',
    categorySlug: 'lyustry',
    name: { 'uz-Latn': 'Atlas 6L qandil', 'uz-Cyrl': 'Atlas 6L қандил', ru: 'Люстра Atlas 6L' },
    brand: 'LuxLight',
    isFragile: true,
    variants: [
      { sku: 'ATLAS-6L-BLACK', axisValues: { color: 'black' }, colorTemperature: 3000, socketType: 'E27', ipRating: 'IP20', priceTiyin: 260_000_000n, stock: 10 },
      { sku: 'ATLAS-6L-GOLD', axisValues: { color: 'gold' }, colorTemperature: 2700, socketType: 'E27', ipRating: 'IP20', priceTiyin: 275_000_000n, stock: 9 },
    ],
  },
  {
    slug: 'mini-downlight-7w',
    categorySlug: 'svetilniki',
    name: { 'uz-Latn': 'Mini downlight 7W', 'uz-Cyrl': 'Mini downlight 7W', ru: 'Точечный Mini 7W' },
    brand: 'Kelvin',
    isFragile: false,
    variants: [
      { sku: 'MINI-DL-7W-WHITE', axisValues: { color: 'white' }, colorTemperature: 4000, socketType: 'GU10', ipRating: 'IP20', priceTiyin: 24_000_000n, stock: 200 },
    ],
  },
];

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

  for (const p of DEMO_PRODUCTS) {
    const cat = await prisma.category.findUnique({ where: { slug: p.categorySlug } });
    if (cat === null) {
      continue;
    }
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      create: { slug: p.slug, categoryId: cat.id, name: p.name, brand: p.brand, isFragile: p.isFragile, status: 'ACTIVE' },
      update: { status: 'ACTIVE' },
    });
    for (const v of p.variants) {
      const variant = await prisma.productVariant.upsert({
        where: { sku: v.sku },
        create: {
          productId: product.id,
          sku: v.sku,
          axisValues: v.axisValues,
          colorTemperature: v.colorTemperature,
          socketType: v.socketType,
          ipRating: v.ipRating,
          ipSatisfies: computeIpSatisfies(v.ipRating),
        },
        update: {},
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
        await prisma.stockMovement.create({
          data: { variantId: variant.id, warehouseId: mainWh.id, type: 'PURCHASE_RECEIPT', quantity: v.stock, note: 'seed' },
        });
      }
    }
  }
  const variantCount = DEMO_PRODUCTS.reduce((n, p) => n + p.variants.length, 0);
  console.log(`  ✓ ${String(DEMO_PRODUCTS.length)} demo mahsulot, ${String(variantCount)} variant (narx+qoldiq)`);
  console.log('  ⚠️ Qidiruv (Meilisearch) alohida indekslash talab qiladi — worker/reindex');
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
    districts: ['Chilonzor', 'Yunusobod', 'Mirzo Ulugʻbek', 'Yakkasaroy', 'Shayxontohur', 'Mirobod', 'Olmazor', 'Sergeli', 'Yashnobod', 'Bektemir', 'Uchtepa'],
    priceTiyin: 3_000_000n, // 30 000 so'm
    freeThresholdTiyin: 500_000_000n, // 5 000 000 so'mdan yuqori → bepul
    etaDaysMin: 1,
    etaDaysMax: 2,
  },
  {
    name: { 'uz-Latn': 'Toshkent viloyati', 'uz-Cyrl': 'Тошкент вилояти', ru: 'Ташкентская область' },
    districts: ['Zangiota', 'Qibray', 'Yangiyoʻl', 'Chirchiq', 'Angren', 'Bekobod', 'Ohangaron', 'Parkent'],
    priceTiyin: 5_000_000n, // 50 000 so'm
    freeThresholdTiyin: 800_000_000n,
    etaDaysMin: 2,
    etaDaysMax: 4,
  },
  {
    name: { 'uz-Latn': 'Boshqa viloyatlar', 'uz-Cyrl': 'Бошқа вилоятлар', ru: 'Другие регионы' },
    districts: ['Samarqand', 'Buxoro', 'Andijon', 'Fargʻona', 'Namangan', 'Qashqadaryo', 'Surxondaryo', 'Xorazm', 'Navoiy', 'Jizzax', 'Sirdaryo', 'Qoraqalpogʻiston'],
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
      data: { userId: user.id, fullName: 'Kuryer Aliyev', phone: '+998901112233', vehicleType: 'car', isActive: true },
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
      title: { 'uz-Latn': 'Uyni tashqaridan qanday yoritish kerak?', ru: 'Как правильно освещать дом снаружи?' },
      excerpt: { 'uz-Latn': 'Fasad va hovli yoritishning asosiy tamoyillari.', ru: 'Основные принципы фасадного и уличного освещения.' },
      body: { 'uz-Latn': 'Tashqi yoritishda IP darajasi va harorat muhim...', ru: 'При наружном освещении важны степень защиты IP и температура...' },
    },
    {
      slug: 'qandil-tanlash',
      title: { 'uz-Latn': 'Zal uchun qandil tanlash', ru: 'Как выбрать люстру для зала' },
      excerpt: { 'uz-Latn': 'O‘lcham, yorug‘lik oqimi va uslub.', ru: 'Размер, световой поток и стиль.' },
      body: { 'uz-Latn': 'Xona maydoniga qarab lampalar sonini tanlang...', ru: 'Выбирайте количество ламп по площади комнаты...' },
    },
  ];
  for (const p of posts) {
    const existing = await prisma.blogPost.findUnique({ where: { slug: p.slug } });
    if (existing === null) {
      await prisma.blogPost.create({
        data: { slug: p.slug, title: p.title, excerpt: p.excerpt, body: p.body, isPublished: true, publishedAt: new Date('2026-01-15') },
      });
    }
  }
  const pages = [
    { slug: 'o-kompanii', title: { 'uz-Latn': 'Kompaniya haqida', ru: 'О компании' }, body: { 'uz-Latn': 'Kelvin — yoritish do‘koni.', ru: 'Kelvin — магазин освещения.' } },
    { slug: 'dostavka-i-oplata', title: { 'uz-Latn': 'Yetkazib berish va to‘lov', ru: 'Доставка и оплата' }, body: { 'uz-Latn': 'Toshkent bo‘ylab yetkazib beramiz.', ru: 'Доставляем по Ташкенту.' } },
    { slug: 'vozvrat', title: { 'uz-Latn': 'Qaytarish', ru: 'Возврат' }, body: { 'uz-Latn': 'Tovarni 7 kun ichida qaytarish mumkin.', ru: 'Товар можно вернуть в течение 7 дней.' } },
    { slug: 'garantiya', title: { 'uz-Latn': 'Kafolat', ru: 'Гарантия' }, body: { 'uz-Latn': 'Barcha mahsulotlarga kafolat beriladi.', ru: 'На все товары предоставляется гарантия.' } },
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

// --- 8. SHOWCASE — "jonli do'kon" ko'rinishi (FAQAT dev, bir marta) -----------
async function seedShowcase(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  if ((await prisma.order.count()) > 0) {
    console.log('  ⏭  Showcase — ma\'lumot allaqachon bor, o\'tkazib yuborildi');
    return;
  }

  const DAY = 86_400_000;
  const daysAgo = (n: number): Date => new Date(Date.now() - n * DAY);
  const daysAhead = (n: number): Date => new Date(Date.now() + n * DAY);

  const mainWh = await prisma.warehouse.findUnique({ where: { code: 'MAIN' } });
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@kelvin.uz' } });
  const salesUser = await prisma.user.findUnique({ where: { email: 'sales@kelvin.uz' } });
  const zones = await prisma.deliveryZone.findMany();
  if (mainWh === null || adminUser === null || salesUser === null || zones.length === 0) {
    return;
  }

  const variants = await prisma.productVariant.findMany({ include: { product: true, prices: true } });
  const priced = variants
    .filter((v) => v.prices.length > 0)
    .map((v) => ({ id: v.id, sku: v.sku, productId: v.productId, name: v.product.name as I18n, axis: v.axisValues, price: v.prices[0]!.amount }));
  if (priced.length === 0) {
    return;
  }
  const pick = (i: number): (typeof priced)[number] => priced[i % priced.length]!;

  // --- Mijozlar (User + Customer + Address) ----------------------------------
  const password = process.env.SEED_DEV_PASSWORD ?? 'kelvin-dev-password';
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
  const CUSTOMERS = [
    { first: 'Sardor', last: 'Karimov', phone: '+998901234501', email: 'customer@kelvin.uz', district: 'Chilonzor' },
    { first: 'Nilufar', last: 'Azizova', phone: '+998901234502', district: 'Yunusobod' },
    { first: 'Jasur', last: 'Toshmatov', phone: '+998901234503', district: 'Mirzo Ulugʻbek' },
    { first: 'Dilnoza', last: 'Rahimova', phone: '+998901234504', district: 'Yakkasaroy' },
    { first: 'Bekzod', last: 'Yusupov', phone: '+998901234505', district: 'Shayxontohur' },
    { first: 'Malika', last: 'Ergasheva', phone: '+998901234506', district: 'Sergeli' },
    { first: 'Otabek', last: 'Nazarov', phone: '+998901234507', district: 'Chirchiq' },
    { first: 'Kamola', last: 'Islomova', phone: '+998901234508', district: 'Samarqand' },
  ];
  const customers: { id: string; first: string }[] = [];
  for (const c of CUSTOMERS) {
    let userId: string | undefined;
    if (c.email !== undefined) {
      const u = await prisma.user.upsert({
        where: { email: c.email },
        create: { email: c.email, passwordHash, status: 'ACTIVE', emailVerified: true, locale: 'uz-Latn' },
        update: { passwordHash, status: 'ACTIVE' },
      });
      await prisma.userRole.deleteMany({ where: { userId: u.id, scopeType: null } });
      await prisma.userRole.create({ data: { userId: u.id, role: 'CUSTOMER' } });
      userId = u.id;
    }
    const cust = await prisma.customer.create({
      data: { phone: c.phone, firstName: c.first, lastName: c.last, ...(c.email !== undefined && { email: c.email }), ...(userId !== undefined && { userId }) },
    });
    await prisma.address.create({
      data: { customerId: cust.id, region: 'Toshkent', city: 'Toshkent', district: c.district, street: `${c.district} ko‘chasi, ${String(10 + customers.length)}-uy`, isDefault: true },
    });
    customers.push({ id: cust.id, first: c.first });
  }

  // --- Buyurtmalar (turli holat + sana) + to'lov + ledger ---------------------
  const PLAN: { status: string; paid: boolean; provider: 'CASH' | 'CLICK'; ageDays: number; items: number }[] = [
    { status: 'COMPLETED', paid: true, provider: 'CLICK', ageDays: 28, items: 2 },
    { status: 'COMPLETED', paid: true, provider: 'CASH', ageDays: 25, items: 1 },
    { status: 'COMPLETED', paid: true, provider: 'CLICK', ageDays: 22, items: 3 },
    { status: 'DELIVERED', paid: true, provider: 'CLICK', ageDays: 18, items: 2 },
    { status: 'DELIVERED', paid: true, provider: 'CASH', ageDays: 15, items: 1 },
    { status: 'SHIPPED', paid: true, provider: 'CLICK', ageDays: 9, items: 2 },
    { status: 'PACKED', paid: true, provider: 'CLICK', ageDays: 6, items: 1 },
    { status: 'CONFIRMED', paid: true, provider: 'CASH', ageDays: 5, items: 2 },
    { status: 'CONFIRMED', paid: true, provider: 'CLICK', ageDays: 4, items: 3 },
    { status: 'CONFIRMED', paid: true, provider: 'CLICK', ageDays: 3, items: 1 },
    { status: 'PAID', paid: true, provider: 'CLICK', ageDays: 2, items: 2 },
    { status: 'PENDING_PAYMENT', paid: false, provider: 'CLICK', ageDays: 1, items: 1 },
    { status: 'PENDING_PAYMENT', paid: false, provider: 'CASH', ageDays: 1, items: 2 },
    { status: 'CANCELLED', paid: false, provider: 'CLICK', ageDays: 12, items: 1 },
    { status: 'DRAFT', paid: false, provider: 'CASH', ageDays: 0, items: 1 },
  ];

  const confirmedOrderIds: string[] = [];
  let seq = 900001;
  let itemCursor = 0;
  for (let i = 0; i < PLAN.length; i++) {
    const plan = PLAN[i]!;
    const cust = customers[i % customers.length]!;
    const zone = zones[i % zones.length]!;
    const items = Array.from({ length: plan.items }, () => pick(itemCursor++));
    const subtotal = items.reduce((s, it) => s + it.price, 0n);
    const deliveryFee = subtotal >= 500_000_000n ? 0n : zone.priceAmount;
    const total = subtotal + deliveryFee;
    const createdAt = daysAgo(plan.ageDays);

    const order = await prisma.order.create({
      data: {
        number: `KLV-2026-${String(seq++)}`,
        customerId: cust.id,
        status: plan.status as never,
        channel: 'ONLINE',
        subtotalAmount: subtotal,
        discountAmount: 0n,
        deliveryAmount: deliveryFee,
        totalAmount: total,
        currency: 'UZS',
        createdAt,
        ...(plan.status === 'PENDING_PAYMENT' && { placedAt: createdAt }),
        ...(plan.status === 'CANCELLED' && { cancelledAt: createdAt, cancelReason: 'Mijoz bekor qildi' }),
        ...(plan.status === 'COMPLETED' && { completedAt: createdAt }),
        items: {
          create: items.map((it) => ({
            variantId: it.id,
            sku: it.sku,
            productName: it.name,
            variantAxis: it.axis as Prisma.InputJsonValue,
            attributesSnapshot: {},
            quantity: 1,
            unitAmount: it.price,
            totalAmount: it.price,
            currency: 'UZS',
          })),
        },
        statusHistory: { create: { toStatus: plan.status as never, reason: 'seed showcase' } },
      },
    });
    if (['CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(plan.status)) {
      confirmedOrderIds.push(order.id);
    }

    if (plan.paid) {
      const landing = plan.provider === 'CASH' ? 'asset.cash.courier' : 'asset.receivable.provider';
      const payment = await prisma.payment.create({
        data: { orderId: order.id, provider: plan.provider, status: 'PAID', amount: total, currency: 'UZS', idempotencyKey: `seed-${order.id}`, paidAt: createdAt, providerTransactionId: `seed-${plan.provider}-${order.number}`, createdAt },
      });
      const txId = randomUUID();
      await prisma.ledgerEntry.createMany({
        data: [
          { transactionId: txId, paymentId: payment.id, account: landing, direction: 'DEBIT', amount: total, description: 'Sotuv to‘lovi' },
          { transactionId: txId, paymentId: payment.id, account: 'revenue.product', direction: 'CREDIT', amount: total, description: 'Mahsulot daromadi' },
        ],
      });
      // Onlayn to'lovlarning yarmi settlement qilingan (receivable→bank).
      if (plan.provider === 'CLICK' && i % 2 === 0) {
        const fee = total / 100n; // 1% komissiya
        const stId = randomUUID();
        await prisma.ledgerEntry.createMany({
          data: [
            { transactionId: stId, paymentId: payment.id, account: 'asset.cash.bank', direction: 'DEBIT', amount: total - fee, description: 'Settlement — net' },
            { transactionId: stId, paymentId: payment.id, account: 'expense.provider_fee', direction: 'DEBIT', amount: fee, description: 'Provayder komissiyasi' },
            { transactionId: stId, paymentId: payment.id, account: 'asset.receivable.provider', direction: 'CREDIT', amount: total, description: 'Qarz yopildi' },
          ],
        });
      }
    }
  }

  // --- Sharhlar (tasdiqlangan) -----------------------------------------------
  const REVIEW_TEXTS = [
    { r: 5, t: 'Ajoyib sifat', b: 'Juda chiroyli, uyimga mos keldi. Tavsiya qilaman!' },
    { r: 5, t: 'Отличный товар', b: 'Качество на высоте, доставили быстро.' },
    { r: 4, t: 'Yaxshi', b: 'Yorug‘lik yaxshi, lekin biroz kichik ko‘rindi.' },
    { r: 5, t: 'Zo‘r', b: 'Narxi sifatiga arziydi, rahmat!' },
    { r: 4, t: 'Хорошо', b: 'Всё понравилось, упаковка надёжная.' },
    { r: 3, t: 'O‘rtacha', b: 'Ishlaydi, lekin montaj biroz qiyin bo‘ldi.' },
    { r: 5, t: 'Tavsiya qilaman', b: 'Ikkinchi marta olyapman, sifati barqaror.' },
  ];
  const products = await prisma.product.findMany({ take: 12 });
  let reviewCount = 0;
  for (let i = 0; i < products.length && i < REVIEW_TEXTS.length + 5; i++) {
    const p = products[i]!;
    const rev = REVIEW_TEXTS[i % REVIEW_TEXTS.length]!;
    const cust = customers[i % customers.length]!;
    try {
      await prisma.review.create({
        data: { productId: p.id, customerId: cust.id, rating: rev.r, title: rev.t, body: rev.b, status: 'APPROVED', isVerifiedPurchase: i % 2 === 0, moderatedBy: adminUser.id, createdAt: daysAgo(i + 2) },
      });
      reviewCount++;
    } catch {
      // unique(product, customer) — o'tkazib yuborish
    }
  }

  // --- Savol-javob -----------------------------------------------------------
  const QA = [
    { q: 'Lampalar complektда bormi?', a: 'Ha, barcha lampalar to‘plamda keladi.' },
    { q: 'Гарантия сколько?', a: '24 месяца официальной гарантии.' },
    { q: 'Montaj xizmati bormi?', a: 'Ha, Toshkent bo‘ylab o‘rnatish xizmati mavjud.' },
    { q: 'Ranglari boshqa bormi?', a: 'Oltin va xrom variantlari mavjud.' },
  ];
  for (let i = 0; i < QA.length && i < products.length; i++) {
    const p = products[i]!;
    const cust = customers[(i + 3) % customers.length]!;
    const question = await prisma.question.create({
      data: { productId: p.id, customerId: cust.id, body: QA[i]!.q, status: 'APPROVED', createdAt: daysAgo(i + 1) },
    });
    await prisma.answer.create({ data: { questionId: question.id, body: QA[i]!.a, authorUserId: adminUser.id, isOfficial: true } });
  }

  // --- Lidlar (voronka) ------------------------------------------------------
  const LEADS = [
    { name: 'Aziz Qodirov', phone: '+998935550101', status: 'NEW' },
    { name: 'Gulnora Sattorova', phone: '+998935550102', status: 'NEW' },
    { name: 'Rustam Yo‘ldoshev', phone: '+998935550103', status: 'CONTACTED' },
    { name: 'Zarina Umarova', phone: '+998935550104', status: 'CONTACTED' },
    { name: 'Sherzod Hakimov', phone: '+998935550105', status: 'QUALIFIED' },
    { name: 'Feruza Xolmatova', phone: '+998935550106', status: 'PROPOSAL' },
    { name: 'Dilshod Rasulov', phone: '+998935550107', status: 'WON', est: 4_500_000_00n },
    { name: 'Nodira Yusupova', phone: '+998935550108', status: 'WON', est: 2_800_000_00n },
    { name: 'Akmal Tursunov', phone: '+998935550109', status: 'LOST', lost: 'Narx qimmat' },
  ];
  for (let i = 0; i < LEADS.length; i++) {
    const l = LEADS[i]!;
    await prisma.lead.create({
      data: {
        name: l.name, phone: l.phone, source: ['WEBSITE_FORM', 'PHONE', 'TELEGRAM', 'INSTAGRAM'][i % 4]!, status: l.status as never,
        assignedTo: salesUser.id,
        ...(l.est !== undefined && { estimatedAmount: l.est }),
        ...(l.lost !== undefined && { lostReason: l.lost }),
        createdAt: daysAgo(i),
      },
    });
  }

  // --- Yetkazish slotlari (kelasi 7 kun) -------------------------------------
  for (const z of zones) {
    for (let d = 1; d <= 7; d++) {
      for (const w of [{ s: '10:00', e: '13:00' }, { s: '14:00', e: '18:00' }]) {
        await prisma.deliverySlot.create({
          data: { zoneId: z.id, date: daysAhead(d), startTime: w.s, endTime: w.e, capacity: 5, booked: (d + w.s.length) % 4 },
        });
      }
    }
  }

  // --- Bannerlar -------------------------------------------------------------
  await prisma.banner.createMany({
    data: [
      { title: { 'uz-Latn': 'Yangi qandillar 30% chegirma', ru: 'Новые люстры -30%' }, imageUrl: 'https://picsum.photos/seed/kelvin1/1200/400', linkUrl: '/search', position: 'HOME_HERO', sortOrder: 0 },
      { title: { 'uz-Latn': 'LED yoritish yechimlari', ru: 'LED решения для дома' }, imageUrl: 'https://picsum.photos/seed/kelvin2/1200/400', linkUrl: '/catalog', position: 'HOME_HERO', sortOrder: 1 },
      { title: { 'uz-Latn': 'Bepul yetkazib berish', ru: 'Бесплатная доставка' }, imageUrl: 'https://picsum.photos/seed/kelvin3/1200/200', position: 'HOME_STRIP', sortOrder: 0 },
    ],
  });

  // --- Ta'minotchi + xarid buyurtmalari --------------------------------------
  const supplier = await prisma.supplier.create({ data: { name: 'LuxLight Import MChJ', code: 'LUXLIGHT', phone: '+998712001020', email: 'sales@luxlight.uz' } });
  const poVariants = priced.slice(0, 3);
  await prisma.purchaseOrder.create({
    data: {
      number: 'PO-2026-000001', supplierId: supplier.id, warehouseId: mainWh.id, status: 'RECEIVED', totalAmount: 500_000_000n, currency: 'UZS', createdAt: daysAgo(20),
      items: { create: poVariants.map((v) => ({ variantId: v.id, quantityOrdered: 20, quantityReceived: 20, unitCostAmount: v.price / 2n })) },
    },
  });
  await prisma.purchaseOrder.create({
    data: {
      number: 'PO-2026-000002', supplierId: supplier.id, warehouseId: mainWh.id, status: 'ORDERED', totalAmount: 300_000_000n, currency: 'UZS', createdAt: daysAgo(3),
      items: { create: poVariants.slice(0, 2).map((v) => ({ variantId: v.id, quantityOrdered: 15, quantityReceived: 0, unitCostAmount: v.price / 2n })) },
    },
  });

  // --- POS smena (yopilgan) + tranzaksiyalar ---------------------------------
  const shift = await prisma.posShift.create({
    data: { userId: salesUser.id, status: 'CLOSED', openingCashAmount: 50_000_000n, closingCashAmount: 194_000_000n, cashDifferenceAmount: 0n, openedAt: daysAgo(1), closedAt: daysAgo(1) },
  });
  let posSeq = 1;
  for (const v of priced.slice(0, 3)) {
    const txId = randomUUID();
    await prisma.posTransaction.create({
      data: {
        shiftId: shift.id, number: `POS-000${String(posSeq++)}`, paymentMethod: posSeq % 2 === 0 ? 'CARD' : 'CASH', totalAmount: v.price, warehouseId: mainWh.id, status: 'COMPLETED', createdAt: daysAgo(1),
        items: { create: [{ variantId: v.id, sku: v.sku, quantity: 1, unitAmount: v.price, totalAmount: v.price }] },
      },
    });
    await prisma.ledgerEntry.createMany({
      data: [
        { transactionId: txId, account: 'asset.cash.register', direction: 'DEBIT', amount: v.price, description: 'POS sotuvi' },
        { transactionId: txId, account: 'revenue.product', direction: 'CREDIT', amount: v.price, description: 'POS daromadi' },
      ],
    });
  }

  // --- Rassrochka rejasi (CONFIRMED buyurtmadan) -----------------------------
  if (confirmedOrderIds.length > 0) {
    const ord = await prisma.order.findUnique({ where: { id: confirmedOrderIds[0]! } });
    if (ord !== null) {
      const principal = ord.totalAmount;
      const months = 3;
      const monthly = principal / BigInt(months);
      const remainder = principal - monthly * BigInt(months);
      const plan = await prisma.installmentPlan.create({
        data: {
          orderId: ord.id, kind: 'OWN', principalAmount: principal, downPaymentAmount: 0n, totalPayableAmount: principal, interestRateBp: 0, termMonths: months, status: 'PENDING',
          schedule: {
            create: Array.from({ length: months }, (_, m) => ({
              installmentNumber: m + 1, dueDate: daysAhead((m + 1) * 30), amount: m === 0 ? monthly + remainder : monthly, paidAmount: m === 0 ? monthly + remainder : 0n, status: m === 0 ? 'PAID' : 'PENDING', ...(m === 0 && { paidAt: daysAgo(1) }),
            })),
          },
        },
      });
      void plan;
    }
  }

  console.log(`  ✓ Showcase: ${String(customers.length)} mijoz, ${String(PLAN.length)} buyurtma, ${String(reviewCount)} sharh, ${String(QA.length)} savol, ${String(LEADS.length)} lid, slotlar, 3 banner, 2 PO, POS smena, rassrochka`);
}

async function main(): Promise<void> {
  console.log('Kelvin seed boshlandi...');
  await seedCategories();
  await seedAttributes();
  await seedWarehouses();
  await seedDevUsers();
  await seedDemoProducts();
  await seedDeliveryZones();
  await seedCouriers();
  await seedContent();
  await seedShowcase();
  console.log('Seed tugadi.');
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
