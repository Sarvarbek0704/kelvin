import { type ReactNode, useState } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, ApiError } from '@/lib/api';
import { Badge, Button, Card, Input, PageHeader, Select } from '@/components/ui';
import type { CursorPage, Question, Review, ReviewStatus } from '@/lib/types';

const STATUSES: ReviewStatus[] = ['PENDING_MODERATION', 'APPROVED', 'REJECTED'];
const TONE: Record<ReviewStatus, 'amber' | 'green' | 'red'> = {
  PENDING_MODERATION: 'amber',
  APPROVED: 'green',
  REJECTED: 'red',
};

const Stars = ({ n }: { n: number }): ReactNode => (
  <span className="text-amber-500">{'★★★★★'.slice(0, n)}<span className="text-slate-300">{'★★★★★'.slice(n)}</span></span>
);

export function ReviewsPage(): ReactNode {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('PENDING_MODERATION');

  const { data, fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery({
    queryKey: ['reviews', 'admin', status],
    initialPageParam: '',
    queryFn: ({ pageParam }) => {
      const qs = new URLSearchParams({ limit: '20' });
      if (status) qs.set('status', status);
      if (pageParam) qs.set('cursor', pageParam as string);
      return api.get<CursorPage<Review>>(`/reviews/admin?${qs.toString()}`);
    },
    getNextPageParam: (last) => last.pageInfo.nextCursor ?? undefined,
  });
  const reviews = data?.pages.flatMap((p) => p.items) ?? [];

  const moderate = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
      api.post(`/reviews/${id}/${action}`),
    onSuccess: () => {
      setError(null);
      void qc.invalidateQueries({ queryKey: ['reviews'] });
    },
    onError: (e) => setError(e instanceof ApiError ? e.problem.detail : 'Xatolik'),
  });

  return (
    <div>
      <PageHeader title="Sharhlar (moderatsiya)" />
      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      <div className="mb-4 w-64">
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
      </div>

      <div className="space-y-3">
        {reviews.map((r) => (
          <Card key={r.id} className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Stars n={r.rating} />
                <Badge tone={TONE[r.status]}>{r.status}</Badge>
                {r.isVerifiedPurchase && <Badge tone="green">✓ Sotib olgan</Badge>}
              </div>
              <span className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString('ru-RU')}</span>
            </div>
            {r.title && <div className="font-medium text-slate-900">{r.title}</div>}
            <p className="mt-1 text-sm text-slate-600">{r.body}</p>
            {r.status === 'PENDING_MODERATION' && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" disabled={moderate.isPending} onClick={() => moderate.mutate({ id: r.id, action: 'approve' })}>
                  Tasdiqlash
                </Button>
                <Button size="sm" variant="danger" disabled={moderate.isPending} onClick={() => moderate.mutate({ id: r.id, action: 'reject' })}>
                  Rad etish
                </Button>
              </div>
            )}
          </Card>
        ))}
        {reviews.length === 0 && !isFetching && (
          <p className="py-8 text-center text-slate-400">Sharh yo'q</p>
        )}
      </div>

      {hasNextPage && (
        <div className="mt-4 text-center">
          <Button variant="secondary" onClick={() => void fetchNextPage()} disabled={isFetching}>Ko'proq yuklash</Button>
        </div>
      )}

      <QuestionsModeration />
    </div>
  );
}

function QuestionsModeration(): ReactNode {
  const qc = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const { data } = useQuery({
    queryKey: ['questions', 'admin'],
    queryFn: () => api.get<CursorPage<Question>>('/questions/admin?status=PENDING_MODERATION&limit=20'),
  });
  const questions = data?.items ?? [];
  const invalidate = (): void => void qc.invalidateQueries({ queryKey: ['questions'] });

  const moderate = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) => api.post(`/questions/${id}/${action}`),
    onSuccess: invalidate,
  });
  const answer = useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => api.post(`/questions/${id}/answers`, { body, isOfficial: true }),
    onSuccess: invalidate,
  });

  return (
    <div className="mt-10">
      <h2 className="mb-3 text-lg font-semibold text-slate-800">Savollar (moderatsiya)</h2>
      <div className="space-y-3">
        {questions.map((q) => (
          <Card key={q.id} className="p-4">
            <div className="font-medium text-slate-900">❓ {q.body}</div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={() => moderate.mutate({ id: q.id, action: 'approve' })}>Tasdiqlash</Button>
              <Button size="sm" variant="danger" onClick={() => moderate.mutate({ id: q.id, action: 'reject' })}>Rad etish</Button>
              <Input
                value={answers[q.id] ?? ''}
                onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
                placeholder="Rasmiy javob…"
                className="h-8 flex-1 text-sm"
              />
              <Button size="sm" variant="secondary" disabled={!answers[q.id]} onClick={() => { answer.mutate({ id: q.id, body: answers[q.id] ?? '' }); setAnswers((p) => ({ ...p, [q.id]: '' })); }}>Javob berish</Button>
            </div>
          </Card>
        ))}
        {questions.length === 0 && <p className="py-6 text-center text-slate-400">Kutilayotgan savol yo'q</p>}
      </div>
    </div>
  );
}
