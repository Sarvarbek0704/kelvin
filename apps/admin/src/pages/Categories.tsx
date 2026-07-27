import { type FormEvent, type ReactNode, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';

import { api, ApiError } from '@/lib/api';
import { label } from '@/lib/i18n';
import { Badge, Button, Card, Input, Label, PageHeader, Select } from '@/components/ui';
import type { Category } from '@/lib/types';

function flatten(nodes: Category[], acc: Category[] = []): Category[] {
  for (const n of nodes) {
    acc.push(n);
    if (n.children) flatten(n.children, acc);
  }
  return acc;
}

export function CategoriesPage(): ReactNode {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/categories?activeOnly=false'),
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ slug: '', nameUz: '', nameRu: '', parentId: '' });
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () =>
      api.post('/categories', {
        slug: form.slug,
        name: { 'uz-Latn': form.nameUz, ru: form.nameRu || form.nameUz },
        ...(form.parentId !== '' && { parentId: form.parentId }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['categories'] });
      setOpen(false);
      setForm({ slug: '', nameUz: '', nameRu: '', parentId: '' });
      setError(null);
    },
    onError: (e) => setError(e instanceof ApiError ? e.problem.detail : 'Xatolik'),
  });

  const flat = data ? flatten(data) : [];

  const onSubmit = (e: FormEvent): void => {
    e.preventDefault();
    create.mutate();
  };

  return (
    <div>
      <PageHeader
        title="Kategoriyalar"
        action={
          <Button onClick={() => setOpen((v) => !v)}>
            <Plus className="h-4 w-4" /> Yangi kategoriya
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
                placeholder="lyustry-hrustalnye"
              />
            </div>
            <div>
              <Label>Ota kategoriya</Label>
              <Select
                value={form.parentId}
                onChange={(e) => setForm({ ...form, parentId: e.target.value })}
              >
                <option value="">— Ildiz —</option>
                {flat.map((c) => (
                  <option key={c.id} value={c.id}>
                    {'— '.repeat(c.depth)}
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
                Saqlash
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
              <th className="p-4 font-medium">Path</th>
              <th className="p-4 font-medium">Holat</th>
            </tr>
          </thead>
          <tbody>
            {flat.map((c) => (
              <tr key={c.id} className="border-b border-slate-100 last:border-0">
                <td className="p-4">
                  <span style={{ paddingLeft: c.depth * 16 }}>{label(c.name)}</span>
                </td>
                <td className="p-4 text-slate-500">{c.slug}</td>
                <td className="p-4 font-mono text-xs text-slate-400">{c.path}</td>
                <td className="p-4">
                  {c.isActive ? <Badge tone="green">Faol</Badge> : <Badge>Nofaol</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
