import React, { useState } from 'react';
import styled from 'styled-components';
import { useProductQuestions, useAskQuestion } from '../../lib/qa';
import { useAuth } from '../../lib/auth-context';
import { Hairline, Button, Textarea, FieldError } from '../ui';

const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString('ru-RU') : '');

const Section = styled.section`
  h2 {
    font-size: 32px;
    margin: 0;
  }

  .cards {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
`;

const QaCard = styled.div`
  background: ${(p) => p.theme.color.surface};
  border: 1px solid ${(p) => p.theme.color.border};
  border-radius: 12px;
  padding: 22px;

  .q {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 8px;
    color: ${(p) => p.theme.color.ink};

    .mark {
      color: ${(p) => p.theme.color.brassDark};
    }

    .date {
      float: right;
      font-size: 13px;
      font-weight: 400;
      color: ${(p) => p.theme.color.inkMuted};
    }
  }

  .a {
    font-size: 14px;
    line-height: 1.6;
    color: ${(p) => p.theme.color.bodyText};

    .mark {
      color: ${(p) => p.theme.color.brassDark};
      font-weight: 600;
    }

    & + .a {
      margin-top: 8px;
    }
  }

  .empty-hint {
    font-size: 13px;
    color: ${(p) => p.theme.color.inkMuted};
  }
`;

const AskWrap = styled.form`
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

function AskForm({ productId }) {
  const ask = useAskQuestion(productId);
  const [body, setBody] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');

  if (sent) {
    return <p style={{ color: '#6E7D52', marginTop: 14, fontSize: 14 }}>✓ Вопрос отправлен на модерацию.</p>;
  }

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await ask.mutateAsync(body);
      setSent(true);
    } catch (e2) {
      setErr(e2?.problem?.detail || 'Не удалось отправить');
    }
  };

  return (
    <AskWrap onSubmit={submit}>
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Ваш вопрос о товаре"
        required
        rows={2}
      />
      <Button
        type="submit"
        $size="sm"
        $variant="outline"
        disabled={!body || ask.isPending}
        style={{ alignSelf: 'flex-start' }}
      >
        {ask.isPending ? 'Отправка…' : 'Задать вопрос'}
      </Button>
      {err && <FieldError>{err}</FieldError>}
    </AskWrap>
  );
}

function ProductQa({ productId }) {
  const { user } = useAuth();
  const { data: questions } = useProductQuestions(productId);
  if (!productId) return null;

  return (
    <Section>
      <h2>Вопросы и ответы</h2>
      <Hairline style={{ margin: '14px 0 18px' }} />

      <div className="cards">
        {(questions ?? []).map((q) => (
          <QaCard key={q.id}>
            <div className="q">
              <span className="date">{formatDate(q.createdAt)}</span>
              <span className="mark">В.</span> {q.body}
            </div>
            {(q.answers ?? []).map((a) => (
              <div className="a" key={a.id}>
                <span className="mark">{a.isOfficial ? 'Kelvin:' : 'О.'}</span> {a.body}
              </div>
            ))}
          </QaCard>
        ))}
        {(questions ?? []).length === 0 && (
          <QaCard>
            <div className="empty-hint">Пока нет вопросов. Задайте первый!</div>
          </QaCard>
        )}
      </div>

      {user ? (
        <AskForm productId={productId} />
      ) : (
        <p style={{ marginTop: 16, color: '#8A8175', fontSize: 14 }}>
          Войдите, чтобы задать вопрос.
        </p>
      )}
    </Section>
  );
}

export default ProductQa;
