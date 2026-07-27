import { type ReactNode, useState } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, ApiError } from '@/lib/api';
import { label } from '@/lib/i18n';
import { formatSom } from '@/lib/money';
import { Badge, Button, Card, Input, Label, PageHeader, Select } from '@/components/ui';
import type {
  CursorPage,
  POStatus,
  PurchaseOrder,
  Supplier,
  VariantLookup,
  Warehouse,
} from '@/lib/types';

const PO_TONE: Record<POStatus, 'slate' | 'green' | 'amber' | 'red'> = {
  DRAFT: 'amber',
  ORDERED: 'slate',
  RECEIVED: 'green',
  CANCELLED: 'red',
};

interface DraftLine {
  variantId: string;
  sku: string;
  name: string;
  quantityOrdered: number;
  unitCostTiyin: string;
}

const somToTiyin = (som: string): string => String(Math.round(Number(som || '0') * 100));

export function ProcurementPage(): ReactNode {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get<Supplier[]>('/procurement/suppliers'),
  });
  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => api.get<Warehouse[]>('/inventory/warehouses'),
  });
  const posQuery = useInfiniteQuery({
    queryKey: ['purchase-orders'],
    initialPageParam: '',
    queryFn: ({ pageParam }) => {
      const qs = new URLSearchParams({ limit: '20' });
      if (pageParam) qs.set('cursor', pageParam as string);
      return api.get<CursorPage<PurchaseOrder>>(`/procurement/purchase-orders?${qs.toString()}`);
    },
    getNextPageParam: (last) => last.pageInfo.nextCursor ?? undefined,
  });
  const pos = posQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const supplierName = (id: string): string => suppliers?.find((s) => s.id === id)?.name ?? id;

  const onErr = (e: unknown): void => setError(e instanceof ApiError ? e.problem.detail : 'Xatolik');
  const invalidatePOs = (): void => void qc.invalidateQueries({ queryKey: ['purchase-orders'] });

  // --- Ta'minotchi yaratish -------------------------------------------------
  const [supName, setSupName] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const createSupplier = useMutation({
    mutationFn: () =>
      api.post('/procurement/suppliers', { name: supName, ...(supPhone && { phone: supPhone }) }),
    onSuccess: () => {
      setError(null);
      setSupName('');
      setSupPhone('');
      void qc.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: onErr,
  });

  // --- Yangi PO -------------------------------------------------------------
  const [supplierId, setSupplierId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [sku, setSku] = useState('');
  const [qty, setQty] = useState('1');
  const [cost, setCost] = useState('');

  const addLine = async (): Promise<void> => {
    setError(null);
    try {
      const v = await api.get<VariantLookup>(`/products/lookup?code=${encodeURIComponent(sku.trim())}`);
      setLines((prev) => [
        ...prev,
        {
          variantId: v.variantId,
          sku: v.sku,
          name: label(v.productName),
          quantityOrdered: Number(qty) || 1,
          unitCostTiyin: somToTiyin(cost),
        },
      ]);
      setSku('');
      setQty('1');
      setCost('');
    } catch (e) {
      onErr(e);
    }
  };

  const createPO = useMutation({
    mutationFn: () =>
      api.post('/procurement/purchase-orders', {
        supplierId,
        warehouseId,
        items: lines.map((l) => ({
          variantId: l.variantId,
          quantityOrdered: l.quantityOrdered,
          unitCostAmount: l.unitCostTiyin,
        })),
      }),
    onSuccess: () => {
      setError(null);
      setLines([]);
      setSupplierId('');
      setWarehouseId('');
      invalidatePOs();
    },
    onError: onErr,
  });

  // --- PO amallari ----------------------------------------------------------
  const poAction = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'submit' | 'receive' | 'cancel' }) =>
      api.post(`/procurement/purchase-orders/${id}/${action}`),
    onSuccess: () => {
      setError(null);
      invalidatePOs();
    },
    onError: onErr,
  });

  const draftTotal = lines.reduce((s, l) => s + Number(l.unitCostTiyin) * l.quantityOrdered, 0);

  return (
    <div>
      <PageHeader title="Ta'minot" />
      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Ta'minotchilar */}
        <Card className="p-5">
          <div className="mb-3 font-medium">Ta'minotchilar</div>
          <div className="mb-4 space-y-2">
            <Input placeholder="Nomi" value={supName} onChange={(e) => setSupName(e.target.value)} />
            <Input placeholder="Telefon" value={supPhone} onChange={(e) => setSupPhone(e.target.value)} />
            <Button size="sm" disabled={!supName || createSupplier.isPending} onClick={() => createSupplier.mutate()}>
              Qo'shish
            </Button>
          </div>
          <ul className="space-y-1 text-sm">
            {(suppliers ?? []).map((s) => (
              <li key={s.id} className="flex justify-between border-b border-slate-100 py-1 last:border-0">
                <span>{s.name}</span>
                <span className="text-slate-400">{s.phone ?? '—'}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Yangi xarid buyurtmasi */}
        <Card className="p-5 lg:col-span-2">
          <div className="mb-3 font-medium">Yangi xarid buyurtmasi</div>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div>
              <Label>Ta'minotchi</Label>
              <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                <option value="">Tanlang…</option>
                {(suppliers ?? []).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Ombor</Label>
              <Select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
                <option value="">Tanlang…</option>
                {(warehouses ?? []).map((w) => (
                  <option key={w.id} value={w.id}>{w.code} — {label(w.name)}</option>
                ))}
              </Select>
            </div>
          </div>

          {/* Qator qo'shish (SKU bo'yicha) */}
          <div className="mb-3 flex flex-wrap items-end gap-2">
            <div className="w-40">
              <Label>SKU</Label>
              <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="AUR-8L-GOLD" />
            </div>
            <div className="w-20">
              <Label>Soni</Label>
              <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
            </div>
            <div className="w-32">
              <Label>Narx (so'm)</Label>
              <Input type="number" value={cost} onChange={(e) => setCost(e.target.value)} />
            </div>
            <Button size="sm" variant="secondary" disabled={!sku} onClick={() => void addLine()}>
              Qator +
            </Button>
          </div>

          {lines.length > 0 && (
            <table className="mb-3 w-full text-sm">
              <tbody>
                {lines.map((l, i) => (
                  <tr key={`${l.variantId}-${i}`} className="border-b border-slate-100">
                    <td className="py-1 font-mono text-xs">{l.sku}</td>
                    <td className="py-1">{l.name}</td>
                    <td className="py-1 text-right">{l.quantityOrdered} ×</td>
                    <td className="py-1 text-right">{formatSom(l.unitCostTiyin)}</td>
                    <td className="py-1 text-right">
                      <button
                        onClick={() => setLines((prev) => prev.filter((_, j) => j !== i))}
                        className="text-slate-400 hover:text-red-600"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Jami: {formatSom(String(draftTotal))}</span>
            <Button
              disabled={!supplierId || !warehouseId || lines.length === 0 || createPO.isPending}
              onClick={() => createPO.mutate()}
            >
              Buyurtma yaratish
            </Button>
          </div>
        </Card>
      </div>

      {/* Xarid buyurtmalari ro'yxati */}
      <Card className="mt-6 overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3 font-medium">Xarid buyurtmalari</div>
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Raqam</th>
              <th className="px-4 py-3 font-medium">Ta'minotchi</th>
              <th className="px-4 py-3 font-medium">Holat</th>
              <th className="px-4 py-3 text-right font-medium">Summa</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {pos.map((po) => (
              <tr key={po.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-medium">{po.number}</td>
                <td className="px-4 py-3 text-slate-600">{supplierName(po.supplierId)}</td>
                <td className="px-4 py-3">
                  <Badge tone={PO_TONE[po.status]}>{po.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right">{formatSom(po.totalAmount)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    {po.status === 'DRAFT' && (
                      <Button size="sm" variant="secondary" disabled={poAction.isPending} onClick={() => poAction.mutate({ id: po.id, action: 'submit' })}>
                        Buyurtma berish
                      </Button>
                    )}
                    {po.status === 'ORDERED' && (
                      <Button size="sm" disabled={poAction.isPending} onClick={() => poAction.mutate({ id: po.id, action: 'receive' })}>
                        Qabul qilish
                      </Button>
                    )}
                    {(po.status === 'DRAFT' || po.status === 'ORDERED') && (
                      <Button size="sm" variant="ghost" disabled={poAction.isPending} onClick={() => poAction.mutate({ id: po.id, action: 'cancel' })}>
                        Bekor
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {pos.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Xarid buyurtmasi yo'q
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {posQuery.hasNextPage && (
        <div className="mt-4 text-center">
          <Button variant="secondary" onClick={() => void posQuery.fetchNextPage()} disabled={posQuery.isFetching}>
            Ko'proq yuklash
          </Button>
        </div>
      )}
    </div>
  );
}
