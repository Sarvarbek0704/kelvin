import { type Server } from 'node:http';
import request from 'supertest';
import * as argon2 from 'argon2';

import { createHarness, type TestHarness } from './helpers/harness';

/**
 * Auth oqimi — REAL PostgreSQL + Redis.
 *
 * Tekshiriladi: login (email+parol), register→email kodi→verify (hisob
 * faollashadi), brute-force/cooldown limitlari, /me, refresh rotatsiya,
 * reuse detection, concurrency invarianti, logout, audit.
 *
 * ⚠️ OTP kodi javobda QAYTMAYDI — testlar uni Notification yozuvidan oladi
 *    (LogAdapter payload'ni saqlaydi).
 *
 * @see docs/11-security.md §2.4, §2.7
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

  /** Email'ga yuborilgan oxirgi kod — Notification payload'idan. */
  async function latestCode(email: string): Promise<string> {
    const n = await h.prisma.notification.findFirst({
      where: { recipient: email, templateKey: 'auth.otp_code' },
      orderBy: { createdAt: 'desc' },
    });
    const code = (n?.payload as { code?: string } | null)?.code;
    if (code === undefined) {
      throw new Error(`${email} uchun OTP notification topilmadi`);
    }
    return code;
  }

  /** To'liq ro'yxat: register → kod → verify. Verify javobini qaytaradi. */
  async function registerAndVerify(email: string, password = 'customer-pass-123') {
    const reg = await agent().post('/api/v1/auth/register').send({ email, password });
    expect(reg.status).toBe(200);
    expect(reg.body.devCode).toBeUndefined(); // kod javobda YO'Q
    const code = await latestCode(email);
    const ver = await agent().post('/api/v1/auth/register/verify').send({ email, code });
    expect(ver.status).toBe(200);
    return ver;
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
      .send({ email: EMAIL, password: 'wrong-password' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });

  it('mavjud bo‘lmagan foydalanuvchi → xuddi shu 401', async () => {
    const res = await agent()
      .post('/api/v1/auth/login')
      .send({ email: 'yoq@kelvin.uz', password: 'whatever12' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });

  it('login → access + refresh cookie; /me ishlaydi', async () => {
    const login = await agent()
      .post('/api/v1/auth/login')
      .send({ email: EMAIL, password: PASSWORD });
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

  it('register → PENDING + kod email’ga; verify → ACTIVE + token + CUSTOMER', async () => {
    const email = `yangi-${String(Date.now())}@kelvin.uz`;
    const reg = await agent()
      .post('/api/v1/auth/register')
      .send({ email, password: 'customer-pass-123', firstName: 'Ali' });
    expect(reg.status).toBe(200);
    expect(reg.body.devCode).toBeUndefined();

    // Kod tasdiqlanmaguncha hisob PENDING — login ISHLAMAYDI.
    const early = await agent()
      .post('/api/v1/auth/login')
      .send({ email, password: 'customer-pass-123' });
    expect(early.status).toBe(401);

    const code = await latestCode(email);
    const ver = await agent().post('/api/v1/auth/register/verify').send({ email, code });
    expect(ver.status).toBe(200);
    expect(typeof ver.body.accessToken).toBe('string');
    expect(ver.body.user.roles).toContain('CUSTOMER');

    const user = await h.prisma.user.findFirst({ where: { email }, include: { customer: true } });
    expect(user?.status).toBe('ACTIVE');
    expect(user?.emailVerified).toBe(true);
    expect(user?.customer?.firstName).toBe('Ali');

    // Endi parol bilan kirish ham ishlaydi.
    const login = await agent()
      .post('/api/v1/auth/login')
      .send({ email, password: 'customer-pass-123' });
    expect(login.status).toBe(200);
  });

  it('tasdiqlangan email bilan qayta register → 409', async () => {
    const email = `band-${String(Date.now())}@kelvin.uz`;
    await registerAndVerify(email);
    const dup = await agent()
      .post('/api/v1/auth/register')
      .send({ email, password: 'boshqa-parol-99' });
    expect(dup.status).toBe(409);
  });

  it('noto‘g‘ri kod → 401 OTP_INVALID; kod BIR MARTALIK', async () => {
    const email = `kod-${String(Date.now())}@kelvin.uz`;
    await agent().post('/api/v1/auth/register').send({ email, password: 'kod-pass-1234' });
    const code = await latestCode(email);
    const bad = code === '000000' ? '000001' : '000000';

    const wrong = await agent().post('/api/v1/auth/register/verify').send({ email, code: bad });
    expect(wrong.status).toBe(401);
    expect(wrong.body.code).toBe('OTP_INVALID');

    const ok = await agent().post('/api/v1/auth/register/verify').send({ email, code });
    expect(ok.status).toBe(200);

    // Ishlatilgan kod qayta ishlamaydi.
    const reuse = await agent().post('/api/v1/auth/register/verify').send({ email, code });
    expect(reuse.status).toBe(401);
  });

  it('cooldown ichida resend → 429', async () => {
    const email = `cooldown-${String(Date.now())}@kelvin.uz`;
    await agent().post('/api/v1/auth/register').send({ email, password: 'cooldown-pass1' });
    const again = await agent().post('/api/v1/auth/otp/resend').send({ email });
    expect(again.status).toBe(429);
    expect(again.body.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('5 marta noto‘g‘ri urinish → challenge o‘chadi, to‘g‘ri kod ham ishlamaydi', async () => {
    const email = `brute-${String(Date.now())}@kelvin.uz`;
    await agent().post('/api/v1/auth/register').send({ email, password: 'brute-pass-123' });
    const code = await latestCode(email);
    const bad = code === '000000' ? '000001' : '000000';
    for (let i = 0; i < 5; i += 1) {
      const res = await agent().post('/api/v1/auth/register/verify').send({ email, code: bad });
      expect(res.status).toBe(401);
    }
    const after = await agent().post('/api/v1/auth/register/verify').send({ email, code });
    expect(after.status).toBe(401);
  });

  it('parol tiklash: forgot → kod → yangi parol; eski parol ishlamaydi', async () => {
    const email = `reset-${String(Date.now())}@kelvin.uz`;
    await registerAndVerify(email, 'eski-parol-123');

    const fg = await agent().post('/api/v1/auth/password/forgot').send({ email });
    expect(fg.status).toBe(200);
    expect(fg.body.devCode).toBeUndefined();

    const code = await latestCode(email);
    const rs = await agent()
      .post('/api/v1/auth/password/reset')
      .send({ email, code, password: 'yangi-parol-456' });
    expect(rs.status).toBe(200);
    expect(typeof rs.body.accessToken).toBe('string'); // darhol kirgizadi

    const oldLogin = await agent()
      .post('/api/v1/auth/login')
      .send({ email, password: 'eski-parol-123' });
    expect(oldLogin.status).toBe(401);

    const newLogin = await agent()
      .post('/api/v1/auth/login')
      .send({ email, password: 'yangi-parol-456' });
    expect(newLogin.status).toBe(200);
  });

  it('login AuditLog ga tushadi', async () => {
    await agent().post('/api/v1/auth/login').send({ email: EMAIL, password: PASSWORD });
    const logs = await h.prisma.auditLog.findMany({ where: { action: 'AUTH_LOGIN' } });
    expect(logs.length).toBeGreaterThan(0);
  });

  it('refresh — rotatsiya: eski token qayta ishlatilsa REUSE, oila bekor', async () => {
    const login = await agent()
      .post('/api/v1/auth/login')
      .send({ email: EMAIL, password: PASSWORD });
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
      .send({ email: EMAIL, password: PASSWORD });
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
      .send({ email: EMAIL, password: PASSWORD });
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
