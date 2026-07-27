import { BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Actor, type CursorPage } from '@kelvin/contracts';

import { BusinessRuleError } from '../../core/errors/domain.error';
import { CurrentActor, Public, RequirePermission } from '../../shared/auth/auth.decorators';
import { ReviewService, toReviewView, type ReviewView } from './review.service';
import { type ReviewStatus } from './review.repository';
import { CreateReviewDto } from './dto/review.dto';

/**
 * review — mahsulot sharhlari (docs/10). Mijoz yozadi (review:create_own) →
 * moderatsiya (review:moderate) → ommaviy faqat APPROVED.
 */
@ApiTags('review')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviews: ReviewService) {}

  @Post()
  @RequirePermission('review:create_own')
  @ApiOperation({ summary: 'Sharh qoldirish (moderatsiyaga tushadi)' })
  async create(@Body() dto: CreateReviewDto, @CurrentActor() actor: Actor): Promise<ReviewView> {
    if (actor.customerId === undefined) {
      throw new BusinessRuleError('NOT_A_CUSTOMER', 'Sharh faqat mijoz uchun');
    }
    const review = await this.reviews.createReview({
      productId: dto.productId,
      customerId: actor.customerId,
      rating: dto.rating,
      body: dto.body,
      ...(dto.title !== undefined && { title: dto.title }),
    });
    return toReviewView(review);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Mahsulotning tasdiqlangan sharhlari (productId)' })
  async listApproved(@Query('productId') productId?: string): Promise<ReviewView[]> {
    if (productId === undefined || productId.trim() === '') {
      throw new BadRequestException('productId parametri kerak');
    }
    const list = await this.reviews.listApproved(productId);
    return list.map(toReviewView);
  }

  @Get('summary')
  @Public()
  @ApiOperation({ summary: 'Reyting xulosasi (o‘rtacha, son, taqsimot)' })
  summary(@Query('productId') productId?: string): Promise<{ average: number; count: number; distribution: Record<number, number> }> {
    if (productId === undefined || productId.trim() === '') {
      throw new BadRequestException('productId parametri kerak');
    }
    return this.reviews.summary(productId);
  }

  // --- Admin moderatsiya ----------------------------------------------------

  @Get('admin')
  @RequirePermission('review:moderate')
  @ApiOperation({ summary: 'Moderatsiya navbati (status filtri)' })
  async listForModeration(
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ): Promise<CursorPage<ReviewView>> {
    const page = await this.reviews.listForModeration({
      ...(status !== undefined && { status: status as ReviewStatus }),
      ...(limit !== undefined && { limit: Number(limit) }),
      ...(cursor !== undefined && { cursor }),
    });
    return {
      items: page.items.map(toReviewView),
      pageInfo: { nextCursor: page.nextCursor, hasNextPage: page.nextCursor !== null },
    };
  }

  @Post(':id/approve')
  @RequirePermission('review:moderate')
  @ApiOperation({ summary: 'Sharhni tasdiqlash' })
  async approve(@Param('id', new ParseUUIDPipe({ version: '7' })) id: string, @CurrentActor() actor: Actor): Promise<ReviewView> {
    return toReviewView(await this.reviews.approve(id, actor.userId));
  }

  @Post(':id/reject')
  @RequirePermission('review:moderate')
  @ApiOperation({ summary: 'Sharhni rad etish' })
  async reject(@Param('id', new ParseUUIDPipe({ version: '7' })) id: string, @CurrentActor() actor: Actor): Promise<ReviewView> {
    return toReviewView(await this.reviews.reject(id, actor.userId));
  }
}
