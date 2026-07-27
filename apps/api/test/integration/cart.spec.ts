import { type Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import request from 'supertest';

import { createHarness, type TestHarness } from './helpers/harness';
import { CartService } from '../../src/modules/cart/cart.service';
import { NotFoundError } from '../../src/core/errors/domain.error';

/**
 * cart — savat CRUD, mehmon savati (cart_token + @OptionalAuth) va MERGE
 * (union+max, docs/07 §1). Narx pricing orqali qayta hisoblanadi.
 */
describe('Cart (integration)', () => {
  let h: TestHarness;
  let cart: CartService;
  let v1: string;
  let v2: string;

  beforeAll(async () => {
    h = await createHarness();
    cart = h.app.get(CartService);
  }, 180_000);

  afterAll(async () => {
    await h.teardown();
  });

  beforeEach(async () => {
    const c = await h.prisma.category.create({
      data: { slug: `c-${randomUUID()}`, name: { ru: 'Кат' }, path: '/c/' },
    });
    const p = await h.prisma.product.create({
      data: { categoryId: c.id, slug: `p-${randomUUID()}`, name: { ru: 'Тов' }, status: 'ACTIVE' },
    });
    const pl = await h.prisma.priceList.create({
      data: { code: `PL-${randomUUID()}`, name: { ru: 'Список' } },
    });
    const mk = async (amount: bigint): Promise<string> => {
      const v = await h.prisma.productVariant.create({
        data: { productId: p.id, sku: `SKU-${randomUUID()}`, axisValues: {} },
      });
      await h.prisma.price.create({ data: { priceListId: pl.id, variantId: v.id, amount } });
      return v.id;
    };
    v1 = await mk(100_000_000n);
    v2 = await mk(50_000_000n);
  });

  it('mehmon savati: qo‘shish → view narx bilan', async () => {
    const c = await cart.getOrCreateForSession(`s-${randomUUID()}`);
    await cart.addItem(c.id, v1, 2);
    const view = await cart.view((await cart.getOrCreateForSession(c.sessionId ?? '')));
    expect(view.itemCount).toBe(2);
    expect(view.subtotal).toBe('200000000'); // 100M × 2
    expect(view.totalAmount).toBe('200000000');
  });

  it('qo‘shish takrorlansa miqdor oshadi (increment)', async () => {
    const c = await cart.getOrCreateForSession(`s-${randomUUID()}`);
    await cart.addItem(c.id, v1, 1);
    await cart.addItem(c.id, v1, 2);
    expect((await cart.viewById(c.id)).itemCount).toBe(3);
  });

  it('setQuantity(0) → qatorni o‘chiradi', async () => {
    const c = await cart.getOrCreateForSession(`s-${randomUUID()}`);
    await cart.addItem(c.id, v1, 5);
    await cart.setQuantity(c.id, v1, 0);
    expect((await cart.viewById(c.id)).itemCount).toBe(0);
  });

  it('mavjud bo‘lmagan variant → NotFoundError', async () => {
    const c = await cart.getOrCreateForSession(`s-${randomUUID()}`);
    await expect(cart.addItem(c.id, randomUUID(), 1)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('⚠️ MERGE union+max: bir xil variant → KATTA miqdor (yig‘indi emas)', async () => {
    const customer = await h.prisma.customer.create({
      data: { phone: `+99890${String(Date.now() % 10_000_000)}` },
    });
    const sessionId = `s-${randomUUID()}`;

    const guest = await cart.getOrCreateForSession(sessionId);
    await cart.addItem(guest.id, v1, 2); // mehmon: v1=2
    await cart.addItem(guest.id, v2, 3); // mehmon: v2=3

    const user = await cart.getOrCreateForCustomer(customer.id);
    await cart.addItem(user.id, v1, 1); // mijoz: v1=1

    const { cart: merged, summary } = await cart.merge(sessionId, customer.id);

    const q = new Map(merged.items.map((it) => [it.variantId, it.quantity]));
    expect(q.get(v1)).toBe(2); // max(1,2) = 2 (yig'indi 3 EMAS)
    expect(q.get(v2)).toBe(3); // qo'shildi
    expect(summary.added).toBe(1);
    expect(summary.updated).toBe(1);
    expect(summary.totalItems).toBe(2);

    // Mehmon savati o'chirilgan.
    expect(await h.prisma.cart.findFirst({ where: { sessionId } })).toBeNull();
  });

  it('HTTP mehmon oqimi: POST /cart/items (auth’siz) → 201 + cart_token cookie', async () => {
    const a = request.agent(h.app.getHttpServer() as Server); // cookie jar (persist)
    const post = await a.post('/api/v1/cart/items').send({ variantId: v1, quantity: 2 });
    expect(post.status).toBe(201); // @OptionalAuth — GUEST cart:manage_own, 401 EMAS
    const cookies = (post.headers['set-cookie'] as unknown as string[] | undefined) ?? [];
    expect(cookies.some((ck) => ck.startsWith('cart_token='))).toBe(true);
    expect(post.body.itemCount).toBe(2);

    // Cookie saqlanadi → keyingi so'rovda o'sha savat.
    const get = await a.get('/api/v1/cart');
    expect(get.status).toBe(200);
    expect(get.body.itemCount).toBe(2);
    expect(get.body.subtotal).toBe('200000000');
  });
});
