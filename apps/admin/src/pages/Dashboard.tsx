import { type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { formatSom } from '@/lib/money';
import { Badge, Card, PageHeader } from '@/components/ui';
import type { Attribute, Category } from '@/lib/types';

interface OrderStats {
  total: number;
  byStatus: Record<string, number>;
}
interface Revenue {
  paidTotal: string;
  refundedTotal: string;
  net: string;
}
interface InvStats {
  totalItems: number;
  lowStock: number;
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: ReactNode;
  tone?: 'default' | 'red' | 'green';
}): ReactNode {
  return (
    <Card className="p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div
        className={
          'mt-1 text-3xl font-bold ' +
          (tone === 'red' ? 'text-red-600' : tone === 'green' ? 'text-green-600' : 'text-slate-900')
        }
      >
        {value}
      </div>
    </Card>
  );
}

// Buyurtma holatlarining ko'rsatiladigan tartibi (fulfillment oqimi bo'yicha).
const STATUS_ORDER = [
  'DRAFT',
  'PENDING_PAYMENT',
  'CONFIRMED',
  'PACKED',
  'SHIPPED',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
];

export function DashboardPage(): ReactNode {
  const user = useAuth((s) => s.user);

  const orderStats = useQuery({
    queryKey: ['order-stats'],
    queryFn: () => api.get<OrderStats>('/orders/admin/stats'),
  });
  const revenue = useQuery({
    queryKey: ['revenue-stats'],
    queryFn: () => api.get<Revenue>('/payments/admin/stats'),
  });
  const invStats = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: () => api.get<InvStats>('/inventory/stats'),
  });
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/categories'),
  });
  const attributes = useQuery({
    queryKey: ['attributes'],
    queryFn: () => api.get<Attribute[]>('/attributes'),
  });

  const countTree = (nodes: Category[] | undefined): number =>
    (nodes ?? []).reduce((n, c) => n + 1 + countTree(c.children), 0);

  const byStatus = orderStats.data?.byStatus ?? {};
  const shownStatuses = STATUS_ORDER.filter((s) => (byStatus[s] ?? 0) > 0);

  return (
    <div>
      <PageHeader title="Boshqaruv paneli" />
      <p className="mb-6 text-slate-500">
        Xush kelibsiz. Rollaringiz: <b>{user?.roles.join(', ')}</b>
      </p>

      {/* Operatsion metrikalar */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Buyurtmalar (jami)" value={orderStats.data?.total ?? '—'} />
        <Stat
          label="Sof tushum"
          value={revenue.data ? formatSom(revenue.data.net) : '—'}
          tone="green"
        />
        <Stat
          label="Kam qoldiq"
          value={invStats.data?.lowStock ?? '—'}
          tone={invStats.data && invStats.data.lowStock > 0 ? 'red' : 'default'}
        />
      </div>

      {/* Buyurtma holatlari */}
      {shownStatuses.length > 0 && (
        <Card className="mb-6 p-5">
          <div className="mb-3 text-sm font-medium text-slate-700">Buyurtmalar holati bo'yicha</div>
          <div className="flex flex-wrap gap-3">
            {shownStatuses.map((s) => (
              <div key={s} className="flex items-center gap-2">
                <Badge
                  tone={
                    s === 'CANCELLED'
                      ? 'red'
                      : s === 'DELIVERED' || s === 'COMPLETED'
                        ? 'green'
                        : 'slate'
                  }
                >
                  {s}
                </Badge>
                <span className="text-sm font-semibold text-slate-900">{byStatus[s]}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Katalog (ikkilamchi) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Kategoriyalar" value={countTree(categories.data)} />
        <Stat label="Atributlar" value={attributes.data?.length ?? '—'} />
        <Stat label="Qoldiq yozuvlari" value={invStats.data?.totalItems ?? '—'} />
      </div>
    </div>
  );
}
