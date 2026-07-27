import { type ReactNode, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { api } from '@/lib/api';
import { formatSom } from '@/lib/money';
import { Badge, Button, Card, PageHeader, Select } from '@/components/ui';
import type { AdminOrder, CursorPage, OrderStatus } from '@/lib/types';

const STATUS_TONE: Record<OrderStatus, 'slate' | 'green' | 'amber' | 'red'> = {
  DRAFT: 'amber',
  PENDING_PAYMENT: 'amber',
  PAYMENT_FAILED: 'red',
  PAID: 'green',
  CONFIRMED: 'green',
  PICKING: 'slate',
  PACKED: 'slate',
  SHIPPED: 'slate',
  DELIVERED: 'green',
  COMPLETED: 'green',
  CANCELLED: 'red',
  RETURNED: 'red',
  PARTIALLY_RETURNED: 'amber',
};

const STATUSES: OrderStatus[] = [
  'DRAFT',
  'PENDING_PAYMENT',
  'PAYMENT_FAILED',
  'PAID',
  'CONFIRMED',
  'PICKING',
  'PACKED',
  'SHIPPED',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
  'RETURNED',
  'PARTIALLY_RETURNED',
];

export function OrdersPage(): ReactNode {
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>('');

  const { data, fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery({
    queryKey: ['orders', 'admin', status],
    initialPageParam: '',
    queryFn: ({ pageParam }) => {
      const qs = new URLSearchParams({ limit: '20' });
      if (status) qs.set('status', status);
      if (pageParam) qs.set('cursor', pageParam as string);
      return api.get<CursorPage<AdminOrder>>(`/orders/admin?${qs.toString()}`);
    },
    getNextPageParam: (last) => last.pageInfo.nextCursor ?? undefined,
  });

  const orders = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div>
      <PageHeader title="Buyurtmalar" />

      <div className="mb-4 w-64">
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Barcha holatlar</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Raqam</th>
              <th className="px-4 py-3 font-medium">Holat</th>
              <th className="px-4 py-3 font-medium">Kanal</th>
              <th className="px-4 py-3 text-right font-medium">Summa</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr
                key={o.id}
                onClick={() => navigate(`/orders/${o.id}`)}
                className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50"
              >
                <td className="px-4 py-3 font-medium text-slate-900">{o.number}</td>
                <td className="px-4 py-3">
                  <Badge tone={STATUS_TONE[o.status]}>{o.status}</Badge>
                </td>
                <td className="px-4 py-3 text-slate-600">{o.channel ?? '—'}</td>
                <td className="px-4 py-3 text-right font-medium">{formatSom(o.totalAmount)}</td>
              </tr>
            ))}
            {orders.length === 0 && !isFetching && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  Buyurtma yo'q
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {hasNextPage && (
        <div className="mt-4 text-center">
          <Button variant="secondary" onClick={() => void fetchNextPage()} disabled={isFetching}>
            Ko'proq yuklash
          </Button>
        </div>
      )}
    </div>
  );
}
