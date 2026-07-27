import { createHarness, type TestHarness } from './helpers/harness';
import { DeliveryService } from '../../src/modules/delivery/delivery.service';
import { NotFoundError, SlotUnavailableError } from '../../src/core/errors/domain.error';

/**
 * delivery — zona narxi + ⚠️ ATOMIK slot bron (docs/07 §8, docs/09). Slot bron
 * = inventory oversell bilan bir xil race: cheklangan resurs, atomik shartli UPDATE.
 */
describe('Delivery (integration)', () => {
  let h: TestHarness;
  let delivery: DeliveryService;

  beforeAll(async () => {
    h = await createHarness();
    delivery = h.app.get(DeliveryService);
  }, 180_000);

  afterAll(async () => {
    await h.teardown();
  });

  const mkZone = (price: bigint, freeThreshold?: bigint): Promise<{ id: string }> =>
    delivery.createZone({
      name: { ru: 'Зона' },
      districts: ['Yunusobod'],
      priceAmount: price,
      ...(freeThreshold !== undefined && { freeThresholdAmount: freeThreshold }),
      etaDaysMin: 1,
      etaDaysMax: 3,
    });

  it('quote: subtotal < freeThreshold → narx; >= → BEPUL', async () => {
    const zone = await mkZone(3_000_000n, 50_000_000n);

    const paid = await delivery.quote(zone.id, 40_000_000n);
    expect(paid.fee).toBe(3_000_000n);
    expect(paid.free).toBe(false);

    const free = await delivery.quote(zone.id, 60_000_000n);
    expect(free.fee).toBe(0n);
    expect(free.free).toBe(true);
    expect(free.etaDaysMin).toBe(1);
  });

  it('mavjud bo‘lmagan zona → NotFoundError', async () => {
    await expect(
      delivery.quote('019f0000-0000-7000-8000-000000000000', 1000n),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('bo‘sh slotlar ro‘yxati (band bo‘lgan chiqmaydi)', async () => {
    const zone = await mkZone(3_000_000n);
    const date = new Date('2026-08-01');
    const slot = await delivery.createSlot({ zoneId: zone.id, date, startTime: '09:00', endTime: '12:00', capacity: 1 });

    let available = await delivery.listAvailableSlots(zone.id, date);
    expect(available.some((s) => s.id === slot.id)).toBe(true);

    await delivery.bookSlot(slot.id); // to'ldi (capacity 1)
    available = await delivery.listAvailableSlots(zone.id, date);
    expect(available.some((s) => s.id === slot.id)).toBe(false);
  });

  it('⚠️ ATOMIK bron: capacity=3, 20 parallel → ANIQ 3 muvaffaqiyat (over-booking yo‘q)', async () => {
    const zone = await mkZone(3_000_000n);
    const slot = await delivery.createSlot({
      zoneId: zone.id,
      date: new Date('2026-08-02'),
      startTime: '13:00',
      endTime: '16:00',
      capacity: 3,
    });

    const results = await Promise.allSettled(
      Array.from({ length: 20 }, () => delivery.bookSlot(slot.id)),
    );
    const ok = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected');

    expect(ok).toHaveLength(3);
    expect(failed).toHaveLength(17);
    for (const f of failed) {
      expect(f.reason).toBeInstanceOf(SlotUnavailableError);
    }

    const fresh = await h.prisma.deliverySlot.findUnique({ where: { id: slot.id } });
    expect(fresh?.booked).toBe(3); // aynan capacity
  });

  it('release → joy bo‘shaydi, qayta bron mumkin', async () => {
    const zone = await mkZone(3_000_000n);
    const slot = await delivery.createSlot({
      zoneId: zone.id,
      date: new Date('2026-08-03'),
      startTime: '09:00',
      endTime: '12:00',
      capacity: 1,
    });
    await delivery.bookSlot(slot.id);
    await expect(delivery.bookSlot(slot.id)).rejects.toBeInstanceOf(SlotUnavailableError); // to'la

    await delivery.releaseSlot(slot.id);
    await delivery.bookSlot(slot.id); // endi bo'sh — o'tadi
    expect((await h.prisma.deliverySlot.findUnique({ where: { id: slot.id } }))?.booked).toBe(1);
  });
});
