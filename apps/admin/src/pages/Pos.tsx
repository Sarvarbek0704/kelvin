import { type ReactNode, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, ApiError } from '@/lib/api';
import { label } from '@/lib/i18n';
import { formatSom } from '@/lib/money';
import { Badge, Button, Card, Input, Label, PageHeader, Select } from '@/components/ui';
import type { PosShift, PosTx, VariantLookup } from '@/lib/types';

const somToTiyin = (som: string): string => String(Math.round(Number(som || '0') * 100));

interface Line { variantId: string; sku: string; name: string; quantity: number }

export function PosPage(): ReactNode {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: shift } = useQuery({
    queryKey: ['pos', 'shift'],
    queryFn: () => api.get<PosShift | null>('/pos/shifts/current'),
  });
  const { data: txs } = useQuery({
    queryKey: ['pos', 'txs', shift?.id],
    queryFn: () => api.get<PosTx[]>(`/pos/transactions?shiftId=${shift?.id ?? ''}`),
    enabled: Boolean(shift?.id),
  });

  const onErr = (e: unknown): void => setError(e instanceof ApiError ? e.problem.detail : 'Xatolik');
  const invalidate = (): void => void qc.invalidateQueries({ queryKey: ['pos'] });

  const [openingCash, setOpeningCash] = useState('');
  const openShift = useMutation({
    mutationFn: () => api.post('/pos/shifts', { openingCashAmount: somToTiyin(openingCash) }),
    onSuccess: () => { setError(null); setOpeningCash(''); invalidate(); },
    onError: onErr,
  });

  const [closingCash, setClosingCash] = useState('');
  const closeShift = useMutation({
    mutationFn: () => api.post(`/pos/shifts/${shift?.id}/close`, { closingCashAmount: somToTiyin(closingCash) }),
    onSuccess: () => { setError(null); setClosingCash(''); invalidate(); },
    onError: onErr,
  });

  const [lines, setLines] = useState<Line[]>([]);
  const [sku, setSku] = useState('');
  const [qty, setQty] = useState('1');
  const [method, setMethod] = useState<'CASH' | 'CARD'>('CASH');

  const addLine = async (): Promise<void> => {
    setError(null);
    try {
      const v = await api.get<VariantLookup>(`/products/lookup?code=${encodeURIComponent(sku.trim())}`);
      setLines((p) => [...p, { variantId: v.variantId, sku: v.sku, name: label(v.productName), quantity: Number(qty) || 1 }]);
      setSku(''); setQty('1');
    } catch (e) { onErr(e); }
  };

  const sale = useMutation({
    mutationFn: () => api.post<PosTx>('/pos/transactions', { paymentMethod: method, items: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })) }),
    onSuccess: () => { setError(null); setLines([]); invalidate(); },
    onError: onErr,
  });

  return (
    <div>
      <PageHeader title="Kassa (POS)" />
      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      {!shift ? (
        <Card className="max-w-sm space-y-3 p-5">
          <div className="font-medium">Smena yopiq</div>
          <div>
            <Label>Boshlang'ich kassa (so'm)</Label>
            <Input type="number" value={openingCash} onChange={(e) => setOpeningCash(e.target.value)} />
          </div>
          <Button disabled={openShift.isPending} onClick={() => openShift.mutate()}>Smena ochish</Button>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Sotuv */}
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-medium">Yangi sotuv</span>
              <Badge tone="green">Smena OCHIQ</Badge>
            </div>
            <div className="mb-3 flex flex-wrap items-end gap-2">
              <div className="w-40"><Label>SKU</Label><Input value={sku} onChange={(e) => setSku(e.target.value)} /></div>
              <div className="w-20"><Label>Soni</Label><Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} /></div>
              <Button size="sm" variant="secondary" disabled={!sku} onClick={() => void addLine()}>Qator +</Button>
            </div>
            {lines.length > 0 && (
              <table className="mb-3 w-full text-sm">
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={`${l.variantId}-${i}`} className="border-b border-slate-100">
                      <td className="py-1 font-mono text-xs">{l.sku}</td>
                      <td className="py-1">{l.name}</td>
                      <td className="py-1 text-right">{l.quantity} ×</td>
                      <td className="py-1 text-right">
                        <button onClick={() => setLines((p) => p.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-600">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="flex items-center gap-3">
              <Select value={method} onChange={(e) => setMethod(e.target.value as 'CASH' | 'CARD')} className="w-32">
                <option value="CASH">Naqd</option>
                <option value="CARD">Karta</option>
              </Select>
              <Button disabled={lines.length === 0 || sale.isPending} onClick={() => sale.mutate()}>Sotish</Button>
            </div>
          </Card>

          {/* Smena + tranzaksiyalar */}
          <Card className="p-5">
            <div className="mb-3 font-medium">Smena</div>
            <p className="text-sm text-slate-500">Ochilish kassasi: {formatSom(shift.openingCashAmount)}</p>
            <p className="mb-3 text-sm text-slate-500">Sotuvlar: {txs?.length ?? 0}</p>
            <div className="mb-4 max-h-48 overflow-auto">
              {(txs ?? []).map((t) => (
                <div key={t.id} className="flex justify-between border-b border-slate-100 py-1 text-sm">
                  <span className="font-mono text-xs">{t.number}</span>
                  <span>{t.paymentMethod === 'CARD' ? '💳' : '💵'} {formatSom(t.totalAmount)}</span>
                </div>
              ))}
            </div>
            <div className="flex items-end gap-2 border-t border-slate-100 pt-3">
              <div className="flex-1"><Label>Yopilish kassasi (so'm)</Label><Input type="number" value={closingCash} onChange={(e) => setClosingCash(e.target.value)} /></div>
              <Button variant="danger" disabled={!closingCash || closeShift.isPending} onClick={() => closeShift.mutate()}>Smenani yopish</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
