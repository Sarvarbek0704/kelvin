import { Module } from '@nestjs/common';

import { SearchController } from './search.controller';
import { SearchService } from './search.service';

/**
 * search — faceted qidiruv (docs/02 §5 №3).
 * Indekslovchi (yozish tomoni) catalog modulida (ProductRepository shu yerda);
 * bu modul faqat O'QISH (Meilisearch so'rovi + facet).
 */
@Module({
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
