import {
  computeIpSatisfies,
  formatIp,
  InvalidIpCodeError,
  isValidIpCode,
  parseIp,
  satisfies,
} from './ip-rating';

describe('IP rating — qisman tartib', () => {
  describe('parseIp / formatIp', () => {
    it('to‘g‘ri kodni parse qiladi', () => {
      expect(parseIp('IP65')).toEqual({ solid: 6, water: 5 });
      expect(parseIp('IP20')).toEqual({ solid: 2, water: 0 });
    });
    it('formatlaydi', () => {
      expect(formatIp({ solid: 6, water: 7 })).toBe('IP67');
    });
    it('yaroqsiz kod — xato', () => {
      expect(() => parseIp('IP99')).toThrow(InvalidIpCodeError);
      expect(() => parseIp('ABC')).toThrow(InvalidIpCodeError);
      expect(isValidIpCode('IP44')).toBe(true);
      expect(isValidIpCode('IP9')).toBe(false);
    });
  });

  describe('satisfies — asosiy holatlar', () => {
    it('IP65 IP44 talabini qanoatlantiradi (himoyaliroq)', () => {
      expect(satisfies(parseIp('IP65'), parseIp('IP44'))).toBe(true);
    });
    it('IP20 IP44 ni qanoatlantirmaydi', () => {
      expect(satisfies(parseIp('IP20'), parseIp('IP44'))).toBe(false);
    });
    it('teng — qanoatlantiradi', () => {
      expect(satisfies(parseIp('IP44'), parseIp('IP44'))).toBe(true);
    });
  });

  describe('⚠️ TUZOQ: suv shkalasi to‘liq tartiblangan EMAS', () => {
    it('IP67 IP65 ni QANOATLANTIRMAYDI (botirish ≠ oqim sinovi)', () => {
      // 6≥6 (chang ✅), lekin 7 suv 5 ni QAMRAMAYDI.
      expect(satisfies(parseIp('IP67'), parseIp('IP65'))).toBe(false);
    });
    it('IP68 IP66 ni QANOATLANTIRMAYDI', () => {
      expect(satisfies(parseIp('IP68'), parseIp('IP66'))).toBe(false);
    });
    it('IP67 IP44 ni QANOATLANTIRADI (7 → 4,3,2,1,0)', () => {
      expect(satisfies(parseIp('IP67'), parseIp('IP44'))).toBe(true);
    });
    it('IP68 IP67 ni qanoatlantiradi (8 → 7)', () => {
      expect(satisfies(parseIp('IP68'), parseIp('IP67'))).toBe(true);
    });
  });

  describe('computeIpSatisfies — materializatsiya', () => {
    it('IP65 IP44/IP54/IP65 ni o‘z ichiga oladi, IP20 ni ham', () => {
      const list = computeIpSatisfies('IP65');
      expect(list).toContain('IP44');
      expect(list).toContain('IP54');
      expect(list).toContain('IP65');
      expect(list).toContain('IP20');
    });
    it('IP67 IP65 ni O‘Z ICHIGA OLMAYDI (tuzoq)', () => {
      const list = computeIpSatisfies('IP67');
      expect(list).not.toContain('IP65');
      expect(list).not.toContain('IP66');
      expect(list).toContain('IP44');
      expect(list).toContain('IP67');
    });
    it('IP20 faqat past talablarni qanoatlantiradi', () => {
      const list = computeIpSatisfies('IP20');
      expect(list).toContain('IP20');
      expect(list).toContain('IP10');
      expect(list).not.toContain('IP44');
      expect(list).not.toContain('IP21');
    });
  });
});
