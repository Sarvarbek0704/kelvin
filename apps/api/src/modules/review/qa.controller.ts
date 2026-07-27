import { BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Actor, type CursorPage } from '@kelvin/contracts';

import { BusinessRuleError } from '../../core/errors/domain.error';
import { CurrentActor, Public, RequirePermission } from '../../shared/auth/auth.decorators';
import { ReviewService, toQuestionView, type QuestionView } from './review.service';
import { type ReviewStatus } from './review.repository';
import { CreateAnswerDto, CreateQuestionDto } from './dto/qa.dto';

/** questions — mahsulot savol-javob (docs/10 §9.4). Mijoz so'raydi → moderatsiya → xodim javob beradi. */
@ApiTags('review: q&a')
@Controller('questions')
export class QaController {
  constructor(private readonly reviews: ReviewService) {}

  @Post()
  @RequirePermission('review:create_own')
  @ApiOperation({ summary: 'Savol berish (moderatsiyaga)' })
  async create(@Body() dto: CreateQuestionDto, @CurrentActor() actor: Actor): Promise<QuestionView> {
    if (actor.customerId === undefined) {
      throw new BusinessRuleError('NOT_A_CUSTOMER', 'Savol faqat mijoz uchun');
    }
    const q = await this.reviews.createQuestion({ productId: dto.productId, customerId: actor.customerId, body: dto.body });
    return toQuestionView(q);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Mahsulotning tasdiqlangan savol-javoblari (productId)' })
  async listApproved(@Query('productId') productId?: string): Promise<QuestionView[]> {
    if (productId === undefined || productId.trim() === '') {
      throw new BadRequestException('productId parametri kerak');
    }
    const list = await this.reviews.listApprovedQuestions(productId);
    return list.map(toQuestionView);
  }

  @Get('admin')
  @RequirePermission('review:moderate')
  @ApiOperation({ summary: 'Savollar moderatsiya navbati' })
  async listForModeration(
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ): Promise<CursorPage<QuestionView>> {
    const page = await this.reviews.listQuestionsForModeration({
      ...(status !== undefined && { status: status as ReviewStatus }),
      ...(limit !== undefined && { limit: Number(limit) }),
      ...(cursor !== undefined && { cursor }),
    });
    return {
      items: page.items.map(toQuestionView),
      pageInfo: { nextCursor: page.nextCursor, hasNextPage: page.nextCursor !== null },
    };
  }

  @Post(':id/approve')
  @RequirePermission('review:moderate')
  @ApiOperation({ summary: 'Savolni tasdiqlash' })
  async approve(@Param('id', new ParseUUIDPipe({ version: '7' })) id: string): Promise<QuestionView> {
    return toQuestionView(await this.reviews.setQuestionStatus(id, 'APPROVED'));
  }

  @Post(':id/reject')
  @RequirePermission('review:moderate')
  @ApiOperation({ summary: 'Savolni rad etish' })
  async reject(@Param('id', new ParseUUIDPipe({ version: '7' })) id: string): Promise<QuestionView> {
    return toQuestionView(await this.reviews.setQuestionStatus(id, 'REJECTED'));
  }

  @Post(':id/answers')
  @RequirePermission('review:moderate')
  @ApiOperation({ summary: 'Savolga javob (xodim)' })
  async answer(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() dto: CreateAnswerDto,
    @CurrentActor() actor: Actor,
  ): Promise<{ id: string; body: string; isOfficial: boolean }> {
    const a = await this.reviews.answerQuestion(id, actor.userId, dto.body, dto.isOfficial ?? true);
    return { id: a.id, body: a.body, isOfficial: a.isOfficial };
  }
}
