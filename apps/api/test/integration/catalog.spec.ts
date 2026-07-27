import { type Server } from 'node:http';
import request from 'supertest';

import { createHarness, type TestHarness } from './helpers/harness';
import { AccessTokenService } from '../../src/modules/identity/token/access-token.service';

/**
 * Katalog — REAL PostgreSQL. Kategoriya, atribut, mahsulot, variant matritsasi,
 * IP materializatsiyasi. docs/05-catalog-and-search.md
 */
describe('Catalog (integration)', () => {
  let h: TestHarness;
  let token: string;

  beforeAll(async () => {
    h = await createHarness();

    // OWNER token (barcha ruxsatlar)
    const access = h.app.get(AccessTokenService);
    const user = await h.prisma.user.create({
      data: { email: 'owner-cat@kelvin.uz', status: 'ACTIVE' },
    });
    await h.prisma.userRole.create({ data: { userId: user.id, role: 'OWNER' } });
    token = await access.sign({ sub: user.id, roles: ['OWNER'], fid: 'test-fam' });

    // Variant o'qlari uchun atributlar (color, bulb_count)
    const color = await h.prisma.attribute.create({
      data: { code: 'color', type: 'ENUM', name: { ru: 'Цвет' }, isVariantAxis: true },
    });
    for (const c of ['gold', 'chrome', 'black']) {
      await h.prisma.attributeValue.create({
        data: { attributeId: color.id, code: c, label: { ru: c } },
      });
    }
    const bulb = await h.prisma.attribute.create({
      data: { code: 'bulb_count', type: 'NUMBER', name: { ru: 'Лампы' }, isVariantAxis: true },
    });
    for (const c of ['6', '8']) {
      await h.prisma.attributeValue.create({
        data: { attributeId: bulb.id, code: c, label: { ru: c } },
      });
    }
    // Filtrlanadigan, lekin o'q EMAS
    await h.prisma.attribute.create({
      data: { code: 'socket_type', type: 'ENUM', name: { ru: 'Цоколь' }, isVariantAxis: false },
    });
  });

  afterAll(async () => {
    await h.teardown();
  });

  const agent = (): request.Agent => request(h.app.getHttpServer() as Server);
  const auth = (r: request.Test): request.Test => r.set('Authorization', `Bearer ${token}`);

  let categoryId: string;
  let productId: string;

  // --- Kategoriya -----------------------------------------------------------

  it('kategoriya yaratish — materialized path', async () => {
    const res = await auth(agent().post('/api/v1/categories')).send({
      slug: 'lyustry',
      name: { 'uz-Latn': 'Qandillar', ru: 'Люстры' },
    });
    expect(res.status).toBe(201);
    expect(res.body.path).toBe('/lyustry/');
    expect(res.body.depth).toBe(0);
    categoryId = res.body.id;
  });

  it('ichki kategoriya — path meros', async () => {
    const res = await auth(agent().post('/api/v1/categories')).send({
      slug: 'hrustalnye',
      name: { ru: 'Хрустальные' },
      parentId: categoryId,
    });
    expect(res.status).toBe(201);
    expect(res.body.path).toBe('/lyustry/hrustalnye/');
    expect(res.body.depth).toBe(1);
  });

  it('takroriy slug → 409', async () => {
    const res = await auth(agent().post('/api/v1/categories')).send({
      slug: 'lyustry',
      name: { ru: 'X' },
    });
    expect(res.status).toBe(409);
  });

  it('kategoriya daraxti (ommaviy)', async () => {
    const res = await agent().get('/api/v1/categories');
    expect(res.status).toBe(200);
    const root = res.body.find((c: { slug: string }) => c.slug === 'lyustry');
    expect(root.children).toHaveLength(1);
  });

  it('ruxsatsiz yaratish → 401', async () => {
    const res = await agent()
      .post('/api/v1/categories')
      .send({ slug: 'x', name: { ru: 'X' } });
    expect(res.status).toBe(401);
  });

  // --- Atribut --------------------------------------------------------------

  it('atributlar reestri (ommaviy)', async () => {
    const res = await agent().get('/api/v1/attributes');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(3);
  });

  it('ip_rating uchun yaroqsiz IP qiymati rad etiladi', async () => {
    const ip = await auth(agent().post('/api/v1/attributes')).send({
      code: 'ip_rating',
      type: 'TEXT',
      name: { ru: 'IP' },
    });
    expect(ip.status).toBe(201);
    const bad = await auth(agent().post(`/api/v1/attributes/${ip.body.id as string}/values`)).send({
      code: 'IP99',
      label: { ru: 'IP99' },
    });
    expect(bad.status).toBe(422);
  });

  // --- Mahsulot + variant matritsasi ---------------------------------------

  it('mahsulot yaratish (DRAFT)', async () => {
    const res = await auth(agent().post('/api/v1/products')).send({
      slug: 'aurora',
      categoryId,
      name: { 'uz-Latn': 'Aurora qandil', ru: 'Люстра Aurora' },
      isFragile: true,
    });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('DRAFT');
    productId = res.body.id;
  });

  it('variantsiz nashr → INCOMPLETE_PRODUCT (422)', async () => {
    const res = await auth(agent().post(`/api/v1/products/${productId}/publish`));
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('INCOMPLETE_PRODUCT');
  });

  it('variant matritsasi: color(3) × bulb_count(2) = 6 SKU', async () => {
    const res = await auth(agent().post(`/api/v1/products/${productId}/variants/generate`)).send({
      axes: [
        { attributeCode: 'color', valueCodes: ['gold', 'chrome', 'black'] },
        { attributeCode: 'bulb_count', valueCodes: ['6', '8'] },
      ],
    });
    expect(res.status).toBe(201);
    expect(res.body.variants).toHaveLength(6);
    const skus = res.body.variants.map((v: { sku: string }) => v.sku);
    expect(new Set(skus).size).toBe(6); // noyob SKU
    expect(skus).toContain('AURORA-GOLD-6');
  });

  it('regeneratsiya DESTRUKTIV EMAS + excludedKeys', async () => {
    // black ni olib tashlaymiz → color(2)×bulb(2)=4, lekin gold/chrome variantlar SAQLANADI
    const before = await h.prisma.productVariant.findFirst({
      where: { productId, sku: 'AURORA-GOLD-6' },
    });
    const res = await auth(agent().post(`/api/v1/products/${productId}/variants/generate`)).send({
      axes: [
        { attributeCode: 'color', valueCodes: ['gold', 'chrome'] },
        { attributeCode: 'bulb_count', valueCodes: ['6', '8'] },
      ],
    });
    expect(res.status).toBe(201);
    expect(res.body.variants).toHaveLength(4);
    // gold-6 o'sha variant (id o'zgarmagan)
    const after = res.body.variants.find((v: { sku: string }) => v.sku === 'AURORA-GOLD-6');
    expect(after.id).toBe(before?.id);
    // black-* soft-delete bo'ldi
    const deleted = await h.prisma.productVariant.count({
      where: { productId, deletedAt: { not: null } },
    });
    expect(deleted).toBe(2);
  });

  it('⚠️ IP MATERIALIZATSIYASI: variantga IP65 → ipSatisfies to‘g‘ri (IP67 tuzog‘i)', async () => {
    const product = await h.prisma.product.findFirst({
      where: { id: productId },
      include: { variants: { where: { deletedAt: null }, take: 1 } },
    });
    const variantId = product!.variants[0]!.id;

    const res = await auth(agent().patch(`/api/v1/products/variants/${variantId}`)).send({
      ipRating: 'IP65',
      socketType: 'E27',
    });
    expect(res.status).toBe(200);

    const updated = await h.prisma.productVariant.findFirst({ where: { id: variantId } });
    expect(updated?.ipRating).toBe('IP65');
    expect(updated?.ipSatisfies).toContain('IP44');
    expect(updated?.ipSatisfies).toContain('IP65');
    // TUZOQ: IP65 IP67 talabini QANOATLANTIRMAYDI
    expect(updated?.ipSatisfies).not.toContain('IP67');
  });

  it('nashr qilish → ACTIVE; ommaviy sahifada variantlar ko‘rinadi', async () => {
    const pub = await auth(agent().post(`/api/v1/products/${productId}/publish`));
    expect(pub.status).toBe(201);
    expect(pub.body.status).toBe('ACTIVE');

    const publicView = await agent().get('/api/v1/products/aurora');
    expect(publicView.status).toBe(200);
    expect(publicView.body.variants.length).toBe(4);
  });

  it('DRAFT mahsulot ommaviy sahifada 404', async () => {
    await auth(agent().post('/api/v1/products')).send({
      slug: 'draft-product',
      categoryId,
      name: { ru: 'Draft' },
    });
    const res = await agent().get('/api/v1/products/draft-product');
    expect(res.status).toBe(404);
  });

  it('shtrix-kod / SKU bo‘yicha variant lookup (skaner, docs/15 §8 6.6)', async () => {
    const cat = await h.prisma.category.create({
      data: { slug: 'lookup-cat', name: { ru: 'L' }, path: '/lookup-cat/' },
    });
    const prod = await h.prisma.product.create({
      data: { categoryId: cat.id, slug: 'lookup-prod', name: { ru: 'Lookup' }, status: 'ACTIVE' },
    });
    await h.prisma.productVariant.create({
      data: { productId: prod.id, sku: 'LOOKUP-SKU-1', barcode: '4780000000017', axisValues: {} },
    });

    const byBarcode = await auth(agent().get('/api/v1/products/lookup?code=4780000000017'));
    expect(byBarcode.status).toBe(200);
    expect(byBarcode.body.sku).toBe('LOOKUP-SKU-1');
    expect(byBarcode.body.productSlug).toBe('lookup-prod');

    const bySku = await auth(agent().get('/api/v1/products/lookup?code=LOOKUP-SKU-1'));
    expect(bySku.body.barcode).toBe('4780000000017');

    const notFound = await auth(agent().get('/api/v1/products/lookup?code=NOPE'));
    expect(notFound.status).toBe(404);

    const noCode = await auth(agent().get('/api/v1/products/lookup'));
    expect(noCode.status).toBe(400);
  });

  it('mutatsiyalar AuditLog ga tushadi + outbox event', async () => {
    const audit = await h.prisma.auditLog.count({
      where: { action: { in: ['PRODUCT_CREATE', 'PRODUCT_VARIANTS_GENERATE', 'PRODUCT_PUBLISH'] } },
    });
    expect(audit).toBeGreaterThanOrEqual(3);
    const outbox = await h.prisma.outboxEvent.count({
      where: { aggregateType: 'Product' },
    });
    expect(outbox).toBeGreaterThanOrEqual(1);
  });
});
