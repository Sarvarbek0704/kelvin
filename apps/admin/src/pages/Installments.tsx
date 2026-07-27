import { type ReactNode, useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { api, ApiError } from '@/lib/api';
import { formatSom } from '@/lib/money';
import { Badge, Button, Card, Input, Label, PageHeader } from '@/components/ui';
import type { CursorPage, InstallmentPlan } from '@/lib/types';

const somToTiyin = (som: string): string => String(Math.round(Number(som || '0') * 100));

export function InstallmentsPage(): ReactNode {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ orderId: '', termMonths: '3', interestPct: '0', downPayment: '', firstDueDate: '' });
  const set = (k: keyof typeof form, v: string): void => setForm((f) => ({ ...f, [k]: v }));

  const { data, fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery({
    queryKey: ['installments'],
    initialPageParam: '',
    queryFn: ({ pageParam }) => {
      const qs = new URLSearchParams({ limit: '20' });
      if (pageParam) qs.set('cursor', pageParam as string);
      return api.get<CursorPage<InstallmentPlan>>(`/installments?${qs.toString()}`);
    },
    getNextPageParam: (last) => last.pageInfo.nextCursor ?? undefined,
  });
  const plans = data?.pages.flatMap((p) => p.items) ?? [];

  const onErr = (e: unknown): void => setError(e instanceof ApiError ? e.problem.detail : 'Xatolik');
  const invalidate = (): void => void qc.invalidateQueries({ queryKey: ['installments'] });

  const create = useMutation({
    mutationFn: () =>
      api.post('/installments', {
        orderId: form.orderId,
        termMonths: Number(form.termMonths),
        interestRateBp: Math.round(Number(form.interestPct || '0') * 100),
        ...(form.downPayment && { downPaymentAmount: somToTiyin(form.downPayment) }),
        firstDueDate: form.firstDueDate,
      }),
    onSuccess: () => {
      setError(null);
      setOpen(false);
      setForm({ orderId: '', termMonths: '3', interestPct: '0', downPayment: '', firstDueDate: '' });
      invalidate();
    },
    onError: onErr,
  });

  const pay = useMutation({
    mutationFn: ({ scheduleId, amount }: { scheduleId: string; amount: string }) =>
      api.post(`/installments/schedule/${scheduleId}/pay`, { amount }),
    onSuccess: () => {
      setError(null);
      invalidate();
    },
    onError: onErr,
  });

  return (
    <div>
      <PageHeader
        title="Rassrochka"
        action={<Button onClick={() => setOpen((o) => !o)}>{open ? 'Yopish' : 'Yangi reja'}</Button>}
      />
      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      {open && (
        <Card className="mb-6 space-y-3 p-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Buyurtma ID (CONFIRMED)</Label>
              <Input value={form.orderId} onChange={(e) => set('orderId', e.target.value)} placeholder="uuid" />
            </div>
            <div>
              <Label>Boshlang'ich sana</Label>
              <Input type="date" value={form.firstDueDate} onChange={(e) => set('firstDueDate', e.target.value)} />
            </div>
            <div>
              <Label>Muddat (oy)</Label>
              <Input type="number" value={form.termMonths} onChange={(e) => set('termMonths', e.target.value)} />
            </div>
            <div>
              <Label>Foiz (%)</Label>
              <Input type="number" value={form.interestPct} onChange={(e) => set('interestPct', e.target.value)} />
            </div>
            <div>
              <Label>Boshlang'ich badal (so'm)</Label>
              <Input type="number" value={form.downPayment} onChange={(e) => set('downPayment', e.target.value)} />
            </div>
          </div>
          <Button disabled={!form.orderId || !form.firstDueDate || create.isPending} onClick={() => create.mutate()}>
            Reja yaratish
          </Button>
        </Card>
      )}

      <div className="space-y-4">
        {plans.map((p) => (
          <Card key={p.id} className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-slate-500">{p.orderId.slice(0, 8)}…</span>
                <Badge tone={p.status === 'PAID' ? 'green' : 'amber'}>{p.status}</Badge>
                <span className="text-sm text-slate-500">{p.termMonths} oy · {p.interestRateBp / 100}%</span>
              </div>
              <span className="font-semibold">{formatSom(p.totalPayableAmount)}</span>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {p.schedule.map((s) => {
                  const remaining = BigInt(s.amount) - BigInt(s.paidAmount);
                  return (
                    <tr key={s.id} className="border-t border-slate-100">
                      <td className="py-2">#{s.installmentNumber}</td>
                      <td className="py-2 text-slate-500">{s.dueDate}</td>
                      <td className="py-2 text-right">{formatSom(s.amount)}</td>
                      <td className="py-2 text-right">
                        <Badge tone={s.status === 'PAID' ? 'green' : 'slate'}>{s.status}</Badge>
                      </td>
                      <td className="py-2 text-right">
                        {s.status !== 'PAID' && (
                          <Button size="sm" disabled={pay.isPending} onClick={() => pay.mutate({ scheduleId: s.id, amount: remaining.toString() })}>
                            To'lash ({formatSom(remaining.toString())})
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        ))}
        {plans.length === 0 && !isFetching && <p className="py-8 text-center text-slate-400">Rassrochka rejasi yo'q</p>}
      </div>

      {hasNextPage && (
        <div className="mt-4 text-center">
          <Button variant="secondary" onClick={() => void fetchNextPage()} disabled={isFetching}>Ko'proq yuklash</Button>
        </div>
      )}
    </div>
  );
}
