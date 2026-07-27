import {
  anyRoleHasPermission,
  hasPermission,
  PERMISSIONS,
  permissionsFor,
  ROLE_PERMISSIONS,
  ROLES,
  type Permission,
} from '@kelvin/contracts';

/**
 * RBAC — ruxsat registri testlari.
 *
 * docs/01-product-spec.md §4.4: matritsa va ROLE_PERMISSIONS bir manba.
 * Bu test ularning izchilligini va union semantikasini tekshiradi.
 */
describe('RBAC ruxsat registri', () => {
  it('har rol ROLE_PERMISSIONS da mavjud', () => {
    for (const role of ROLES) {
      expect(ROLE_PERMISSIONS[role]).toBeDefined();
    }
  });

  it('barcha berilgan ruxsatlar PERMISSIONS ro‘yxatida (typo yo‘q)', () => {
    const known = new Set<Permission>(PERMISSIONS);
    for (const role of ROLES) {
      for (const permission of ROLE_PERMISSIONS[role]) {
        expect(known.has(permission)).toBe(true);
      }
    }
  });

  it('OWNER — barcha ruxsatlarga ega', () => {
    for (const permission of PERMISSIONS) {
      expect(hasPermission('OWNER', permission)).toBe(true);
    }
  });

  it('ADMIN — OWNER rolini bera olmaydi (user:assign_owner_role yo‘q)', () => {
    expect(hasPermission('ADMIN', 'user:assign_owner_role')).toBe(false);
    // Qolgan hamma narsa ADMIN'da bor.
    for (const permission of PERMISSIONS) {
      if (permission !== 'user:assign_owner_role') {
        expect(hasPermission('ADMIN', permission)).toBe(true);
      }
    }
  });

  it('ACCOUNTANT — moliya faqat o‘qish (ledger:read bor, payment:refund yo‘q)', () => {
    expect(hasPermission('ACCOUNTANT', 'ledger:read')).toBe(true);
    expect(hasPermission('ACCOUNTANT', 'payment:refund')).toBe(false);
    expect(hasPermission('ACCOUNTANT', 'price:write')).toBe(false);
  });

  it('CUSTOMER — faqat o‘ziniki (order:read_own bor, order:read yo‘q)', () => {
    expect(hasPermission('CUSTOMER', 'order:read_own')).toBe(true);
    expect(hasPermission('CUSTOMER', 'order:read')).toBe(false);
    expect(hasPermission('CUSTOMER', 'payment:refund')).toBe(false);
  });

  it('GUEST — faqat ommaviy o‘qish + o‘z savati', () => {
    expect(hasPermission('GUEST', 'product:read')).toBe(true);
    expect(hasPermission('GUEST', 'cart:manage_own')).toBe(true);
    expect(hasPermission('GUEST', 'order:read_own')).toBe(false);
  });

  describe('ko‘p rol union semantikasi', () => {
    it('permissionsFor — rollar birlashmasi', () => {
      const union = permissionsFor(['SALES', 'WAREHOUSE']);
      // SALES'da bor
      expect(union.has('order:create')).toBe(true);
      // WAREHOUSE'da bor
      expect(union.has('stock:movement_write')).toBe(true);
      // Ikkalasida ham yo'q
      expect(union.has('payment:refund')).toBe(false);
    });

    it('anyRoleHasPermission — rollardan biri yetarli', () => {
      expect(anyRoleHasPermission(['CUSTOMER', 'WAREHOUSE'], 'stock:read')).toBe(true);
      expect(anyRoleHasPermission(['CUSTOMER'], 'stock:read')).toBe(false);
    });

    it('bo‘sh rollar — hech qanday ruxsat yo‘q', () => {
      expect(permissionsFor([]).size).toBe(0);
      expect(anyRoleHasPermission([], 'product:read')).toBe(false);
    });
  });
});
