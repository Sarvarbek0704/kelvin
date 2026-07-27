import { UnknownProviderError } from '../../../core/errors/domain.error';
import { CashAdapter } from './adapters/cash.adapter';
import { ClickAdapter } from './adapters/click.adapter';
import { PaymentProviderRegistry } from './provider.registry';
import { fromDbProvider, toDbProvider, type PaymentProvider } from './provider.port';

describe('PaymentProviderRegistry (§2.4)', () => {
  const cash = new CashAdapter();
  const click = new ClickAdapter();

  it('kod bo‘yicha adapter topadi', () => {
    const reg = new PaymentProviderRegistry([cash, click]);
    expect(reg.get('cash')).toBe(cash);
    expect(reg.get('click')).toBe(click);
  });

  it('⚠️ noma‘lum kod → UnknownProviderError', () => {
    const reg = new PaymentProviderRegistry([cash]);
    expect(() => reg.get('payme')).toThrow(UnknownProviderError);
  });

  it('⚠️ FAIL-FAST: takroriy kod → xato (konfiguratsiya xatosi)', () => {
    const dup = new CashAdapter();
    expect(() => new PaymentProviderRegistry([cash, dup])).toThrow(/Duplicate/);
  });

  it('listEnabled ro‘yxat qaytaradi (storefront to‘lov usullari)', () => {
    const reg = new PaymentProviderRegistry([cash, click]);
    expect(reg.listEnabled()).toEqual(['cash', 'click']);
  });
});

describe('provider kod ↔ DB enum xaritasi', () => {
  it('kichik kod → katta enum', () => {
    expect(toDbProvider('click')).toBe('CLICK');
    expect(toDbProvider('bank_transfer')).toBe('BANK_TRANSFER');
  });
  it('DB enum → kod (noma‘lum → null)', () => {
    expect(fromDbProvider('CASH')).toBe('cash');
    expect(fromDbProvider('NOPE')).toBeNull();
  });
});

describe('CashAdapter (§2.6) — tashqi API‘siz, port mustaqilligini isbotlaydi', () => {
  const cash: PaymentProvider = new CashAdapter();

  it('manual tasdiq, muddatsiz', () => {
    expect(cash.capabilities.confirmation).toBe('manual');
    expect(cash.capabilities.invoiceTtlSeconds).toBeNull();
  });

  it('createCharge → cash:<paymentId>, redirect yo‘q', async () => {
    const res = await cash.createCharge({
      paymentId: 'pay-1',
      orderId: 'ord-1',
      amount: 200_000_000n,
      idempotencyKey: 'k1',
      returnUrl: 'https://kelvin.uz/ok',
      customerPhone: null,
      description: 'test',
    });
    expect(res.providerTransactionId).toBe('cash:pay-1');
    expect(res.redirectUrl).toBeNull();
  });

  it('⚠️ webhook yo‘q — parseWebhook rad etadi', async () => {
    await expect(cash.parseWebhook({ headers: {}, rawBody: Buffer.alloc(0) })).rejects.toThrow(/no webhooks/);
  });
});
