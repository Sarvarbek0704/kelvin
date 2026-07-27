import { randomUUID } from 'node:crypto';

import { createHarness, type TestHarness } from './helpers/harness';
import { LeadService } from '../../src/modules/crm/lead.service';
import { BusinessRuleError, NotFoundError } from '../../src/core/errors/domain.error';

/**
 * crm — lid (docs/10): ommaviy callback → voronka (NEW→…→WON/LOST). LOST sabab
 * majburiy (voronka tahlili).
 */
describe('CRM lead (integration)', () => {
  let h: TestHarness;
  let leads: LeadService;

  beforeAll(async () => {
    h = await createHarness();
    leads = h.app.get(LeadService);
  }, 180_000);

  afterAll(async () => {
    await h.teardown();
  });

  const phone = (): string => `+998${String(Math.floor(100000000 + Math.random() * 899999999))}`;

  it('create — ommaviy callback → NEW, WEBSITE_FORM standart', async () => {
    const lead = await leads.create({ name: 'Ali', phone: phone() });
    expect(lead.status).toBe('NEW');
    expect(lead.source).toBe('WEBSITE_FORM');
  });

  it('⚠️ noma‘lum manba → rad etiladi', async () => {
    await expect(leads.create({ phone: phone(), source: 'HACKER' })).rejects.toBeInstanceOf(BusinessRuleError);
  });

  it('list — cursor + status filtri', async () => {
    const a = await leads.create({ phone: phone() });
    const b = await leads.create({ phone: phone() });
    const page1 = await leads.list({ limit: 1 });
    expect(page1.items).toHaveLength(1);
    expect(page1.items[0]?.id).toBe(b.id); // uuid7 → eng yangi
    expect(page1.nextCursor).not.toBeNull();

    const newOnes = await leads.list({ status: 'NEW', limit: 100 });
    expect(newOnes.items.map((l) => l.id)).toEqual(expect.arrayContaining([a.id, b.id]));
    const won = await leads.list({ status: 'WON', limit: 100 });
    expect(won.items.map((l) => l.id)).not.toContain(a.id);
  });

  it('update — voronka o‘tishi (NEW → CONTACTED → WON)', async () => {
    const lead = await leads.create({ phone: phone() });
    await leads.update(lead.id, { status: 'CONTACTED', note: 'qo‘ng‘iroq qilindi' });
    const won = await leads.update(lead.id, { status: 'WON', estimatedAmount: 500_000_000n });
    expect(won.status).toBe('WON');
    expect(won.estimatedAmount).toBe(500_000_000n);
  });

  it('⚠️ LOST — sabab MAJBURIY (voronka tahlili)', async () => {
    const lead = await leads.create({ phone: phone() });
    await expect(leads.update(lead.id, { status: 'LOST' })).rejects.toBeInstanceOf(BusinessRuleError);
    const lost = await leads.update(lead.id, { status: 'LOST', lostReason: 'qimmat' });
    expect(lost.status).toBe('LOST');
  });

  it('update — mavjud bo‘lmagan lid → NotFoundError', async () => {
    await expect(leads.update(randomUUID(), { status: 'CONTACTED' })).rejects.toBeInstanceOf(NotFoundError);
  });

  it('funnelStats — holat bo‘yicha son', async () => {
    await leads.create({ phone: phone() });
    const stats = await leads.funnelStats();
    expect(stats.NEW).toBeGreaterThanOrEqual(1);
  });
});
