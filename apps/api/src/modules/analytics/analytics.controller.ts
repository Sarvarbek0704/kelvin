import { Controller, Get, Header } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { RequirePermission } from '../../shared/auth/auth.decorators';
import { AnalyticsService, type AbcRow } from './analytics.service';

/** analytics — hisobotlar (docs/10 §9.6-9.7). Xodim: report:read_all. */
@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('summary')
  @RequirePermission('report:read_all')
  @ApiOperation({ summary: 'Sotuv xulosasi (son, aylanma, o‘rtacha chek)' })
  async summary(): Promise<{ orderCount: number; totalRevenue: string; averageOrderValue: string }> {
    const s = await this.analytics.salesSummary();
    return { orderCount: s.orderCount, totalRevenue: s.totalRevenue.toString(), averageOrderValue: s.averageOrderValue.toString() };
  }

  @Get('abc')
  @RequirePermission('report:read_all')
  @ApiOperation({ summary: 'ABC tahlil (mahsulotlar aylanma bo‘yicha A/B/C)' })
  abc(): Promise<AbcRow[]> {
    return this.analytics.abcAnalysis();
  }

  @Get('abc.csv')
  @RequirePermission('report:read_all')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="abc-report.csv"')
  @ApiOperation({ summary: 'ABC hisobotini CSV eksport (§9.9)' })
  abcCsv(): Promise<string> {
    return this.analytics.abcCsv();
  }

  @Get('sales.csv')
  @RequirePermission('report:read_all')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="sales-summary.csv"')
  @ApiOperation({ summary: 'Sotuv xulosasini CSV eksport' })
  salesCsv(): Promise<string> {
    return this.analytics.salesCsv();
  }
}
