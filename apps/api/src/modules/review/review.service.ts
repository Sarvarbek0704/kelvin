import { Inject, Injectable } from '@nestjs/common';

import { BusinessRuleError, NotFoundError } from '../../core/errors/domain.error';
import { ORDER_PORT, type OrderPort } from '../order/order.port';
import { ReviewRepository, type AnswerRow, type QuestionRow, type ReviewRow, type ReviewStatus } from './review.repository';

/** JSON javob — sharh ko'rinishi. */
export interface ReviewView {
  readonly id: string;
  readonly productId: string;
  readonly rating: number;
  readonly title: string | null;
  readonly body: string;
  readonly status: string;
  readonly isVerifiedPurchase: boolean;
  readonly createdAt: string;
}

export function toReviewView(r: ReviewRow): ReviewView {
  return {
    id: r.id,
    productId: r.productId,
    rating: r.rating,
    title: r.title,
    body: r.body,
    status: r.status,
    isVerifiedPurchase: r.isVerifiedPurchase,
    createdAt: r.createdAt.toISOString(),
  };
}

/**
 * review — mahsulot sharhlari (docs/10). Mijoz yozadi (PENDING_MODERATION) →
 * xodim moderatsiya qiladi (APPROVED/REJECTED) → ommaviy faqat APPROVED ko'rinadi.
 *
 * ⚠️ Har autentifikatsiya qilingan mijoz sharh qoldira oladi (xarid MAJBURIY EMAS),
 *    lekin sotib olganlar `isVerifiedPurchase` belgisini oladi (ORDER_PORT, docs/10).
 */
@Injectable()
export class ReviewService {
  constructor(
    private readonly repo: ReviewRepository,
    @Inject(ORDER_PORT) private readonly orders: OrderPort,
  ) {}

  async createReview(input: { productId: string; customerId: string; rating: number; title?: string; body: string }): Promise<ReviewRow> {
    if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
      throw new BusinessRuleError('INVALID_RATING', 'Reyting 1 dan 5 gacha bo‘lishi kerak');
    }
    if (input.body.trim().length === 0) {
      throw new BusinessRuleError('EMPTY_BODY', 'Sharh matni bo‘sh bo‘lmasligi kerak');
    }
    // ⚠️ Tasdiqlangan xarid — mijoz shu mahsulotni to'langan+ buyurtmada olganmi.
    const isVerifiedPurchase = await this.orders.hasPurchased(input.customerId, input.productId);
    return await this.repo.create({
      productId: input.productId,
      customerId: input.customerId,
      rating: input.rating,
      body: input.body,
      isVerifiedPurchase,
      ...(input.title !== undefined && { title: input.title }),
    });
  }

  listApproved(productId: string, limit = 50): Promise<ReviewRow[]> {
    return this.repo.listApproved(productId, Math.min(limit, 100));
  }

  summary(productId: string): Promise<{ average: number; count: number; distribution: Record<number, number> }> {
    return this.repo.summary(productId);
  }

  listForModeration(params: { status?: ReviewStatus; cursor?: string; limit?: number }): Promise<{ items: ReviewRow[]; nextCursor: string | null }> {
    return this.repo.listForModeration({
      ...(params.status !== undefined && { status: params.status }),
      ...(params.cursor !== undefined && { cursor: params.cursor }),
      limit: Math.min(params.limit ?? 20, 100),
    });
  }

  async approve(id: string, moderatorUserId?: string): Promise<ReviewRow> {
    await this.getOr404(id);
    return await this.repo.setStatus(id, 'APPROVED', moderatorUserId);
  }

  async reject(id: string, moderatorUserId?: string): Promise<ReviewRow> {
    await this.getOr404(id);
    return await this.repo.setStatus(id, 'REJECTED', moderatorUserId);
  }

  private async getOr404(id: string): Promise<ReviewRow> {
    const r = await this.repo.findById(id);
    if (r === null) {
      throw new NotFoundError('Sharh', id);
    }
    return r;
  }

  // --- Savol-javob (Q&A) ----------------------------------------------------
  async createQuestion(input: { productId: string; customerId: string; body: string }): Promise<QuestionRow> {
    if (input.body.trim().length === 0) {
      throw new BusinessRuleError('EMPTY_BODY', 'Savol matni bo‘sh bo‘lmasligi kerak');
    }
    return await this.repo.createQuestion(input);
  }

  listApprovedQuestions(productId: string, limit = 50): Promise<QuestionRow[]> {
    return this.repo.listApprovedQuestions(productId, Math.min(limit, 100));
  }

  listQuestionsForModeration(params: { status?: ReviewStatus; cursor?: string; limit?: number }): Promise<{ items: QuestionRow[]; nextCursor: string | null }> {
    return this.repo.listQuestionsForModeration({
      ...(params.status !== undefined && { status: params.status }),
      ...(params.cursor !== undefined && { cursor: params.cursor }),
      limit: Math.min(params.limit ?? 20, 100),
    });
  }

  async setQuestionStatus(id: string, status: 'APPROVED' | 'REJECTED'): Promise<QuestionRow> {
    const q = await this.repo.findQuestion(id);
    if (q === null) {
      throw new NotFoundError('Savol', id);
    }
    return await this.repo.setQuestionStatus(id, status);
  }

  /** Xodim javobi. Savol APPROVED bo'lishi kerak (moderatsiyadan o'tgan). */
  async answerQuestion(questionId: string, authorUserId: string, body: string, isOfficial = true): Promise<AnswerRow> {
    const q = await this.repo.findQuestion(questionId);
    if (q === null) {
      throw new NotFoundError('Savol', questionId);
    }
    if (body.trim().length === 0) {
      throw new BusinessRuleError('EMPTY_BODY', 'Javob matni bo‘sh bo‘lmasligi kerak');
    }
    return await this.repo.createAnswer({ questionId, authorUserId, body, isOfficial });
  }
}

/** JSON javob — savol + javoblar. */
export interface QuestionView {
  readonly id: string;
  readonly productId: string;
  readonly body: string;
  readonly status: string;
  readonly createdAt: string;
  readonly answers: readonly { readonly id: string; readonly body: string; readonly isOfficial: boolean; readonly createdAt: string }[];
}

export function toQuestionView(q: QuestionRow): QuestionView {
  return {
    id: q.id,
    productId: q.productId,
    body: q.body,
    status: q.status,
    createdAt: q.createdAt.toISOString(),
    answers: q.answers.map((a) => ({ id: a.id, body: a.body, isOfficial: a.isOfficial, createdAt: a.createdAt.toISOString() })),
  };
}
