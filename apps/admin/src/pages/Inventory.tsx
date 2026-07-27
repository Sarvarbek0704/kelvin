import { Fragment, type ReactNode, useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { api, ApiError } from '@/lib/api';
import { label } from '@/lib/i18n';
import { Badge, Button, Card, Input, Label, PageHeader } from '@/components/ui';
import type { CursorPage, StockRow } from '@/lib/types';

export function InventoryPage(): ReactNode {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [adjustFor, setAdjustFor] = useState<string | null>(null);
  const [physicalCount, setPhysicalCount] = useState('');
  const [reason, setReason] = useState('');

  const { data, fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery({
    queryKey: ['inventory', 'stock'],
    initialPageParam: '',
    queryFn: ({ pageParam }) => {
      const qs = new URLSearchParams({ limit: '30' });
      if (pageParam) qs.set('cursor', pageParam as string);
      return api.get<CursorPage<StockRow>>(`/inventory/stock?${qs.toString()}`);
    },
    getNextPageParam: (last) => last.pageInfo.nextCursor ?? undefined,
  });

  const rows = data?.pages.flatMap((p) => p.items) ?? [];
  const key = (r: StockRow): string => `${r.variantId}:${r.warehouseId}`;

  const adjust = useMutation({
    mutationFn: (r: StockRow) =>
      api.post('/inventory/adjustments', {
        variantId: r.variantId,
        warehouseId: r.warehouseId,
        physicalCount: Number(physicalCount),
        reason: reason || 'inventarizatsiya',
      }),
    onSuccess: () => {
      setError(null);
      setAdjustFor(null);
      setReason('');
      void qc.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (e) => setError(e instanceof ApiError ? e.problem.detail : 'Xatolik'),
  });

  return (
    <div>
      <PageHeader title="Ombor" />
      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
      )}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Mahsulot</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Ombor</th>
              <th className="px-4 py-3 text-right font-medium">Bor</th>
              <th className="px-4 py-3 text-right font-medium">Band</th>
              <th className="px-4 py-3 text-right font-medium">Sotuvda</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const low = r.reorderPoint !== null && r.available <= r.reorderPoint;
              return (
                <Fragment key={key(r)}>
                  <tr className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 text-slate-800">{label(r.productName)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.sku}</td>
                    <td className="px-4 py-3 text-slate-600">{r.warehouseCode}</td>
                    <td className="px-4 py-3 text-right">{r.onHand}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{r.reserved}</td>
                    <td className="px-4 py-3 text-right">
                      {low ? (
                        <Badge tone="red">{r.available}</Badge>
                      ) : (
                        <span className="font-medium">{r.available}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setAdjustFor(adjustFor === key(r) ? null : key(r));
                          setPhysicalCount(String(r.onHand));
                        }}
                      >
                        Sanoq
                      </Button>
                    </td>
                  </tr>
                  {adjustFor === key(r) && (
                    <tr className="bg-slate-50">
                      <td colSpan={7} className="px-4 py-3">
                        <div className="flex flex-wrap items-end gap-3">
                          <div className="w-40">
                            <Label>Fizik sanoq</Label>
                            <Input
                              type="number"
                              value={physicalCount}
                              onChange={(e) => setPhysicalCount(e.target.value)}
                            />
                          </div>
                          <div className="w-64">
                            <Label>Sabab</Label>
                            <Input
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                              placeholder="shrinkage, buzilgan…"
                            />
                          </div>
                          <Button disabled={adjust.isPending} onClick={() => adjust.mutate(r)}>
                            Tuzatish
                          </Button>
                        </div>
                        <p className="mt-2 text-xs text-slate-400">
                          ⚠️ Farq (sanoq − bor) ADJUSTMENT sifatida yoziladi; sanoq paytida
                          sotuv yo'qolmaydi (delta).
                        </p>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {rows.length === 0 && !isFetching && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  Qoldiq yo'q
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
