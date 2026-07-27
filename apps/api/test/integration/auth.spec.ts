import { type Server } from 'node:http';
import request from 'supertest';
import * as argon2 from 'argon2';

import { createHarness, type TestHarness } from './helpers/harness';

/**
 * Auth oqimi — REAL PostgreSQL + Redis.
 *
 * Tekshiriladi: login, /me, refresh rotatsiya, reuse detection, concurrency
 * invarianti (parallel refresh → ≤1 muvaffaqiyat), logout, audit.
 *
 * @see docs/11-security.md §2.4
 */
describe('Auth (integration)', () => {
  let h: TestHarness;
  const PASSWORD = 'kelvin-dev-password';
  const EMAIL = 'owner@kelvin.uz';

  beforeAll(async () => {
    h = await createHarness();
    const passwordHash = await argon2.hash(PASSWORD, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });
    const user = await h.prisma.user.create({
      data: { email: EMAIL, passwordHash, status: 'ACTIVE', emailVerified: true },
    });
    await h.prisma.userRole.create({ data: { userId: user.id, role: 'OWNER' } });
  });

  afterAll(async () => {
    await h.teardown();
  });

  function agent() {
    return request(h.app.getHttpServer() as Server);
  }

  function cookieFrom(res: request.Response): string {
    const setCookie = res.headers['set-cookie'] as unknown as string[] | undefined;
    const rt = (setCookie ?? []).find((c) => c.startsWith('kelvin_rt='));
    if (!rt) {
      throw new Error(
        `refresh cookie yo‘q (status=${String(res.status)}, body=${JSON.stringify(res.body)})`,
      );
    }
    return rt.split(';')[0]!;
  }

  it('noto‘g‘ri parol → 401, enumeration yo‘q', async () => {
    const res = await agent()
      .post('/api/v1/auth/login')
      .send({ identifier: EMAIL, password: 'wrong-password' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });

  it('mavjud bo‘lmagan foydalanuvchi → xuddi shu 401', async () => {
    const res = await agent()
      .post('/api/v1/auth/login')
      .send({ identifier: 'yoq@kelvin.uz', password: 'whatever12' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });

  it('login → access + refresh cookie; /me ishlaydi', async () => {
    const login = await agent()
      .post('/api/v1/auth/login')
      .send({ identifier: EMAIL, password: PASSWORD });
    expect(login.status).toBe(200);
    expect(typeof login.body.accessToken).toBe('string');
    expect(login.body.user.roles).toContain('OWNER');
    expect(login.body.user.permissions).toContain('user:assign_owner_role');

    const me = await agent()
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${login.body.accessToken as string}`);
    expect(me.status).toBe(200);
    expect(me.body.roles).toContain('OWNER');
  });

  it('mijoz ro‘yxatdan o‘tishi → token + CUSTOMER roli + Customer profil', async () => {
    const phone = `+9989${String(Date.now()).slice(-8)}`;
    const reg = await agent()
      .post('/api/v1/auth/register')
      .send({ phone, password: 'customer-pass-123', firstName: 'Ali' });
    expect(reg.status).toBe(201);
    expect(typeof reg.body.accessToken).toBe('string');
    expect(reg.body.user.roles).toContain('CUSTOMER');

    // /me — CUSTOMER roli, cid (customerId) token'da.
    const me = await agent()
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${reg.body.accessToken as string}`);
    expect(me.body.roles).toContain('CUSTOMER');

    // Customer profil yaratilgan va User'ga bog'langan.
    const user = await h.prisma.user.findFirst({ where: { phone }, include: { customer: true } });
    expect(user?.customer?.phone).toBe(phone);
    expect(user?.status).toBe('ACTIVE');
  });

  it('takroriy telefon bilan ro‘yxatdan o‘tish → 409', async () => {
    const phone = `+9988${String(Date.now()).slice(-8)}`;
    await agent().post('/api/v1/auth/register').send({ phone, password: 'pass-12345' });
    const dup = await agent().post('/api/v1/auth/register').send({ phone, password: 'pass-67890' });
    expect(dup.status).toBe(409);
  });

  it('ro‘yxatdan o‘tgan mijoz telefon bilan login qila oladi', async () => {
    const phone = `+9987${String(Date.now()).slice(-8)}`;
    await agent().post('/api/v1/auth/register').send({ phone, password: 'login-pass-123' });
    const login = await agent()
      .post('/api/v1/auth/login')
      .send({ identifier: phone, password: 'login-pass-123' });
    expect(login.status).toBe(200);
    expect(login.body.user.roles).toContain('CUSTOMER');
  });

  it('login AuditLog ga tushadi', async () => {
    await agent().post('/api/v1/auth/login').send({ identifier: EMAIL, password: PASSWORD });
    const logs = await h.prisma.auditLog.findMany({ where: { action: 'AUTH_LOGIN' } });
    expect(logs.length).toBeGreaterThan(0);
  });

  it('refresh — rotatsiya: eski token qayta ishlatilsa REUSE, oila bekor', async () => {
    const login = await agent()
      .post('/api/v1/auth/login')
      .send({ identifier: EMAIL, password: PASSWORD });
    const rt1 = cookieFrom(login);

    const refreshed = await agent().post('/api/v1/auth/refresh').set('Cookie', rt1);
    expect(refreshed.status).toBe(200);
    const rt2 = cookieFrom(refreshed);
    expect(rt2).not.toBe(rt1);

    // Eski token (rt1) qayta → REUSE.
    const reuse = await agent().post('/api/v1/auth/refresh').set('Cookie', rt1);
    expect(reuse.status).toBe(401);
    expect(reuse.body.code).toBe('REFRESH_TOKEN_REUSED');

    // Oila bekor: endi rt2 ham ishlamaydi.
    const afterReuse = await agent().post('/api/v1/auth/refresh').set('Cookie', rt2);
    expect(afterReuse.status).toBe(401);

    // Audit yozuvi bor.
    const reuseLogs = await h.prisma.auditLog.findMany({
      where: { action: 'AUTH_REFRESH_REUSE_DETECTED' },
    });
    expect(reuseLogs.length).toBeGreaterThan(0);
  });

  it('concurrency invarianti: N parallel refresh → ≤1 muvaffaqiyat', async () => {
    const login = await agent()
      .post('/api/v1/auth/login')
      .send({ identifier: EMAIL, password: PASSWORD });
    const rt = cookieFrom(login);

    const N = 10;
    const results = await Promise.all(
      Array.from({ length: N }, () => agent().post('/api/v1/auth/refresh').set('Cookie', rt)),
    );
    const successes = results.filter((r) => r.status === 200);
    // ⚠️ ENG MUHIM invariant: hech qachon 2 ta muvaffaqiyat bo‘lmaydi.
    expect(successes.length).toBeLessThanOrEqual(1);
  });

  it('logout — refresh bekor, cookie tozalanadi', async () => {
    const login = await agent()
      .post('/api/v1/auth/login')
      .send({ identifier: EMAIL, password: PASSWORD });
    const rt = cookieFrom(login);
    const access = login.body.accessToken as string;

    const logout = await agent()
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${access}`)
      .set('Cookie', rt);
    expect(logout.status).toBe(204);

    // Bekor qilingan token bilan refresh → 401.
    const after = await agent().post('/api/v1/auth/refresh').set('Cookie', rt);
    expect(after.status).toBe(401);
  });

  it('ruxsatsiz endpoint (belgisiz) — deny-by-default; /me tokensiz → 401', async () => {
    const res = await agent().get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});
