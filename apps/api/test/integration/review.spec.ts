import { randomUUID } from 'node:crypto';

import { createHarness, type TestHarness } from './helpers/harness';
import { ReviewService } from '../../src/modules/review/review.service';
import { BusinessRuleError, ConflictError } from '../../src/core/errors/domain.error';

/**
 * review — mahsulot sharhlari (docs/10): mijoz → PENDING → moderatsiya → ommaviy
 * faqat APPROVED. Bitta mijoz — bitta mahsulotga bitta sharh.
 */
describe('Review (integration)', () => {
  let h: TestHarness;
  let reviews: ReviewService;
  let productId: string;

  beforeAll(async () => {
    h = await createHarness();
    reviews = h.app.get(ReviewService);
  }, 180_000);

  afterAll(async () => {
    await h.teardown();
  });

  beforeEach(async () => {
    const c = await h.prisma.category.create({ data: { slug: `c-${randomUUID()}`, name: { ru: 'K' }, path: '/c/' } });
    const p = await h.prisma.product.create({ data: { categoryId: c.id, slug: `p-${randomUUID()}`, name: { ru: 'T' }, status: 'ACTIVE' } });
    productId = p.id;
  });

  const mkCustomer = (): Promise<{ id: string }> =>
    h.prisma.customer.create({ data: { phone: `+p${randomUUID().slice(0, 8)}` } });

  /** Mijoz uchun shu mahsulotni o'z ichiga olgan PAID buyurtma (tasdiqlangan xarid). */
  const mkPaidOrder = async (customerId: string): Promise<void> => {
    const v = await h.prisma.productVariant.create({ data: { productId, sku: `SKU-${randomUUID()}`, axisValues: {} } });
    await h.prisma.order.create({
      data: {
        number: `KLV-T-${randomUUID().slice(0, 8)}`,
        customerId,
        status: 'PAID',
        channel: 'ONLINE',
        subtotalAmount: 100_000_000n,
        discountAmount: 0n,
        deliveryAmount: 0n,
        totalAmount: 100_000_000n,
        currency: 'UZS',
        items: {
          create: {
            variantId: v.id,
            sku: v.sku,
            productName: {},
            variantAxis: {},
            attributesSnapshot: {},
            quantity: 1,
            unitAmount: 100_000_000n,
            totalAmount: 100_000_000n,
            currency: 'UZS',
          },
        },
      },
    });
  };

  it('create → PENDING_MODERATION, ommaviy ro‘yxatda yo‘q', async () => {
    const cust = await mkCustomer();
    const review = await reviews.createReview({ productId, customerId: cust.id, rating: 5, body: 'Zo‘r qandil' });
    expect(review.status).toBe('PENDING_MODERATION');
    expect((await reviews.listApproved(productId))).toHaveLength(0);
  });

  it('⚠️ tasdiqlangan xarid — sotib olgan mijoz isVerifiedPurchase=true', async () => {
    const buyer = await mkCustomer();
    await mkPaidOrder(buyer.id);
    const review = await reviews.createReview({ productId, customerId: buyer.id, rating: 5, body: 'oldim, zo‘r' });
    expect(review.isVerifiedPurchase).toBe(true);

    // Sotib olmagan mijoz — false.
    const nonBuyer = await mkCustomer();
    const r2 = await reviews.createReview({ productId, customerId: nonBuyer.id, rating: 4, body: 'ko‘rdim' });
    expect(r2.isVerifiedPurchase).toBe(false);
  });

  it('⚠️ reyting 1-5 dan tashqarida → rad', async () => {
    const cust = await mkCustomer();
    await expect(reviews.createReview({ productId, customerId: cust.id, rating: 6, body: 'x' })).rejects.toBeInstanceOf(BusinessRuleError);
  });

  it('⚠️ bitta mijoz — bitta sharh (takror → Conflict)', async () => {
    const cust = await mkCustomer();
    await reviews.createReview({ productId, customerId: cust.id, rating: 4, body: 'birinchi' });
    await expect(reviews.createReview({ productId, customerId: cust.id, rating: 3, body: 'ikkinchi' })).rejects.toBeInstanceOf(ConflictError);
  });

  it('⚠️ approve → ommaviy ko‘rinadi; reject → ko‘rinmaydi', async () => {
    const c1 = await mkCustomer();
    const c2 = await mkCustomer();
    const r1 = await reviews.createReview({ productId, customerId: c1.id, rating: 5, body: 'a' });
    const r2 = await reviews.createReview({ productId, customerId: c2.id, rating: 2, body: 'b' });

    await reviews.approve(r1.id);
    await reviews.reject(r2.id);

    const approved = await reviews.listApproved(productId);
    expect(approved.map((r) => r.id)).toEqual([r1.id]);
  });

  it('summary — o‘rtacha/son/taqsimot (faqat APPROVED)', async () => {
    const c1 = await mkCustomer();
    const c2 = await mkCustomer();
    const r1 = await reviews.createReview({ productId, customerId: c1.id, rating: 5, body: 'a' });
    const r2 = await reviews.createReview({ productId, customerId: c2.id, rating: 3, body: 'b' });
    await reviews.approve(r1.id);
    await reviews.approve(r2.id);

    const s = await reviews.summary(productId);
    expect(s.count).toBe(2);
    expect(s.average).toBe(4); // (5+3)/2
    expect(s.distribution[5]).toBe(1);
    expect(s.distribution[3]).toBe(1);
  });

  it('listForModeration — status filtri', async () => {
    const cust = await mkCustomer();
    await reviews.createReview({ productId, customerId: cust.id, rating: 5, body: 'a' });
    const pending = await reviews.listForModeration({ status: 'PENDING_MODERATION', limit: 50 });
    expect(pending.items.some((r) => r.productId === productId)).toBe(true);
  });

  // --- Savol-javob (Q&A) ----------------------------------------------------
  it('⚠️ Q&A: savol → PENDING → approve → javob → ommaviy ko‘rinadi', async () => {
    const cust = await mkCustomer();
    const q = await reviews.createQuestion({ productId, customerId: cust.id, body: 'Kafolat bormi?' });
    expect(q.status).toBe('PENDING_MODERATION');
    // Moderatsiyagacha ommaviy emas.
    expect(await reviews.listApprovedQuestions(productId)).toHaveLength(0);

    await reviews.setQuestionStatus(q.id, 'APPROVED');
    await reviews.answerQuestion(q.id, randomUUID(), 'Ha, 2 yil', true);

    const pub = await reviews.listApprovedQuestions(productId);
    expect(pub).toHaveLength(1);
    expect(pub[0]?.answers).toHaveLength(1);
    expect(pub[0]?.answers[0]?.isOfficial).toBe(true);
  });
});
