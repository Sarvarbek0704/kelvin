import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../shared/prisma/prisma.service';
import { ConflictError } from '../../core/errors/domain.error';

export type ReviewRow = Prisma.ReviewGetPayload<Record<string, never>>;
export type ReviewStatus = ReviewRow['status'];
export type QuestionRow = Prisma.QuestionGetPayload<{ include: { answers: true } }>;
export type AnswerRow = Prisma.AnswerGetPayload<Record<string, never>>;

export interface CreateReviewData {
  productId: string;
  customerId: string;
  rating: number;
  title?: string;
  body: string;
  isVerifiedPurchase?: boolean;
}

/** review — mahsulot sharhlari (docs/10). Prisma faqat shu qatlamda. */
@Injectable()
export class ReviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** ⚠️ Bitta mijoz — bitta mahsulotga bitta sharh (@@unique). Takror → Conflict. */
  async create(data: CreateReviewData): Promise<ReviewRow> {
    try {
      return await this.prisma.review.create({
        data: {
          productId: data.productId,
          customerId: data.customerId,
          rating: data.rating,
          body: data.body,
          status: 'PENDING_MODERATION',
          ...(data.isVerifiedPurchase !== undefined && { isVerifiedPurchase: data.isVerifiedPurchase }),
          ...(data.title !== undefined && { title: data.title }),
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictError('Siz bu mahsulotga allaqachon sharh qoldirgansiz');
      }
      throw err;
    }
  }

  findById(id: string): Promise<ReviewRow | null> {
    return this.prisma.review.findUnique({ where: { id } });
  }

  /** Ommaviy — mahsulotning TASDIQLANGAN sharhlari, yangi birinchi. */
  listApproved(productId: string, limit: number): Promise<ReviewRow[]> {
    return this.prisma.review.findMany({
      where: { productId, status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /** Reyting xulosasi (tasdiqlangan): o'rtacha, son, taqsimot. */
  async summary(productId: string): Promise<{ average: number; count: number; distribution: Record<number, number> }> {
    const where = { productId, status: 'APPROVED' as ReviewStatus };
    const agg = await this.prisma.review.aggregate({ where, _avg: { rating: true }, _count: { _all: true } });
    const byRating = await this.prisma.review.groupBy({ by: ['rating'], where, _count: { _all: true } });
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of byRating) {
      distribution[r.rating] = r._count._all;
    }
    return { average: agg._avg.rating ?? 0, count: agg._count._all, distribution };
  }

  /** Admin — moderatsiya navbati, cursor (uuid7 → id desc = eng yangi). */
  async listForModeration(params: { status?: ReviewStatus; cursor?: string; limit: number }): Promise<{ items: ReviewRow[]; nextCursor: string | null }> {
    const take = params.limit + 1;
    const rows = await this.prisma.review.findMany({
      where: { ...(params.status !== undefined && { status: params.status }) },
      orderBy: { id: 'desc' },
      take,
      ...(params.cursor !== undefined && { cursor: { id: params.cursor }, skip: 1 }),
    });
    const hasNext = rows.length > params.limit;
    const items = hasNext ? rows.slice(0, params.limit) : rows;
    return { items, nextCursor: hasNext ? (items[items.length - 1]?.id ?? null) : null };
  }

  setStatus(id: string, status: ReviewStatus, moderatedBy?: string): Promise<ReviewRow> {
    return this.prisma.review.update({
      where: { id },
      data: { status, ...(moderatedBy !== undefined && { moderatedBy }) },
    });
  }

  // --- Savol-javob (Q&A, docs/10 §9.4) --------------------------------------
  createQuestion(data: { productId: string; customerId: string; body: string }): Promise<QuestionRow> {
    return this.prisma.question.create({
      data: { productId: data.productId, customerId: data.customerId, body: data.body, status: 'PENDING_MODERATION' },
      include: { answers: true },
    });
  }

  findQuestion(id: string): Promise<QuestionRow | null> {
    return this.prisma.question.findUnique({ where: { id }, include: { answers: true } });
  }

  /** Ommaviy — mahsulotning TASDIQLANGAN savollari + javoblari. */
  listApprovedQuestions(productId: string, limit: number): Promise<QuestionRow[]> {
    return this.prisma.question.findMany({
      where: { productId, status: 'APPROVED' },
      include: { answers: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async listQuestionsForModeration(params: { status?: ReviewStatus; cursor?: string; limit: number }): Promise<{ items: QuestionRow[]; nextCursor: string | null }> {
    const take = params.limit + 1;
    const rows = await this.prisma.question.findMany({
      where: { ...(params.status !== undefined && { status: params.status }) },
      include: { answers: true },
      orderBy: { id: 'desc' },
      take,
      ...(params.cursor !== undefined && { cursor: { id: params.cursor }, skip: 1 }),
    });
    const hasNext = rows.length > params.limit;
    const items = hasNext ? rows.slice(0, params.limit) : rows;
    return { items, nextCursor: hasNext ? (items[items.length - 1]?.id ?? null) : null };
  }

  setQuestionStatus(id: string, status: ReviewStatus): Promise<QuestionRow> {
    return this.prisma.question.update({ where: { id }, data: { status }, include: { answers: true } });
  }

  createAnswer(data: { questionId: string; authorUserId: string; body: string; isOfficial: boolean }): Promise<AnswerRow> {
    return this.prisma.answer.create({
      data: { questionId: data.questionId, authorUserId: data.authorUserId, body: data.body, isOfficial: data.isOfficial },
    });
  }
}
