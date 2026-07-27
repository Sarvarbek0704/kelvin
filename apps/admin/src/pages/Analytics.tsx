import { type ReactNode, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { formatSom } from '@/lib/money';
import { Badge, Button, Card, Input, PageHeader } from '@/components/ui';

interface Summary { orderCount: number; totalRevenue: string; averageOrderValue: string }
interface AbcRow { productId: string; unitsSold: number; revenue: string; abcClass: 'A' | 'B' | 'C' }
interface Segment { id: string; code: string; name: unknown; kind: string; _count: { members: number } }

function Stat({ label, value }: { label: string; value: ReactNode }): ReactNode {
  return (
    <Card className="p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
    </Card>
  );
}

const ABC_TONE = { A: 'green', B: 'amber', C: 'slate' } as const;

export function AnalyticsPage(): ReactNode {
  const qc = useQueryClient();
  const { data: summary } = useQuery({ queryKey: ['analytics', 'summary'], queryFn: () => api.get<Summary>('/analytics/summary') });
  const { data: abc } = useQuery({ queryKey: ['analytics', 'abc'], queryFn: () => api.get<AbcRow[]>('/analytics/abc') });
  const { data: segments } = useQuery({ queryKey: ['segments'], queryFn: () => api.get<Segment[]>('/segments') });

  const recompute = useMutation({
    mutationFn: () => api.post('/segments/rfm/recompute'),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['segments'] }),
    onError: (e) => alert(e instanceof ApiError ? e.problem.detail : 'Xatolik'),
  });

  const [segCode, setSegCode] = useState('');
  const [segName, setSegName] = useState('');
  const createSeg = useMutation({
    mutationFn: () => api.post('/segments', { code: segCode, name: { 'uz-Latn': segName, ru: segName } }),
    onSuccess: () => { setSegCode(''); setSegName(''); void qc.invalidateQueries({ queryKey: ['segments'] }); },
    onError: (e) => alert(e instanceof ApiError ? e.problem.detail : 'Xatolik'),
  });

  // ⚠️ CSV — Bearer token header'da, shuning uchun fetch+blob (oddiy <a href> emas).
  const downloadCsv = async (path: string, filename: string): Promise<void> => {
    const token = useAuth.getState().accessToken;
    const res = await fetch(`/api/v1${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: 'include' });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title="Analitika"
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => void downloadCsv('/analytics/sales.csv', 'sales-summary.csv')}>Sotuv CSV</Button>
            <Button size="sm" variant="secondary" onClick={() => void downloadCsv('/analytics/abc.csv', 'abc-report.csv')}>ABC CSV</Button>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Buyurtmalar" value={summary?.orderCount ?? '—'} />
        <Stat label="Aylanma" value={summary ? formatSom(summary.totalRevenue) : '—'} />
        <Stat label="O'rtacha chek" value={summary ? formatSom(summary.averageOrderValue) : '—'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ABC tahlil */}
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-3 font-medium">ABC tahlil (aylanma bo'yicha)</div>
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Mahsulot</th>
                <th className="px-4 py-2 text-right font-medium">Sotildi</th>
                <th className="px-4 py-2 text-right font-medium">Aylanma</th>
                <th className="px-4 py-2 text-center font-medium">Sinf</th>
              </tr>
            </thead>
            <tbody>
              {(abc ?? []).map((r) => (
                <tr key={r.productId} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2 font-mono text-xs text-slate-500">{r.productId.slice(0, 8)}…</td>
                  <td className="px-4 py-2 text-right">{r.unitsSold}</td>
                  <td className="px-4 py-2 text-right">{formatSom(r.revenue)}</td>
                  <td className="px-4 py-2 text-center"><Badge tone={ABC_TONE[r.abcClass]}>{r.abcClass}</Badge></td>
                </tr>
              ))}
              {(abc ?? []).length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Sotuv ma'lumoti yo'q</td></tr>}
            </tbody>
          </table>
        </Card>

        {/* Segmentlar + RFM */}
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-medium">Mijoz segmentlari</span>
            <Button size="sm" disabled={recompute.isPending} onClick={() => recompute.mutate()}>RFM qayta hisoblash</Button>
          </div>
          <ul className="space-y-1 text-sm">
            {(segments ?? []).map((s) => (
              <li key={s.id} className="flex justify-between border-b border-slate-100 py-2 last:border-0">
                <span>{s.code} <Badge tone="slate">{s.kind}</Badge></span>
                <span className="text-slate-500">{s._count.members} a'zo</span>
              </li>
            ))}
            {(segments ?? []).length === 0 && <li className="py-4 text-center text-slate-400">Segment yo'q — RFM hisoblang</li>}
          </ul>
          <div className="mt-3 flex items-end gap-2 border-t border-slate-100 pt-3">
            <div className="w-28"><Input value={segCode} onChange={(e) => setSegCode(e.target.value.toLowerCase())} placeholder="vip" className="h-8 text-sm" /></div>
            <div className="flex-1"><Input value={segName} onChange={(e) => setSegName(e.target.value)} placeholder="Segment nomi" className="h-8 text-sm" /></div>
            <Button size="sm" variant="secondary" disabled={!segCode || !segName || createSeg.isPending} onClick={() => createSeg.mutate()}>Qo'shish</Button>
          </div>
          <p className="mt-3 text-xs text-slate-400">⚠️ RFM/ABC mazmunli natijasi bir necha oy real sotuv ma'lumotini talab qiladi (docs/10 §9.7).</p>
        </Card>
      </div>
    </div>
  );
}
