import { type ReactNode, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Rocket, Wand2 } from 'lucide-react';

import { api, ApiError } from '@/lib/api';
import { label } from '@/lib/i18n';
import { formatSom } from '@/lib/money';
import { Badge, Button, Card, Input, PageHeader } from '@/components/ui';
import type { Attribute, Product, VariantPrice } from '@/lib/types';

export function ProductDetailPage(): ReactNode {
  const { id = '' } = useParams();
  const qc = useQueryClient();

  const { data: product } = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.get<Product>(`/products/admin/${id}`),
  });
  const { data: attributes } = useQuery({
    queryKey: ['attributes'],
    queryFn: () => api.get<Attribute[]>('/attributes'),
  });

  const axisAttrs = useMemo(() => (attributes ?? []).filter((a) => a.isVariantAxis), [attributes]);

  // Tanlangan o'q qiymatlari: { attributeCode: Set<valueCode> }
  const [selected, setSelected] = useState<Record<string, Set<string>>>({});
  const [error, setError] = useState<string | null>(null);

  const toggle = (attrCode: string, valueCode: string): void => {
    setSelected((prev) => {
      const set = new Set(prev[attrCode] ?? []);
      if (set.has(valueCode)) set.delete(valueCode);
      else set.add(valueCode);
      return { ...prev, [attrCode]: set };
    });
  };

  const axes = Object.entries(selected)
    .filter(([, set]) => set.size > 0)
    .map(([attributeCode, set]) => ({ attributeCode, valueCodes: [...set] }));

  const previewCount = axes.reduce((n, a) => n * a.valueCodes.length, axes.length > 0 ? 1 : 0);

  const generate = useMutation({
    mutationFn: () => api.post<Product>(`/products/${id}/variants/generate`, { axes }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['product', id] });
      setError(null);
    },
    onError: (e) => setError(e instanceof ApiError ? e.problem.detail : 'Xatolik'),
  });

  const publish = useMutation({
    mutationFn: () => api.post<Product>(`/products/${id}/publish`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['product', id] }),
    onError: (e) => setError(e instanceof ApiError ? e.problem.detail : 'Xatolik'),
  });

  if (!product) {
    return <div className="text-slate-400">Yuklanmoqda…</div>;
  }

  const variants = product.variants ?? [];

  return (
    <div>
      <PageHeader
        title={label(product.name)}
        action={
          <div className="flex items-center gap-3">
            <Badge tone={product.status === 'ACTIVE' ? 'green' : 'amber'}>{product.status}</Badge>
            <Button
              variant="primary"
              disabled={variants.length === 0 || publish.isPending || product.status === 'ACTIVE'}
              onClick={() => publish.mutate()}
            >
              <Rocket className="h-4 w-4" /> Nashr qilish
            </Button>
          </div>
        }
      />
      <p className="mb-6 font-mono text-sm text-slate-400">{product.slug}</p>

      {error !== null && (
        <Card className="mb-6 border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</Card>
      )}

      {/* --- Variant matritsa generatori --- */}
      <Card className="mb-6 p-6">
        <h2 className="mb-1 text-lg font-semibold">Variant matritsasi</h2>
        <p className="mb-4 text-sm text-slate-500">
          O‘qlar va qiymatlarni tanlang — tizim dekart ko‘paytmasini generatsiya qiladi. Mavjud
          variantlar tegilmaydi (destruktiv emas).
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {axisAttrs.map((attr) => (
            <div key={attr.id} className="rounded-lg border border-slate-200 p-4">
              <div className="mb-2 font-medium">{label(attr.name)}</div>
              <div className="space-y-1.5">
                {attr.values.map((v) => (
                  <label key={v.id} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selected[attr.code]?.has(v.code) ?? false}
                      onChange={() => toggle(attr.code, v.code)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    {v.hexColor !== null && (
                      <span
                        className="inline-block h-3 w-3 rounded-full border border-slate-300"
                        style={{ background: v.hexColor }}
                      />
                    )}
                    {label(v.label)} <span className="text-slate-400">({v.code})</span>
                  </label>
                ))}
                {attr.values.length === 0 && (
                  <span className="text-xs text-slate-400">Qiymatlar yo‘q</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-4">
          <Button
            disabled={previewCount === 0 || generate.isPending}
            onClick={() => generate.mutate()}
          >
            <Wand2 className="h-4 w-4" />
            {generate.isPending ? 'Generatsiya…' : `${previewCount} SKU generatsiya qilish`}
          </Button>
          {previewCount > 0 && (
            <span className="text-sm text-slate-500">
              {axes.map((a) => `${a.attributeCode}×${a.valueCodes.length}`).join(' · ')} ={' '}
              <b>{previewCount}</b> kombinatsiya
            </span>
          )}
        </div>
      </Card>

      {/* --- Variantlar jadvali --- */}
      <Card>
        <div className="border-b border-slate-200 p-4 font-medium">
          Variantlar (SKU) — {variants.length} ta
        </div>
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-slate-500">
            <tr>
              <th className="p-4 font-medium">SKU</th>
              <th className="p-4 font-medium">O‘q qiymatlari</th>
              <th className="p-4 font-medium">IP</th>
              <th className="p-4 font-medium">Tsokol</th>
              <th className="p-4 font-medium">Narx (RETAIL)</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((v) => (
              <tr key={v.id} className="border-b border-slate-100 last:border-0">
                <td className="p-4 font-mono text-xs">{v.sku}</td>
                <td className="p-4 text-slate-500">
                  {Object.entries(v.axisValues)
                    .map(([k, val]) => `${k}: ${val}`)
                    .join(', ')}
                </td>
                <td className="p-4">{v.ipRating ?? '—'}</td>
                <td className="p-4">{v.socketType ?? '—'}</td>
                <td className="p-4">
                  <VariantPriceCell variantId={v.id} />
                </td>
              </tr>
            ))}
            {variants.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  Hali variant yo‘q. Yuqorida o‘qlarni tanlab generatsiya qiling.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/**
 * Variant narxi (RETAIL, minQuantity=1) — inline tahrirlash.
 * ⚠️ Ko'rsatish so'mda (tiyin/100), saqlashda so'm → tiyin (×100, string).
 */
function VariantPriceCell({ variantId }: { variantId: string }): ReactNode {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [som, setSom] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const { data: prices } = useQuery({
    queryKey: ['variant-prices', variantId],
    queryFn: () => api.get<VariantPrice[]>(`/pricing/variants/${variantId}/prices`),
  });
  const base = prices?.find((p) => p.minQuantity === 1);

  const save = useMutation({
    mutationFn: () =>
      api.put<VariantPrice>(`/pricing/variants/${variantId}/price`, {
        amount: String(Math.round(Number(som) * 100)),
      }),
    onSuccess: () => {
      setEditing(false);
      setErr(null);
      void qc.invalidateQueries({ queryKey: ['variant-prices', variantId] });
    },
    onError: (e) => setErr(e instanceof ApiError ? e.problem.detail : 'Xatolik'),
  });

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className={base ? 'font-medium' : 'text-slate-400'}>
          {base ? formatSom(base.amount) : 'Narx yo‘q'}
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setSom(base ? String(Number(base.amount) / 100) : '');
            setEditing(true);
          }}
        >
          Tahrirlash
        </Button>
      </div>
    );
  }

  const somNum = Number(som);
  return (
    <div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          className="h-8 w-32 text-sm"
          value={som}
          onChange={(e) => setSom(e.target.value)}
          placeholder="so'm"
        />
        <Button
          size="sm"
          disabled={!som || !Number.isFinite(somNum) || somNum <= 0 || save.isPending}
          onClick={() => save.mutate()}
        >
          Saqlash
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setErr(null); }}>
          Bekor
        </Button>
      </div>
      {err !== null && <p className="mt-1 text-xs text-red-600">{err}</p>}
    </div>
  );
}
