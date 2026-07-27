import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../shared/prisma/prisma.service';

/** seo — sitemap uchun ommaviy slug'lar (docs/13 §6). Prisma faqat shu qatlamda. */
@Injectable()
export class SeoRepository {
  constructor(private readonly prisma: PrismaService) {}

  activeProductSlugs(): Promise<{ slug: string; updatedAt: Date }[]> {
    return this.prisma.product.findMany({ where: { status: 'ACTIVE' }, select: { slug: true, updatedAt: true }, take: 5000 });
  }

  publishedBlogSlugs(): Promise<{ slug: string; updatedAt: Date }[]> {
    return this.prisma.blogPost.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true }, take: 5000 });
  }

  publishedPageSlugs(): Promise<{ slug: string; updatedAt: Date }[]> {
    return this.prisma.page.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true }, take: 1000 });
  }
}
