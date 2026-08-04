import { type Server } from 'node:http';
import request from 'supertest';

import { createHarness, type TestHarness } from './helpers/harness';

/**
 * customer — mijoz manzillari. Register → token → address CRUD + EGALIK.
 */
describe('Customer addresses (integration)', () => {
  let h: TestHarness;

  beforeAll(async () => {
    h = await createHarness();
  }, 180_000);

  afterAll(async () => {
    await h.teardown();
  });

  const agent = (): request.Agent => request(h.app.getHttpServer() as Server);

  /** Yangi mijoz: register → kod (Notification'dan) → verify. Token qaytaradi. */
  const registerCustomer = async (): Promise<string> => {
    const email = `mijoz-${String(Date.now())}-${String(Math.floor(Math.random() * 1000))}@kelvin.uz`;
    await agent().post('/api/v1/auth/register').send({ email, password: 'addr-pass-123' });
    const n = await h.prisma.notification.findFirst({
      where: { recipient: email, templateKey: 'auth.otp_code' },
      orderBy: { createdAt: 'desc' },
    });
    const code = (n?.payload as { code?: string } | null)?.code ?? '';
    const reg = await agent().post('/api/v1/auth/register/verify').send({ email, code });
    return reg.body.accessToken as string;
  };

  const addr = { region: 'Toshkent', city: 'Toshkent', street: 'Amir Temur 1' };

  it('manzil qo‘shish → birinchisi default; ro‘yxat', async () => {
    const token = await registerCustomer();
    const create = await agent()
      .post('/api/v1/addresses')
      .set('Authorization', `Bearer ${token}`)
      .send(addr);
    expect(create.status).toBe(201);
    expect(create.body.isDefault).toBe(true); // birinchi → default

    const list = await agent().get('/api/v1/addresses').set('Authorization', `Bearer ${token}`);
    expect(list.body).toHaveLength(1);
  });

  it('ikkinchi manzil default emas; keyin default qilinadi', async () => {
    const token = await registerCustomer();
    await agent().post('/api/v1/addresses').set('Authorization', `Bearer ${token}`).send(addr);
    const second = await agent()
      .post('/api/v1/addresses')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...addr, street: 'Chilonzor 5' });
    expect(second.body.isDefault).toBe(false);

    await agent()
      .post(`/api/v1/addresses/${second.body.id as string}/default`)
      .set('Authorization', `Bearer ${token}`);

    const list = await agent().get('/api/v1/addresses').set('Authorization', `Bearer ${token}`);
    const def = list.body.find((a: { isDefault: boolean }) => a.isDefault);
    expect(def.id).toBe(second.body.id);
    expect(list.body.filter((a: { isDefault: boolean }) => a.isDefault)).toHaveLength(1);
  });

  it('⚠️ EGALIK: begona mijoz manzili → 404', async () => {
    const tokenA = await registerCustomer();
    const created = await agent()
      .post('/api/v1/addresses')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(addr);

    const tokenB = await registerCustomer();
    const asB = await agent()
      .patch(`/api/v1/addresses/${created.body.id as string}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ street: 'Hack 1' });
    expect(asB.status).toBe(404); // begona → 404 (sizdirmaymiz)
  });

  it('profil: GET /customers/me → email bor; PATCH ism/telefon yangilanadi', async () => {
    const token = await registerCustomer();
    const me = await agent().get('/api/v1/customers/me').set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(String(me.body.email)).toContain('@kelvin.uz');
    expect(me.body.phone).toBeNull(); // email+parol ro'yxatida telefon yo'q

    const upd = await agent()
      .patch('/api/v1/customers/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'Anvar', lastName: 'Aliyev', phone: '+998901112299' });
    expect(upd.status).toBe(200);
    expect(upd.body.firstName).toBe('Anvar');
    expect(upd.body.phone).toBe('+998901112299');

    // Noto'g'ri telefon format → 422 VALIDATION_FAILED (docs/04 §3).
    const bad = await agent()
      .patch('/api/v1/customers/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: '901112233' });
    expect(bad.status).toBe(422);
  });

  it('xodim (customerId yo‘q) → 403', async () => {
    const user = await h.prisma.user.create({
      data: { email: `staff-${String(Date.now())}@kelvin.uz`, passwordHash: 'x', status: 'ACTIVE' },
    });
    await h.prisma.userRole.create({ data: { userId: user.id, role: 'WAREHOUSE' } });
    const access = h.app.get(
      (await import('../../src/modules/identity/token/access-token.service')).AccessTokenService,
    );
    const token = await access.sign({ sub: user.id, roles: ['WAREHOUSE'], fid: 'f1' });

    const res = await agent().get('/api/v1/addresses').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});
