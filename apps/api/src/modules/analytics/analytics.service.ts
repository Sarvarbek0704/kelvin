import { Inject, Injectable } from '@nestjs/common';

import { ORDER_PORT, type OrderPort } from '../order/order.port';

export interface AbcRow {
  readonly productId: string;
  readonly unitsSold: number;
  readonly revenue: string;
  readonly abcClass: 'A' | 'B' | 'C';
}

/**
 * analytics — hisobotlar (docs/10 §9.6-9.7). ⚠️ Mazmunli natija bir necha oy REAL
 * sotuv ma'lumotini talab qiladi (§9.7). Mexanizm tayyor; hisob to'langan+
 * buyurtmalardan (ORDER_PORT).
 */
@Injectable()
export class AnalyticsService {
  constructor(@Inject(ORDER_PORT) private readonly orders: OrderPort) {}

  salesSummary(): Promise<{ orderCount: number; totalRevenue: bigint; averageOrderValue: bigint }> {
    return this.orders.salesSummary();
  }

  /** ABC hisobotini CSV sifatida (eksport, docs/10 §9.9). */
  async abcCsv(): Promise<string> {
    const rows = await this.abcAnalysis();
    const header = 'product_id,units_sold,revenue_tiyin,abc_class';
    const body = rows.map((r) => `${r.productId},${String(r.unitsSold)},${r.revenue},${r.abcClass}`).join('\n');
    return `${header}\n${body}\n`;
  }

  /** Sotuv xulosasini CSV sifatida. */
  async salesCsv(): Promise<string> {
    const s = await this.salesSummary();
    return `metric,value_tiyin\norder_count,${String(s.orderCount)}\ntotal_revenue,${s.totalRevenue.toString()}\naverage_order_value,${s.averageOrderValue.toString()}\n`;
  }

  /**
   * ABC tahlil (Pareto): mahsulotlarni aylanma bo'yicha A/B/C ga bo'ladi.
   * A = kumulyativ 80% gacha, B = 80-95%, C = qolgani. ⚠️ Standart metodika.
   */
  async abcAnalysis(): Promise<AbcRow[]> {
    const aggs = await this.orders.productSalesAggregates(); // aylanma bo'yicha kamayuvchi
    const total = aggs.reduce((s, a) => s + a.revenue, 0n);
    let cumulative = 0n;
    return aggs.map((a) => {
      cumulative += a.revenue;
      const cumPct = total > 0n ? Number((cumulative * 100n) / total) : 0;
      const abcClass: 'A' | 'B' | 'C' = cumPct <= 80 ? 'A' : cumPct <= 95 ? 'B' : 'C';
      return { productId: a.productId, unitsSold: a.unitsSold, revenue: a.revenue.toString(), abcClass };
    });
  }
}
