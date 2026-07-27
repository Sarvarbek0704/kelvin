import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../shared/prisma/prisma.service';
import { type JsonInput } from '../../shared/json';

export type BlogPostRow = Prisma.BlogPostGetPayload<Record<string, never>>;
export type PageRow = Prisma.PageGetPayload<Record<string, never>>;
export type BannerRow = Prisma.BannerGetPayload<Record<string, never>>;

export interface BlogPostData {
  slug: string;
  title: JsonInput;
  excerpt?: JsonInput;
  body: JsonInput;
  coverUrl?: string;
  metaTitle?: JsonInput;
  metaDescription?: JsonInput;
  authorUserId?: string;
}

/** content — blog/statik sahifa (docs/13). Prisma faqat shu qatlamda. */
@Injectable()
export class ContentRepository {
  constructor(private readonly prisma: PrismaService) {}

  // --- BlogPost -------------------------------------------------------------
  createPost(data: BlogPostData): Promise<BlogPostRow> {
    return this.prisma.blogPost.create({
      data: {
        slug: data.slug,
        title: data.title,
        body: data.body,
        ...(data.excerpt !== undefined && { excerpt: data.excerpt }),
        ...(data.coverUrl !== undefined && { coverUrl: data.coverUrl }),
        ...(data.metaTitle !== undefined && { metaTitle: data.metaTitle }),
        ...(data.metaDescription !== undefined && { metaDescription: data.metaDescription }),
        ...(data.authorUserId !== undefined && { authorUserId: data.authorUserId }),
      },
    });
  }

  updatePost(id: string, data: Partial<BlogPostData>): Promise<BlogPostRow> {
    return this.prisma.blogPost.update({
      where: { id },
      data: {
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.excerpt !== undefined && { excerpt: data.excerpt }),
        ...(data.body !== undefined && { body: data.body }),
        ...(data.coverUrl !== undefined && { coverUrl: data.coverUrl }),
        ...(data.metaTitle !== undefined && { metaTitle: data.metaTitle }),
        ...(data.metaDescription !== undefined && { metaDescription: data.metaDescription }),
      },
    });
  }

  findPostById(id: string): Promise<BlogPostRow | null> {
    return this.prisma.blogPost.findUnique({ where: { id } });
  }

  findPublishedBySlug(slug: string): Promise<BlogPostRow | null> {
    return this.prisma.blogPost.findFirst({ where: { slug, isPublished: true } });
  }

  /** Ommaviy — nashr etilganlar, yangi birinchi. */
  listPublished(limit: number): Promise<BlogPostRow[]> {
    return this.prisma.blogPost.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });
  }

  /** Admin — barcha (qoralama ham), cursor (uuid7 → id desc). */
  async listAll(params: { cursor?: string; limit: number }): Promise<{ items: BlogPostRow[]; nextCursor: string | null }> {
    const take = params.limit + 1;
    const rows = await this.prisma.blogPost.findMany({
      orderBy: { id: 'desc' },
      take,
      ...(params.cursor !== undefined && { cursor: { id: params.cursor }, skip: 1 }),
    });
    const hasNext = rows.length > params.limit;
    const items = hasNext ? rows.slice(0, params.limit) : rows;
    return { items, nextCursor: hasNext ? (items[items.length - 1]?.id ?? null) : null };
  }

  setPublished(id: string, isPublished: boolean, publishedAt: Date | null): Promise<BlogPostRow> {
    return this.prisma.blogPost.update({ where: { id }, data: { isPublished, publishedAt } });
  }

  // --- Page -----------------------------------------------------------------
  findPublishedPage(slug: string): Promise<PageRow | null> {
    return this.prisma.page.findFirst({ where: { slug, isPublished: true } });
  }

  listPages(): Promise<PageRow[]> {
    return this.prisma.page.findMany({ orderBy: { slug: 'asc' } });
  }

  upsertPage(slug: string, data: { title: JsonInput; body: JsonInput; isPublished?: boolean }): Promise<PageRow> {
    return this.prisma.page.upsert({
      where: { slug },
      create: { slug, title: data.title, body: data.body, ...(data.isPublished !== undefined && { isPublished: data.isPublished }) },
      update: { title: data.title, body: data.body, ...(data.isPublished !== undefined && { isPublished: data.isPublished }) },
    });
  }

  // --- Banner (docs/10 §9.5) ------------------------------------------------
  createBanner(data: { title: JsonInput; imageUrl: string; linkUrl?: string; position?: string; sortOrder?: number }): Promise<BannerRow> {
    return this.prisma.banner.create({
      data: {
        title: data.title,
        imageUrl: data.imageUrl,
        ...(data.linkUrl !== undefined && { linkUrl: data.linkUrl }),
        ...(data.position !== undefined && { position: data.position }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
    });
  }

  /** Ommaviy — faol bannerlar (pozitsiya bo'yicha, tartiblangan). */
  listActiveBanners(position?: string): Promise<BannerRow[]> {
    return this.prisma.banner.findMany({
      where: { isActive: true, ...(position !== undefined && { position }) },
      orderBy: [{ position: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  listAllBanners(): Promise<BannerRow[]> {
    return this.prisma.banner.findMany({ orderBy: [{ position: 'asc' }, { sortOrder: 'asc' }] });
  }

  updateBanner(id: string, data: Partial<{ title: JsonInput; imageUrl: string; linkUrl: string; position: string; sortOrder: number; isActive: boolean }>): Promise<BannerRow> {
    return this.prisma.banner.update({ where: { id }, data });
  }

  async deleteBanner(id: string): Promise<void> {
    await this.prisma.banner.delete({ where: { id } });
  }
}
