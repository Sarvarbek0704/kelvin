import { type FormEvent, type ReactNode, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

import { api, ApiError } from '@/lib/api';
import { label } from '@/lib/i18n';
import { Badge, Button, Card, Input, Label, PageHeader, Select } from '@/components/ui';
import type { Category, CursorPage, Product } from '@/lib/types';

const STATUS_TONE = {
  DRAFT: 'amber',
  ACTIVE: 'green',
  ARCHIVED: 'slate',
  OUT_OF_PRODUCTION: 'red',
} as const;

export function ProductsPage(): ReactNode {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ['products', 'admin'],
    queryFn: () => api.get<CursorPage<Product>>('/products/admin'),
  });
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/categories?activeOnly=false'),
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ slug: '', nameUz: '', nameRu: '', categoryId: '' });
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () =>
      api.post<Product>('/products', {
        slug: form.slug,
        categoryId: form.categoryId,
        name: { 'uz-Latn': form.nameUz, ru: form.nameRu || form.nameUz },
      }),
    onSuccess: (p) => {
      void qc.invalidateQueries({ queryKey: ['products'] });
      navigate(`/products/${p.id}`);
    },
    onError: (e) => setError(e instanceof ApiError ? e.problem.detail : 'Xatolik'),
  });

  const flat = (categories ?? []).flatMap((c) => [c, ...(c.children ?? [])]);

  const onSubmit = (e: FormEvent): void => {
    e.preventDefault();
    create.mutate();
  };

  return (
    <div>
      <PageHeader
        title="Mahsulotlar"
        action={
          <Button onClick={() => setOpen((v) => !v)}>
            <Plus className="h-4 w-4" /> Yangi mahsulot
          </Button>
        }
      />

      {open && (
        <Card className="mb-6 p-6">
          <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="aurora-qandil"
              />
            </div>
            <div>
              <Label>Kategoriya</Label>
              <Select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              >
                <option value="">— Tanlang —</option>
                {flat.map((c) => (
                  <option key={c.id} value={c.id}>
                    {label(c.name)}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Nom (uz)</Label>
              <Input
                value={form.nameUz}
                onChange={(e) => setForm({ ...form, nameUz: e.target.value })}
              />
            </div>
            <div>
              <Label>Nom (ru)</Label>
              <Input
                value={form.nameRu}
                onChange={(e) => setForm({ ...form, nameRu: e.target.value })}
              />
            </div>
            {error !== null && <p className="col-span-2 text-sm text-red-600">{error}</p>}
            <div className="col-span-2">
              <Button type="submit" disabled={create.isPending}>
                Yaratish va tahrirlash
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-slate-500">
            <tr>
              <th className="p-4 font-medium">Nom</th>
              <th className="p-4 font-medium">Slug</th>
              <th className="p-4 font-medium">Holat</th>
              <th className="p-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((p) => (
              <tr
                key={p.id}
                className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50"
                onClick={() => navigate(`/products/${p.id}`)}
              >
                <td className="p-4 font-medium">{label(p.name)}</td>
                <td className="p-4 text-slate-500">{p.slug}</td>
                <td className="p-4">
                  <Badge tone={STATUS_TONE[p.status]}>{p.status}</Badge>
                </td>
                <td className="p-4 text-right text-slate-400">→</td>
              </tr>
            ))}
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-400">
                  Hali mahsulot yo‘q. "Yangi mahsulot" bilan boshlang.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
