import { type Server } from 'node:http';
import request from 'supertest';
import sharp from 'sharp';

import { createHarness, type TestHarness } from './helpers/harness';
import { AccessTokenService } from '../../src/modules/identity/token/access-token.service';
import { MediaProcessingService } from '../../src/modules/catalog/media/media-processing.service';

/**
 * Media pipeline — REAL PostgreSQL + Redis + MinIO (S3).
 * upload-url → PUT (presigned) → confirm → process (sharp) → derivativlar.
 * docs/05-catalog-and-search.md §1.5
 */
describe('Media (integration, MinIO)', () => {
  let h: TestHarness;
  let token: string;
  let productId: string;

  beforeAll(async () => {
    h = await createHarness({ storage: true });

    const access = h.app.get(AccessTokenService);
    const user = await h.prisma.user.create({
      data: { email: 'owner-media@kelvin.uz', status: 'ACTIVE' },
    });
    await h.prisma.userRole.create({ data: { userId: user.id, role: 'OWNER' } });
    token = await access.sign({ sub: user.id, roles: ['OWNER'], fid: 'test-fam' });

    const category = await h.prisma.category.create({
      data: { slug: 'lyustry', name: { ru: 'Люстры' }, path: '/lyustry/' },
    });
    const product = await h.prisma.product.create({
      data: { categoryId: category.id, slug: 'aurora', name: { ru: 'Aurora' } },
    });
    productId = product.id;
  }, 180_000);

  afterAll(async () => {
    await h.teardown();
  });

  const agent = (): request.Agent => request(h.app.getHttpServer() as Server);
  const auth = (r: request.Test): request.Test => r.set('Authorization', `Bearer ${token}`);

  it('to‘liq oqim: upload-url → PUT → confirm → process → derivativlar', async () => {
    // 1. Presigned upload URL
    const ticket = await auth(agent().post('/api/v1/media/upload-url')).send({
      kind: 'IMAGE',
      contentType: 'image/png',
      filename: 'aurora.png',
      productId,
    });
    expect(ticket.status).toBe(201);
    expect(typeof ticket.body.uploadUrl).toBe('string');
    const { mediaId, uploadUrl } = ticket.body as { mediaId: string; uploadUrl: string };

    // 2. Rasmni to'g'ridan-to'g'ri S3'ga PUT (mijoz qiladigan ish)
    const png = await sharp({
      create: { width: 1200, height: 900, channels: 3, background: { r: 210, g: 140, b: 60 } },
    })
      .png()
      .toBuffer();
    const put = await fetch(uploadUrl, {
      method: 'PUT',
      body: png,
      headers: { 'Content-Type': 'image/png' },
    });
    expect(put.ok).toBe(true);

    // 3. Confirm — outbox event navbatga tushadi
    const confirm = await auth(agent().post(`/api/v1/media/${mediaId}/confirm`));
    expect(confirm.status).toBe(201);
    const outbox = await h.prisma.outboxEvent.count({
      where: { eventType: 'MediaUploaded', aggregateId: mediaId },
    });
    expect(outbox).toBe(1);

    // 4. Qayta ishlash (worker qiladigan ish — bu yerda to'g'ridan chaqiramiz)
    await h.app.get(MediaProcessingService).process(mediaId);

    // 5. Derivativlar + LQIP yozilgan
    const media = await h.prisma.media.findUnique({ where: { id: mediaId } });
    const derivatives = media?.derivatives as {
      status?: string;
      lqip?: string;
      sizes?: { width: number; format: string; url: string }[];
    };
    expect(derivatives.status).toBe('READY');
    expect(derivatives.lqip?.startsWith('data:image/webp;base64,')).toBe(true);
    // 1200px → 400,800,1200 × 3 format = 9 derivativ
    expect(derivatives.sizes?.length).toBe(9);
    expect(new Set(derivatives.sizes?.map((s) => s.format))).toEqual(
      new Set(['avif', 'webp', 'jpeg']),
    );
    // Media galereyada ko'rinadi
    const gallery = await agent().get(`/api/v1/media/product/${productId}`);
    expect(gallery.status).toBe(200);
    expect(gallery.body.length).toBe(1);
  }, 120_000);

  it('rasmsiz (productId/variantId yo‘q) → 422', async () => {
    const res = await auth(agent().post('/api/v1/media/upload-url')).send({
      kind: 'IMAGE',
      contentType: 'image/png',
      filename: 'x.png',
    });
    expect(res.status).toBe(422);
  });
});
