import { ReplayAttackError } from '../errors/domain.error';
import { REPLAY_WINDOW_SECONDS, assertFresh, timingSafeEqualHex } from './webhook-security';

describe('webhook-security — replay oynasi (§11.4)', () => {
  const now = new Date('2026-07-22T12:00:00.000Z');

  it('yangi hodisa (oyna ichida) — o‘tadi', () => {
    expect(() => {
      assertFresh(new Date(now.getTime() - 60_000), now);
    }).not.toThrow();
    expect(() => {
      assertFresh(now, now);
    }).not.toThrow();
  });

  it('⚠️ juda eski hodisa — ReplayAttackError', () => {
    const old = new Date(now.getTime() - (REPLAY_WINDOW_SECONDS + 1) * 1000);
    expect(() => {
      assertFresh(old, now);
    }).toThrow(ReplayAttackError);
  });

  it('⚠️ kelajakdan hodisa (soat buzilgan / soxta) — ReplayAttackError', () => {
    const future = new Date(now.getTime() + (REPLAY_WINDOW_SECONDS + 1) * 1000);
    expect(() => {
      assertFresh(future, now);
    }).toThrow(ReplayAttackError);
  });

  it('oyna chegarasi (aynan window) — o‘tadi (inklyuziv)', () => {
    const edge = new Date(now.getTime() - REPLAY_WINDOW_SECONDS * 1000);
    expect(() => {
      assertFresh(edge, now);
    }).not.toThrow();
  });
});

describe('webhook-security — timing-safe imzo taqqoslash (§11.3)', () => {
  it('bir xil imzo → true', () => {
    expect(timingSafeEqualHex('a3f9c1', 'a3f9c1')).toBe(true);
  });

  it('boshqa imzo (bir uzunlik) → false', () => {
    expect(timingSafeEqualHex('a3f9c1', 'a3f9c2')).toBe(false);
  });

  it('⚠️ uzunlik farq qilsa → false (crash EMAS)', () => {
    expect(timingSafeEqualHex('a3f9', 'a3f9c1')).toBe(false);
    expect(timingSafeEqualHex('', 'x')).toBe(false);
  });
});
