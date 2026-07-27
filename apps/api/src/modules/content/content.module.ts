import { Module } from '@nestjs/common';

import { BlogController } from './blog.controller';
import { PageController } from './page.controller';
import { BannerController } from './banner.controller';
import { ContentService } from './content.service';
import { ContentRepository } from './content.repository';

/**
 * content — blog maqolalari va statik sahifalar (docs/13).
 * Ommaviy o'qish (nashr etilganlar) + admin CRUD (content:write).
 */
@Module({
  controllers: [BlogController, PageController, BannerController],
  providers: [ContentRepository, ContentService],
  exports: [ContentService],
})
export class ContentModule {}
