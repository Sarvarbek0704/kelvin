import { parseTtlSeconds } from './access-token.service';

describe('parseTtlSeconds', () => {
  it('daqiqa', () => {
    expect(parseTtlSeconds('15m')).toBe(900);
  });
  it('kun', () => {
    expect(parseTtlSeconds('30d')).toBe(2_592_000);
  });
  it('soat', () => {
    expect(parseTtlSeconds('2h')).toBe(7200);
  });
  it('sekund (birliksiz)', () => {
    expect(parseTtlSeconds('900')).toBe(900);
    expect(parseTtlSeconds('45s')).toBe(45);
  });
  it('yaroqsiz format — xato', () => {
    expect(() => parseTtlSeconds('abc')).toThrow();
    expect(() => parseTtlSeconds('15x')).toThrow();
  });
});
