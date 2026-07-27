import { type ReactNode, useState } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, ApiError } from '@/lib/api';
import { label } from '@/lib/i18n';
import type { LocalizedText } from '@kelvin/contracts';
import { Badge, Button, Card, Input, Label, PageHeader } from '@/components/ui';
import type { BlogPost, CursorPage } from '@/lib/types';

const EMPTY = { slug: '', titleUz: '', titleRu: '', excerptUz: '', excerptRu: '', bodyUz: '', bodyRu: '', coverUrl: '' };

export function ContentPage(): ReactNode {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const set = (k: keyof typeof EMPTY, v: string): void => setForm((f) => ({ ...f, [k]: v }));

  const loc = (t: { 'uz-Latn'?: string; ru?: string } | null | undefined, k: 'uz-Latn' | 'ru'): string => t?.[k] ?? '';
  const startEdit = (p: BlogPost): void => {
    setEditId(p.id);
    setForm({
      slug: p.slug,
      titleUz: loc(p.title, 'uz-Latn'), titleRu: loc(p.title, 'ru'),
      excerptUz: loc(p.excerpt, 'uz-Latn'), excerptRu: loc(p.excerpt, 'ru'),
      bodyUz: loc(p.body, 'uz-Latn'), bodyRu: loc(p.body, 'ru'),
      coverUrl: p.coverUrl ?? '',
    });
    setOpen(true);
  };

  const { data, fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery({
    queryKey: ['blog', 'admin'],
    initialPageParam: '',
    queryFn: ({ pageParam }) => {
      const qs = new URLSearchParams({ limit: '20' });
      if (pageParam) qs.set('cursor', pageParam as string);
      return api.get<CursorPage<BlogPost>>(`/blog/admin?${qs.toString()}`);
    },
    getNextPageParam: (last) => last.pageInfo.nextCursor ?? undefined,
  });
  const posts = data?.pages.flatMap((p) => p.items) ?? [];

  const onErr = (e: unknown): void => setError(e instanceof ApiError ? e.problem.detail : 'Xatolik');
  const invalidate = (): void => void qc.invalidateQueries({ queryKey: ['blog'] });

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        slug: form.slug,
        title: { 'uz-Latn': form.titleUz, ru: form.titleRu || form.titleUz },
        ...(form.excerptUz || form.excerptRu
          ? { excerpt: { 'uz-Latn': form.excerptUz, ru: form.excerptRu || form.excerptUz } }
          : {}),
        body: { 'uz-Latn': form.bodyUz, ru: form.bodyRu || form.bodyUz },
        ...(form.coverUrl && { coverUrl: form.coverUrl }),
      };
      return editId ? api.patch(`/blog/${editId}`, payload) : api.post('/blog', payload);
    },
    onSuccess: () => {
      setError(null);
      setForm({ ...EMPTY });
      setOpen(false);
      setEditId(null);
      invalidate();
    },
    onError: onErr,
  });

  const togglePublish = useMutation({
    mutationFn: (p: BlogPost) => api.post(`/blog/${p.id}/${p.isPublished ? 'unpublish' : 'publish'}`),
    onSuccess: () => {
      setError(null);
      invalidate();
    },
    onError: onErr,
  });

  const ta = 'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900';

  return (
    <div>
      <PageHeader
        title="Kontent — Blog"
        action={<Button onClick={() => { setEditId(null); setForm({ ...EMPTY }); setOpen((o) => !o); }}>{open ? 'Yopish' : 'Yangi maqola'}</Button>}
      />
      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      {open && (
        <Card className="mb-6 space-y-3 p-5">
          <div>
            <Label>Slug</Label>
            <Input value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder="yangi-qandillar-2026" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Sarlavha (uz)</Label>
              <Input value={form.titleUz} onChange={(e) => set('titleUz', e.target.value)} />
            </div>
            <div>
              <Label>Sarlavha (ru)</Label>
              <Input value={form.titleRu} onChange={(e) => set('titleRu', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Qisqacha (uz)</Label>
              <textarea className={ta} rows={2} value={form.excerptUz} onChange={(e) => set('excerptUz', e.target.value)} />
            </div>
            <div>
              <Label>Qisqacha (ru)</Label>
              <textarea className={ta} rows={2} value={form.excerptRu} onChange={(e) => set('excerptRu', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Matn (uz)</Label>
              <textarea className={ta} rows={5} value={form.bodyUz} onChange={(e) => set('bodyUz', e.target.value)} />
            </div>
            <div>
              <Label>Matn (ru)</Label>
              <textarea className={ta} rows={5} value={form.bodyRu} onChange={(e) => set('bodyRu', e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Muqova rasmi (URL)</Label>
            <Input value={form.coverUrl} onChange={(e) => set('coverUrl', e.target.value)} placeholder="https://…" />
          </div>
          <Button disabled={!form.slug || !form.titleUz || createDisabled(form) || save.isPending} onClick={() => save.mutate()}>
            {editId ? 'Saqlash (tahrir)' : 'Saqlash (qoralama)'}
          </Button>
        </Card>
      )}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Sarlavha</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Holat</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 text-slate-800">{label(p.title)}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.slug}</td>
                <td className="px-4 py-3">
                  <Badge tone={p.isPublished ? 'green' : 'amber'}>{p.isPublished ? 'Nashr' : 'Qoralama'}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="ghost" onClick={() => startEdit(p)}>Tahrirlash</Button>
                  <Button size="sm" variant={p.isPublished ? 'ghost' : 'secondary'} disabled={togglePublish.isPending} onClick={() => togglePublish.mutate(p)}>
                    {p.isPublished ? 'Nashrdan olish' : 'Nashr etish'}
                  </Button>
                </td>
              </tr>
            ))}
            {posts.length === 0 && !isFetching && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">Maqola yo'q</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {hasNextPage && (
        <div className="mt-4 text-center">
          <Button variant="secondary" onClick={() => void fetchNextPage()} disabled={isFetching}>Ko'proq yuklash</Button>
        </div>
      )}

      <PagesSection />
    </div>
  );
}

interface PageRow { slug: string; title: LocalizedText }

function PagesSection(): ReactNode {
  const qc = useQueryClient();
  const { data: pages } = useQuery({ queryKey: ['pages', 'admin'], queryFn: () => api.get<PageRow[]>('/pages/admin') });
  const [f, setF] = useState({ slug: '', titleUz: '', titleRu: '', bodyUz: '', bodyRu: '' });
  const set = (k: keyof typeof f, v: string): void => setF((p) => ({ ...p, [k]: v }));

  const upsert = useMutation({
    mutationFn: () => api.post('/pages', {
      slug: f.slug,
      title: { 'uz-Latn': f.titleUz, ru: f.titleRu || f.titleUz },
      body: { 'uz-Latn': f.bodyUz, ru: f.bodyRu || f.bodyUz },
      isPublished: true,
    }),
    onSuccess: () => { setF({ slug: '', titleUz: '', titleRu: '', bodyUz: '', bodyRu: '' }); void qc.invalidateQueries({ queryKey: ['pages'] }); },
  });
  const ta = 'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900';

  return (
    <div className="mt-10">
      <h2 className="mb-3 text-lg font-semibold text-slate-800">Statik sahifalar</h2>
      <div className="mb-4 flex flex-wrap gap-2">
        {(pages ?? []).map((p) => (
          <button key={p.slug} onClick={() => set('slug', p.slug)} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 hover:bg-slate-200">{p.slug}</button>
        ))}
      </div>
      <Card className="space-y-3 p-5">
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Slug</Label><Input value={f.slug} onChange={(e) => set('slug', e.target.value)} placeholder="o-kompanii" /></div>
          <div><Label>Sarlavha (uz)</Label><Input value={f.titleUz} onChange={(e) => set('titleUz', e.target.value)} /></div>
          <div><Label>Sarlavha (ru)</Label><Input value={f.titleRu} onChange={(e) => set('titleRu', e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Matn (uz)</Label><textarea className={ta} rows={4} value={f.bodyUz} onChange={(e) => set('bodyUz', e.target.value)} /></div>
          <div><Label>Matn (ru)</Label><textarea className={ta} rows={4} value={f.bodyRu} onChange={(e) => set('bodyRu', e.target.value)} /></div>
        </div>
        <Button disabled={!f.slug || (!f.bodyUz && !f.bodyRu) || upsert.isPending} onClick={() => upsert.mutate()}>Saqlash (upsert)</Button>
      </Card>
    </div>
  );
}

function createDisabled(form: typeof EMPTY): boolean {
  return !form.bodyUz && !form.bodyRu;
}
