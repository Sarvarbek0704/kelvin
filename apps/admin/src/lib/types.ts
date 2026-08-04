import type { LocalizedText } from '@kelvin/contracts';

export interface Category {
  id: string;
  parentId: string | null;
  slug: string;
  name: LocalizedText;
  path: string;
  depth: number;
  isActive: boolean;
  sortOrder: number;
  children?: Category[];
}

export interface AttributeValue {
  id: string;
  code: string;
  label: LocalizedText;
  hexColor: string | null;
  rank: number | null;
  sortOrder: number;
}

export interface Attribute {
  id: string;
  code: string;
  type: 'ENUM' | 'NUMBER' | 'BOOLEAN' | 'TEXT' | 'ORDINAL';
  name: LocalizedText;
  unit: string | null;
  isFilterable: boolean;
  isVariantAxis: boolean;
  values: AttributeValue[];
}

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'OUT_OF_PRODUCTION';

export interface ProductVariant {
  id: string;
  sku: string;
  axisValues: Record<string, string>;
  ipRating: string | null;
  ipSatisfies: string[];
  socketType: string | null;
  colorTemperature: number | null;
  isActive: boolean;
}

export interface Product {
  id: string;
  slug: string;
  categoryId: string;
  name: LocalizedText;
  status: ProductStatus;
  isFragile: boolean;
  variantAxes: unknown;
  variants?: ProductVariant[];
}

export interface CursorPage<T> {
  items: T[];
  pageInfo: { nextCursor: string | null; hasNextPage: boolean };
}

// --- Buyurtma / to'lov (admin) ---------------------------------------------
export type OrderStatus =
  | 'DRAFT'
  | 'PENDING_PAYMENT'
  | 'PAYMENT_FAILED'
  | 'PAID'
  | 'CONFIRMED'
  | 'PICKING'
  | 'PACKED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RETURNED'
  | 'PARTIALLY_RETURNED';

export interface OrderItem {
  variantId: string;
  sku: string;
  quantity: number;
  unitAmount: string; // TIYIN (string)
  totalAmount: string;
}

export interface Order {
  id: string;
  number: string;
  status: OrderStatus;
  customerId: string;
  subtotalAmount: string;
  discountAmount: string;
  deliveryAmount: string;
  totalAmount: string;
  currency: string;
  items: OrderItem[];
}

export interface AdminOrder extends Order {
  channel: string;
  createdAt: string;
  /** Holat mashinasidan — ruxsat etilgan keyingi holatlar (tugmalar). */
  allowedTransitions: OrderStatus[];
}

export interface OrderTimelineEntry {
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  reason: string | null;
  createdAt: string;
}

export interface AdminOrderDetail extends AdminOrder {
  customer: { phone: string | null; email: string | null; firstName: string | null } | null;
  timeline: OrderTimelineEntry[];
  /** Mijoz checkout'da tanlaganlari — jo'natma uchun default qiymatlar. */
  deliveryAddress: { id: string; region: string; city: string; street: string } | null;
  deliverySlotId: string | null;
  customerNote: string | null;
}

export type PaymentStatus =
  | 'CREATED'
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'REFUND_REQUESTED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export interface Payment {
  id: string;
  orderId: string;
  provider: string;
  status: PaymentStatus;
  amount: string; // TIYIN
  currency: string;
}

// --- Jo'natma (shipment) ---------------------------------------------------
export type ShipmentStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'FAILED'
  | 'RETURNED';

export interface Shipment {
  id: string;
  orderId: string;
  addressId: string;
  slotId: string | null;
  status: ShipmentStatus;
  courierId: string | null;
  trackingNumber: string | null;
  allowedTransitions: ShipmentStatus[];
  createdAt: string;
}

export interface CourierOption {
  id: string;
  fullName: string;
  phone: string;
}

export interface Address {
  id: string;
  region: string;
  district: string | null;
  city: string;
  street: string;
  apartment: string | null;
  isDefault: boolean;
}

