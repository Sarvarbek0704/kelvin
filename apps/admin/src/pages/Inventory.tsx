import { Fragment, type ReactNode, useState } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, ApiError } from '@/lib/api';
import { label } from '@/lib/i18n';
import { Badge, Button, Card, Input, Label, PageHeader, Select } from '@/components/ui';
import type { CursorPage, StockRow, VariantLookup, Warehouse } from '@/lib/types';

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

      <ReceiptForm onError={setError} />

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

/**
 * Kirim (receipt) — omborga tovar qabul qilish. SKU bo'yicha variant topiladi
 * (Procurement naqshi), so'ng POST /inventory/receipts (on_hand += qty + ledger).
 */
function ReceiptForm({ onError }: { onError: (msg: string | null) => void }): ReactNode {
  const qc = useQueryClient();
  const [sku, setSku] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [qty, setQty] = useState('1');
  const [note, setNote] = useState('');
  const [ok, setOk] = useState<string | null>(null);

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => api.get<Warehouse[]>('/inventory/warehouses'),
  });

  const receive = useMutation({
    mutationFn: async () => {
      const v = await api.get<VariantLookup>(
        `/products/lookup?code=${encodeURIComponent(sku.trim())}`,
      );
      await api.post('/inventory/receipts', {
        variantId: v.variantId,
        warehouseId,
        quantity: Number(qty),
        ...(note.trim() && { note: note.trim() }),
      });
      return v;
    },
    onSuccess: (v) => {
      onError(null);
      setOk(`Kirim qabul qilindi: ${v.sku} × ${qty}`);
      setSku('');
      setQty('1');
      setNote('');
      void qc.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (e) => {
      setOk(null);
      onError(e instanceof ApiError ? e.problem.detail : 'Xatolik');
    },
  });

  const qtyNum = Number(qty);
  return (
    <Card className="mb-6 p-5">
      <div className="mb-3 font-medium">Kirim (receipt)</div>
      {ok !== null && (
        <div className="mb-3 rounded-md bg-green-50 px-4 py-2 text-sm text-green-700">{ok}</div>
      )}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-44">
          <Label>SKU</Label>
          <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="AUR-8L-GOLD" />
        </div>
        <div className="w-56">
          <Label>Ombor</Label>
          <Select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
            <option value="">Tanlang…</option>
            {(warehouses ?? []).map((w) => (
              <option key={w.id} value={w.id}>
                {w.code} — {label(w.name)}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-24">
          <Label>Soni</Label>
          <Input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} />
        </div>
        <div className="w-64">
          <Label>Izoh (ixtiyoriy)</Label>
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="hujjat №…" />
        </div>
        <Button
          disabled={!sku.trim() || !warehouseId || !Number.isInteger(qtyNum) || qtyNum < 1 || receive.isPending}
          onClick={() => receive.mutate()}
        >
          Qabul qilish
        </Button>
      </div>
    </Card>
  );
}
