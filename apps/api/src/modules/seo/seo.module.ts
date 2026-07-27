import { Module } from '@nestjs/common';

import { SeoController } from './seo.controller';
import { SeoService } from './seo.service';
import { SeoRepository } from './seo.repository';

/** seo — sitemap.xml + robots.txt (docs/13 §6, Faza 10 SPA). */
@Module({
  controllers: [SeoController],
  providers: [SeoRepository, SeoService],
})
export class SeoModule {}