// --- POS (kassa) -----------------------------------------------------------
export interface PosShift {
  id: string;
  status: 'OPEN' | 'CLOSED';
  openingCashAmount: string;
  closingCashAmount: string | null;
  cashDifferenceAmount: string | null;
  openedAt: string;
}

export interface PosTx {
  id: string;
  number: string;
  paymentMethod: string;
  totalAmount: string;
  createdAt: string;
  items: { sku: string; quantity: number; totalAmount: string }[];
}

// --- Rassrochka (installment) ----------------------------------------------
export interface InstallmentScheduleLine {
  id: string;
  installmentNumber: number;
  dueDate: string;
  amount: string;
  paidAmount: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'DEFAULTED' | 'CANCELLED';
}

export interface InstallmentPlan {
  id: string;
  orderId: string;
  kind: string;
  status: string;
  principalAmount: string;
  downPaymentAmount: string;
  totalPayableAmount: string;
  interestRateBp: number;
  termMonths: number;
  schedule: InstallmentScheduleLine[];
}

// --- Sharhlar (review) -----------------------------------------------------
export type ReviewStatus = 'PENDING_MODERATION' | 'APPROVED' | 'REJECTED';

export interface Review {
  id: string;
  productId: string;
  rating: number;
  title: string | null;
  body: string;
  status: ReviewStatus;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export interface QaAnswer { id: string; body: string; isOfficial: boolean; createdAt: string }
export interface Question {
  id: string;
  productId: string;
  body: string;
  status: ReviewStatus;
  createdAt: string;
  answers: QaAnswer[];
}

// --- CRM (lid) -------------------------------------------------------------
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'WON' | 'LOST';

export interface Lead {
  id: string;
  name: string | null;
  phone: string;
  source: string;
  status: LeadStatus;
  note: string | null;
  assignedTo: string | null;
  estimatedAmount: string | null;
  lostReason: string | null;
  createdAt: string;
}

// --- Kontent (blog) --------------------------------------------------------
export interface BlogPost {
  id: string;
  slug: string;
  title: LocalizedText;
  excerpt: LocalizedText | null;
  body: LocalizedText;
  coverUrl: string | null;
  isPublished: boolean;
  publishedAt: string | null;
}

// --- Ta'minot (procurement) ------------------------------------------------
export interface Supplier {
  id: string;
  name: string;
  phone: string | null;
}

export type POStatus = 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';

export interface POItem {
  variantId: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCostAmount: string; // TIYIN
}

export interface PurchaseOrder {
  id: string;
  number: string;
  status: POStatus;
  supplierId: string;
  warehouseId: string;
  totalAmount: string;
  items: POItem[];
}

export interface Warehouse {
  id: string;
  code: string;
  name: LocalizedText;
}

export interface VariantLookup {
  variantId: string;
  sku: string;
  productName: LocalizedText;
}

// --- Narx (pricing) --------------------------------------------------------
export interface VariantPrice {
  id: string;
  variantId: string;
  amount: string; // TIYIN (string)
  currency: string;
  minQuantity: number;
}

// --- Yetkazish (delivery) --------------------------------------------------
export interface DeliveryZone {
  id: string;
  name: LocalizedText;
  districts: string[];
  priceAmount: string; // TIYIN
  freeThresholdAmount: string | null; // TIYIN
  etaDaysMin: number;
  etaDaysMax: number;
  isActive: boolean;
}

/** ⚠️ GET /delivery/slots raw SQL'dan keladi — kalitlar snake_case. */
export interface DeliverySlotRaw {
  id: string;
  start_time: string;
  end_time: string;
  capacity: number;
  booked: number;
  is_active: boolean;
}

// --- Segment a'zolari (CRM) ------------------------------------------------
export interface SegmentMember {
  customerId: string;
  rfmScore: string | null;
  createdAt: string;
  contact: { firstName: string | null; phone: string | null; email: string | null } | null;
}

// --- Ombor (inventory) -----------------------------------------------------
export interface StockRow {
  variantId: string;
  warehouseId: string;
  sku: string;
  productName: LocalizedText | null;
  warehouseCode: string;
  onHand: number;
  reserved: number;
  available: number;
  reorderPoint: number | null;
}
