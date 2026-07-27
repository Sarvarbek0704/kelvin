/**
 * RBAC — ruxsatlar yagona manbai.
 *
 * Prinsip: rol — lavozim, ruxsat — amal. Tekshiruv har doim RUXSAT
 * darajasida. Kontrollerlarda tarqoq `if (role === 'ADMIN')` TAQIQLANADI.
 *
 * ⚠️ Bu ro'yxat docs/01-product-spec.md §4.2 matritsasining mashina o'qiy
 *    oladigan shakli. Matritsa o'zgarsa — SHU YER o'zgaradi.
 *
 * ⚠️ Ko'p rol: `User` bir nechta rolga ega bo'lishi mumkin (Prisma `UserRole[]`).
 *    Shuning uchun `hasPermission` (yagona rol — spec) yonida `permissionsFor`
 *    va `anyRoleHasPermission` (rollar birlashmasi) beriladi. `GUEST` — anonim
 *    tashrifchi uchun virtual rol (bazada saqlanmaydi).
 *
 * @see docs/01-product-spec.md §4
 */

/** Barcha ruxsatlar — yagona manba. `resource:action` formati. */
export const PERMISSIONS = [
  'product:read',
  'product:read_draft',
  'product:write',
  'product:publish',
  'product:delete',
  'category:read',
  'category:write',
  'attribute:read',
  'attribute:write',
  'media:write',
  'price:read',
  'price:write',
  'discount:read',
  'discount:write',
  'discount:manual_unlimited',
  'discount:manual_limited',
  'cart:manage_own',
  'cart:manage_for_customer',
  'order:read',
  'order:read_own',
  'order:read_assigned',
  'order:create',
  'order:update',
  'order:cancel',
  'order:transition',
  'payment:read',
  'payment:read_own',
  'payment:capture',
  'payment:refund',
  'payment:settle',
  'installment:read',
  'installment:write',
  'ledger:read',
  'stock:read',
  'stock:movement_write',
  'stock:adjust',
  'reservation:read',
  'warehouse:write',
  'supplier:write',
  'purchase_order:read',
  'purchase_order:write',
  'purchase_order:receive',
  'shipment:read',
  'shipment:read_assigned',
  'shipment:write',
  'shipment:update_assigned',
  'delivery:config_write',
  'installation:read_assigned',
  'installation:update_assigned',
  'installation:write',
  'customer:read',
  'customer:read_own',
  'customer:write',
  'lead:write_own',
  'lead:read_all',
  'segment:write',
  'pos:shift_manage_own',
  'pos:transaction_create',
  'pos:read_all',
  'review:create_own',
  'review:moderate',
  'content:write',
  'report:read_all',
  'report:read_own',
  'report:read_warehouse',
  'user:read',
  'user:write',
  'user:assign_role',
  'user:assign_owner_role',
  'audit_log:read',
  'feature_flag:read',
  'feature_flag:write',
  'settings:read',
  'settings:write',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLES = [
  'OWNER',
  'ADMIN',
  'CONTENT_MANAGER',
  'SALES',
  'WAREHOUSE',
  'COURIER',
  'INSTALLER',
  'ACCOUNTANT',
  'CUSTOMER',
  'GUEST',
] as const;

export type Role = (typeof ROLES)[number];

/**
 * Rol → ruxsatlar. docs/01-product-spec.md §4.2 matritsasi.
 * Matritsa o'zgarsa — SHU YER o'zgaradi, boshqa hech qayer emas.
 */
export const ROLE_PERMISSIONS: Readonly<Record<Role, readonly Permission[]>> = {
  OWNER: PERMISSIONS, // yagona rol: hamma narsa
  ADMIN: PERMISSIONS.filter((p): p is Permission => p !== 'user:assign_owner_role'),
  CONTENT_MANAGER: [
    'product:read',
    'product:read_draft',
    'product:write',
    'product:publish',
    'product:delete',
    'category:read',
    'category:write',
    'attribute:read',
    'attribute:write',
    'media:write',
    'price:read',
    'review:moderate',
    'content:write',
  ],
  SALES: [
    'product:read',
    'category:read',
    'attribute:read',
    'price:read',
    'discount:read',
    'discount:manual_limited',
    'cart:manage_for_customer',
    'order:read',
    'order:create',
    'order:update',
    'order:cancel',
    'order:transition',
    'payment:read',
    'payment:capture', // naqd/POS — kassir pulni olganda tasdiqlaydi (§1.4, §4.4)
    'installment:read',
    'installment:write',
    'stock:read',
    'reservation:read',
    'shipment:read',
    'installation:write',
    'customer:read',
    'customer:write',
    'lead:write_own',
    'pos:shift_manage_own',
    'pos:transaction_create',
    'report:read_own',
  ],
  WAREHOUSE: [
    'product:read',
    'category:read',
    'attribute:read',
    'stock:read',
    'stock:movement_write',
    'stock:adjust',
    'reservation:read',
    'purchase_order:read',
    'purchase_order:receive',
    'shipment:read',
    'shipment:write',
    'order:read',
    'order:transition',
    'payment:capture', // pickup/naqd — ombor kassasi tasdiqlashi mumkin (§4.4)
    'report:read_warehouse',
  ],
  COURIER: [
    'order:read_assigned',
    'order:transition',
    'shipment:read_assigned',
    'shipment:update_assigned',
    'customer:read_own', // faqat tayinlangan yetkazish doirasida — §4.5
    'payment:read_own', // COD
    'payment:capture', // COD — kuryer yetkazishda naqd pulni olganda tasdiqlaydi (§1.4)
  ],
  INSTALLER: [
    'order:read_assigned',
    'product:read',
    'installation:read_assigned',
    'installation:update_assigned',
  ],
  ACCOUNTANT: [
    'product:read',
    'price:read',
    'discount:read',
    'order:read',
    'payment:read',
    'payment:settle', // provayder settlement — receivable→bank+fee (§6.5)
    'installment:read',
    'ledger:read',
    'stock:read',
    'purchase_order:read',
    'customer:read',
    'pos:read_all',
    'report:read_all',
    'audit_log:read',
  ],
  CUSTOMER: [
    'product:read',
    'category:read',
    'attribute:read',
    'price:read',
    'discount:read',
    'cart:manage_own',
    'order:read_own',
    'order:cancel', // shartli — §4.5 ownership guard
    'payment:read_own',
    'installment:read',
    'customer:read_own',
    'review:create_own',
  ],
  GUEST: [
    'product:read',
    'category:read',
    'attribute:read',
    'price:read',
    'discount:read',
    'cart:manage_own',
  ],
} as const;

/** Yagona rol bu ruxsatga egami (spec §4.4). */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Rollar birlashmasidan effektiv ruxsatlar to'plami.
 *
 * `User` bir nechta rolga ega bo'lishi mumkin (Prisma `UserRole[]`).
 * Effektiv huquq — barcha rollar ruxsatlarining BIRLASHMASI.
 */
export function permissionsFor(roles: readonly Role[]): ReadonlySet<Permission> {
  const set = new Set<Permission>();
  for (const role of roles) {
    for (const permission of ROLE_PERMISSIONS[role]) {
      set.add(permission);
    }
  }
  return set;
}

/** Rollardan biri bu ruxsatga egami. */
export function anyRoleHasPermission(roles: readonly Role[], permission: Permission): boolean {
  return roles.some((role) => hasPermission(role, permission));
}
