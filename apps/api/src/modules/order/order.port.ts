/**
 * order modulining PUBLIC porti (docs/02 §6.1) — to'lov uchun. payment moduli
 * buyurtmani FAQAT shu port orqali ilgarilatadi.
 */

export interface PayableOrder {
  readonly id: string;
  readonly customerId: string;
  readonly status: string;
  /** Buyurtma umumiy summasi (tiyin) — to'lov summasini tekshirish uchun. */
  readonly totalAmount: bigint;
  readonly currency: string;
}

export const ORDER_PORT = Symbol('OrderPort');

export interface OrderPort {
  getPayableOrder(orderId: string): Promise<PayableOrder | null>;
  /** DRAFT → PENDING_PAYMENT (to'lovga o'tish). Idempotent. */
  markPendingPayment(orderId: string): Promise<void>;
  /**
   * To'lov o'tdi — order sagasi: PENDING_PAYMENT → PAID → CONFIRMED +
   * rezervlarni tasdiqlash (docs/08 §3.3). Idempotent (webhook takrori xavfsiz).
   */
  onPaymentSucceeded(orderId: string): Promise<void>;
  /**
   * To'liq refund — buyurtmani bekor qilish (agar bekor qilinadigan holatda
   * bo'lsa) + rezerv release. Jo'natilgan/terminal bo'lsa tegilmaydi. Idempotent.
   */
  cancelForRefund(orderId: string): Promise<void>;
  /**
   * Mijoz mahsulotni sotib olganmi (to'langan+ holatdagi buyurtmada). Sharh
   * "tasdiqlangan xarid" belgisini qo'yish uchun (docs/10).
   */
  hasPurchased(customerId: string, productId: string): Promise<boolean>;
  /** Mijoz bo'yicha agregat (RFM uchun, docs/10 §9.3). To'langan+ buyurtmalar. */
  customerAggregates(): Promise<CustomerAggregate[]>;
  /** Mahsulot bo'yicha sotuv agregati (ABC uchun, docs/10 §9.7). */
  productSalesAggregates(): Promise<ProductSalesAggregate[]>;
  /** Umumiy sotuv xulosasi (analytics dashboard). */
  salesSummary(): Promise<SalesSummary>;
}

export interface CustomerAggregate {
  readonly customerId: string;
  readonly orderCount: number;
  readonly totalSpent: bigint;
  readonly lastOrderAt: Date | null;
}

export interface ProductSalesAggregate {
  readonly productId: string;
  readonly unitsSold: number;
  readonly revenue: bigint;
}

export interface SalesSummary {
  readonly orderCount: number;
  readonly totalRevenue: bigint;
  readonly averageOrderValue: bigint;
}
