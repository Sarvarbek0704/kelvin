/**
 * catalog modulining PUBLIC porti (docs/02 §6.1) — buyurtma snapshot'i uchun.
 * order moduli variant ma'lumotini (sku, nom, o'qlar) FAQAT shu port orqali oladi.
 */

export interface VariantSnapshot {
  readonly variantId: string;
  readonly sku: string;
  /** Mahsulot nomi — ko'p tilli (Loc). Snapshot: buyurtmada muzlaydi. */
  readonly productName: Record<string, string>;
  readonly variantAxis: Record<string, unknown>;
  readonly attributes: Record<string, unknown>;
  /** Mahsulot ACTIVE (sotiladigan) holatdami. */
  readonly productActive: boolean;
  /** Asosiy rasm URL'i (savat/buyurtma thumbnail) — rasm yo'q bo'lsa null. */
  readonly imageUrl: string | null;
}

export const CATALOG_PORT = Symbol('CatalogPort');

export interface CatalogPort {
  getVariantSnapshots(variantIds: readonly string[]): Promise<VariantSnapshot[]>;
}
