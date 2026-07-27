import { Injectable } from '@nestjs/common';
import { type LocalizedText } from '@kelvin/contracts';

import { NotFoundError } from '../../core/errors/domain.error';
import { toJson } from '../../shared/json';
import {
  ContentRepository,
  type BannerRow,
  type BlogPostRow,
  type PageRow,
} from './content.repository';

export interface BlogPostInput {
  slug: string;
  title: LocalizedText;
  excerpt?: LocalizedText;
  body: LocalizedText;
  coverUrl?: string;
  authorUserId?: string;
}

/** content — blog/statik sahifa (docs/13). Nashr publishedAt'ni belgilaydi. */
@Injectable()
export class ContentService {
  constructor(private readonly repo: ContentRepository) {}

  // --- BlogPost -------------------------------------------------------------
  createPost(input: BlogPostInput): Promise<BlogPostRow> {
    return this.repo.createPost({
      slug: input.slug,
      title: toJson(input.title),
      body: toJson(input.body),
      ...(input.excerpt !== undefined && { excerpt: toJson(input.excerpt) }),
      ...(input.coverUrl !== undefined && { coverUrl: input.coverUrl }),
      ...(input.authorUserId !== undefined && { authorUserId: input.authorUserId }),
    });
  }

  async updatePost(id: string, input: Partial<BlogPostInput>): Promise<BlogPostRow> {
    await this.getPostOr404(id);
    return await this.repo.updatePost(id, {
      ...(input.slug !== undefined && { slug: input.slug }),
      ...(input.title !== undefined && { title: toJson(input.title) }),
      ...(input.excerpt !== undefined && { excerpt: toJson(input.excerpt) }),
      ...(input.body !== undefined && { body: toJson(input.body) }),
      ...(input.coverUrl !== undefined && { coverUrl: input.coverUrl }),
    });
  }

  /** Nashr: isPublished=true + publishedAt (birinchi marta). Idempotent. */
  async publish(id: string): Promise<BlogPostRow> {
    const post = await this.getPostOr404(id);
    // ⚠️ publishedAt BIR MARTA belgilanadi (qayta nashr sanani surmaydi).
    const publishedAt = post.publishedAt ?? new Date();
    return await this.repo.setPublished(id, true, publishedAt);
  }

  async unpublish(id: string): Promise<BlogPostRow> {
    await this.getPostOr404(id);
    return await this.repo.setPublished(id, false, null);
  }

  getPostForAdmin(id: string): Promise<BlogPostRow | null> {
    return this.repo.findPostById(id);
  }

  listAllPosts(params: { cursor?: string; limit?: number }): Promise<{ items: BlogPostRow[]; nextCursor: string | null }> {
    return this.repo.listAll({
      ...(params.cursor !== undefined && { cursor: params.cursor }),
      limit: Math.min(params.limit ?? 20, 100),
    });
  }

  listPublished(limit = 20): Promise<BlogPostRow[]> {
    return this.repo.listPublished(Math.min(limit, 50));
  }

  async getPublishedBySlug(slug: string): Promise<BlogPostRow> {
    const post = await this.repo.findPublishedBySlug(slug);
    if (post === null) {
      throw new NotFoundError('Blog maqolasi', slug);
    }
    return post;
  }

  private async getPostOr404(id: string): Promise<BlogPostRow> {
    const post = await this.repo.findPostById(id);
    if (post === null) {
      throw new NotFoundError('Blog maqolasi', id);
    }
    return post;
  }

  // --- Page -----------------------------------------------------------------
  async getPublishedPage(slug: string): Promise<PageRow> {
    const page = await this.repo.findPublishedPage(slug);
    if (page === null) {
      throw new NotFoundError('Sahifa', slug);
    }
    return page;
  }

  listPages(): Promise<PageRow[]> {
    return this.repo.listPages();
  }

  upsertPage(input: { slug: string; title: LocalizedText; body: LocalizedText; isPublished?: boolean }): Promise<PageRow> {
    return this.repo.upsertPage(input.slug, {
      title: toJson(input.title),
      body: toJson(input.body),
      ...(input.isPublished !== undefined && { isPublished: input.isPublished }),
    });
  }

  // --- Banner ---------------------------------------------------------------
  createBanner(input: { title: LocalizedText; imageUrl: string; linkUrl?: string; position?: string; sortOrder?: number }): Promise<BannerRow> {
    return this.repo.createBanner({
      title: toJson(input.title),
      imageUrl: input.imageUrl,
      ...(input.linkUrl !== undefined && { linkUrl: input.linkUrl }),
      ...(input.position !== undefined && { position: input.position }),
      ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
    });
  }

  listActiveBanners(position?: string): Promise<BannerRow[]> {
    return this.repo.listActiveBanners(position);
  }

  listAllBanners(): Promise<BannerRow[]> {
    return this.repo.listAllBanners();
  }

  async updateBanner(id: string, input: { title?: LocalizedText; imageUrl?: string; linkUrl?: string; position?: string; sortOrder?: number; isActive?: boolean }): Promise<BannerRow> {
    return await this.repo.updateBanner(id, {
      ...(input.title !== undefined && { title: toJson(input.title) }),
      ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
      ...(input.linkUrl !== undefined && { linkUrl: input.linkUrl }),
      ...(input.position !== undefined && { position: input.position }),
      ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    });
  }

  async deleteBanner(id: string): Promise<void> {
    await this.repo.deleteBanner(id);
  }
}
