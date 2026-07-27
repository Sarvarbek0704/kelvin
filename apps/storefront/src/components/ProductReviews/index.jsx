import React, { useState } from 'react';
import styled from 'styled-components';
import { useReviewSummary, useProductReviews, useSubmitReview } from '../../lib/reviews';
import { useAuth } from '../../lib/auth-context';
import {
  Hairline,
  Rating,
  Button,
  Input,
  Textarea,
  FieldError,
  IconStar,
} from '../ui';

const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString('ru-RU') : '');

const Section = styled.section`
  h2 {
    font-size: 32px;
    margin: 0;
  }

  .head-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
  }

  .summary {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 18px;
    font-size: 14px;

    .score {
      font-weight: 600;
    }

    .muted {
      color: ${(p) => p.theme.color.inkMuted};
      font-size: 13px;
    }
  }

  .cards {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
`;

const ReviewCard = styled.div`
  background: ${(p) => p.theme.color.surface};
  border: 1px solid ${(p) => p.theme.color.border};
  border-radius: 12px;
  padding: 22px;

  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }

  .who {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .verified {
    font-size: 12px;
    font-weight: 600;
    color: ${(p) => p.theme.color.success};
  }

  .date {
    font-size: 13px;
    color: ${(p) => p.theme.color.inkMuted};
  }

  .title {
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 4px;
    color: ${(p) => p.theme.color.ink};
  }

  .body {
    font-size: 14px;
    line-height: 1.6;
    color: ${(p) => p.theme.color.bodyText};
  }
`;

const FormWrap = styled.form`
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  .stars {
    display: flex;
    gap: 4px;

    button {
      border: 0;
      background: none;
      padding: 2px;
      color: ${(p) => p.theme.color.brass};
      cursor: pointer;
      line-height: 0;
    }
  }

  .ok {
    color: ${(p) => p.theme.color.success};
    font-size: 14px;
  }

  .hint {
    color: ${(p) => p.theme.color.inkMuted};
    font-size: 14px;
  }
`;

function ReviewForm({ productId }) {
  const submit = useSubmitReview(productId);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');

  if (sent) {
    return <p className="ok" style={{ color: '#6E7D52', marginTop: 14 }}>✓ Отзыв отправлен на модерацию. Спасибо!</p>;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await submit.mutateAsync({ rating, title: title || undefined, body });
      setSent(true);
    } catch (e2) {
      setErr(e2?.problem?.detail || 'Не удалось отправить отзыв');
    }
  };

  return (
    <FormWrap onSubmit={onSubmit}>
      <div className="stars" role="radiogroup" aria-label="Оценка">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} из 5`}
            onClick={() => setRating(n)}
          >
            <IconStar size={22} filled={n <= rating} />
          </button>
        ))}
      </div>
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Заголовок (необязательно)"
      />
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Ваш отзыв"
        required
        rows={3}
      />
      <Button
        type="submit"
        $size="sm"
        disabled={!body || submit.isPending}
        style={{ alignSelf: 'flex-start' }}
      >
        {submit.isPending ? 'Отправка…' : 'Оставить отзыв'}
      </Button>
      {err && <FieldError>{err}</FieldError>}
    </FormWrap>
  );
}

function ProductReviews({ productId }) {
  const { user } = useAuth();
  const { data: summary } = useReviewSummary(productId);
  const { data: reviews } = useProductReviews(productId);

  if (!productId) return null;

  return (
    <Section>
      <div className="head-row">
        <h2>Отзывы</h2>
      </div>
      <Hairline style={{ margin: '14px 0 18px' }} />

      <div className="summary">
        <Rating value={summary?.average ?? 0} size={16} />
        <span className="score">{summary?.count ? summary.average.toFixed(1) : ''}</span>
        <span className="muted">
          {summary?.count ? `· ${summary.count} отзыв(ов)` : 'Пока нет отзывов'}
        </span>
      </div>

      <div className="cards">
        {(reviews ?? []).map((r) => (
          <ReviewCard key={r.id}>
            <div className="top">
              <div className="who">
                <Rating value={r.rating} size={13} />
                {r.isVerifiedPurchase && <span className="verified">✓ Проверенная покупка</span>}
              </div>
              <span className="date">{formatDate(r.createdAt)}</span>
            </div>
            {r.title && <div className="title">{r.title}</div>}
            <div className="body">{r.body}</div>
          </ReviewCard>
        ))}
      </div>

      {user ? (
        <ReviewForm productId={productId} />
      ) : (
        <p style={{ marginTop: 16, color: '#8A8175', fontSize: 14 }}>
          Войдите, чтобы оставить отзыв.
        </p>
      )}
    </Section>
  );
}

export default ProductReviews;
