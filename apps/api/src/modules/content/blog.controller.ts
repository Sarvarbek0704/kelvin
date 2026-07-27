import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Actor, type CursorPage } from '@kelvin/contracts';

import { NotFoundError } from '../../core/errors/domain.error';
import { CurrentActor, Public, RequirePermission } from '../../shared/auth/auth.decorators';
import { ContentService } from './content.service';
import { type BlogPostRow } from './content.repository';
import { CreateBlogPostDto, UpdateBlogPostDto } from './dto/content.dto';

/** blog — maqolalar (docs/13). Ommaviy o'qish nashr etilganlar; admin content:write. */
@ApiTags('content: blog')
@Controller('blog')
export class BlogController {
  constructor(private readonly content: ContentService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Nashr etilgan maqolalar (storefront)' })
  listPublished(@Query('limit') limit?: string): Promise<BlogPostRow[]> {
    return this.content.listPublished(limit !== undefined ? Number(limit) : undefined);
  }

  // --- Admin (⚠️ ':slug'dan OLDIN — aks holda 'admin' slug sifatida ushlanadi) --

  @Get('admin')
  @RequirePermission('content:write')
  @ApiOperation({ summary: 'Admin: barcha maqolalar (qoralama ham)' })
  async listAll(
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ): Promise<CursorPage<BlogPostRow>> {
    const page = await this.content.listAllPosts({
      ...(limit !== undefined && { limit: Number(limit) }),
      ...(cursor !== undefined && { cursor }),
    });
    return {
      items: page.items,
      pageInfo: { nextCursor: page.nextCursor, hasNextPage: page.nextCursor !== null },
    };
  }

  @Get('admin/:id')
  @RequirePermission('content:write')
  @ApiOperation({ summary: 'Admin: maqola (tahrirlash uchun)' })
  async getForAdmin(@Param('id', new ParseUUIDPipe({ version: '7' })) id: string): Promise<BlogPostRow> {
    const post = await this.content.getPostForAdmin(id);
    if (post === null) {
      throw new NotFoundError('Blog maqolasi', id);
    }
    return post;
  }

  @Post()
  @RequirePermission('content:write')
  @ApiOperation({ summary: 'Maqola yaratish (DRAFT)' })
  create(@Body() dto: CreateBlogPostDto, @CurrentActor() actor: Actor): Promise<BlogPostRow> {
    return this.content.createPost({
      slug: dto.slug,
      title: dto.title,
      body: dto.body,
      ...(dto.excerpt !== undefined && { excerpt: dto.excerpt }),
      ...(dto.coverUrl !== undefined && { coverUrl: dto.coverUrl }),
      authorUserId: actor.userId,
    });
  }

  @Patch(':id')
  @RequirePermission('content:write')
  @ApiOperation({ summary: 'Maqolani yangilash' })
  update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() dto: UpdateBlogPostDto,
  ): Promise<BlogPostRow> {
    return this.content.updatePost(id, dto);
  }

  @Post(':id/publish')
  @RequirePermission('content:write')
  @ApiOperation({ summary: 'Nashr etish (publishedAt bir marta belgilanadi)' })
  publish(@Param('id', new ParseUUIDPipe({ version: '7' })) id: string): Promise<BlogPostRow> {
    return this.content.publish(id);
  }

  @Post(':id/unpublish')
  @RequirePermission('content:write')
  @ApiOperation({ summary: 'Nashrdan olish' })
  unpublish(@Param('id', new ParseUUIDPipe({ version: '7' })) id: string): Promise<BlogPostRow> {
    return this.content.unpublish(id);
  }

  @Get(':slug')
  @Public()
  @ApiOperation({ summary: 'Nashr etilgan maqola (slug) — storefront' })
  getBySlug(@Param('slug') slug: string): Promise<BlogPostRow> {
    return this.content.getPublishedBySlug(slug);
  }
}
