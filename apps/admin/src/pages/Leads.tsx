import { type ReactNode, useState } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, ApiError } from '@/lib/api';
import { Badge, Button, Card, Input, PageHeader, Select } from '@/components/ui';
import type { CursorPage, Lead, LeadStatus } from '@/lib/types';

const STATUSES: LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST'];

const TONE: Record<LeadStatus, 'slate' | 'green' | 'amber' | 'red'> = {
  NEW: 'amber',
  CONTACTED: 'slate',
  QUALIFIED: 'slate',
  PROPOSAL: 'slate',
  WON: 'green',
  LOST: 'red',
};

export function LeadsPage(): ReactNode {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');

  const { data: salespeople } = useQuery({
    queryKey: ['users', 'sales'],
    queryFn: () => api.get<{ id: string; name: string }[]>('/users?role=SALES'),
  });

  const { data: funnel } = useQuery({
    queryKey: ['leads', 'funnel'],
    queryFn: () => api.get<Record<string, number>>('/leads/funnel'),
  });

  const { data, fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery({
    queryKey: ['leads', status],
    initialPageParam: '',
    queryFn: ({ pageParam }) => {
      const qs = new URLSearchParams({ limit: '20' });
      if (status) qs.set('status', status);
      if (pageParam) qs.set('cursor', pageParam as string);
      return api.get<CursorPage<Lead>>(`/leads?${qs.toString()}`);
    },
    getNextPageParam: (last) => last.pageInfo.nextCursor ?? undefined,
  });
  const leads = data?.pages.flatMap((p) => p.items) ?? [];

  const invalidate = (): void => void qc.invalidateQueries({ queryKey: ['leads'] });
  const onErr = (e: unknown): void => setError(e instanceof ApiError ? e.problem.detail : 'Xatolik');

  const setStatusM = useMutation({
    mutationFn: ({ id, next, lostReason }: { id: string; next: LeadStatus; lostReason?: string }) =>
      api.patch(`/leads/${id}`, { status: next, ...(lostReason && { lostReason }) }),
    onSuccess: () => {
      setError(null);
      invalidate();
    },
    onError: onErr,
  });

  const saveNote = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => api.patch(`/leads/${id}`, { note }),
    onSuccess: () => {
      setError(null);
      invalidate();
    },
    onError: onErr,
  });

  const assign = useMutation({
    mutationFn: ({ id, assignedTo }: { id: string; assignedTo: string }) => api.patch(`/leads/${id}`, { assignedTo }),
    onSuccess: () => { setError(null); invalidate(); },
    onError: onErr,
  });

  const changeStatus = (lead: Lead, next: LeadStatus): void => {
    if (next === 'LOST') {
      const reason = window.prompt('Yo\'qotish sababi?');
      if (!reason) return;
      setStatusM.mutate({ id: lead.id, next, lostReason: reason });
    } else {
      setStatusM.mutate({ id: lead.id, next });
    }
  };

  return (
    <div>
      <PageHeader title="Lidlar" />
      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      {/* Voronka */}
      <div className="mb-6 flex flex-wrap gap-3">
        {STATUSES.map((s) => (
          <Card key={s} className="flex min-w-[110px] items-center gap-2 px-4 py-3">
            <Badge tone={TONE[s]}>{s}</Badge>
            <span className="text-lg font-bold text-slate-900">{funnel?.[s] ?? 0}</span>
          </Card>
        ))}
      </div>

      <div className="mb-4 w-64">
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Barcha holatlar</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Ism</th>
              <th className="px-4 py-3 font-medium">Telefon</th>
              <th className="px-4 py-3 font-medium">Manba</th>
              <th className="px-4 py-3 font-medium">Holat</th>
              <th className="px-4 py-3 font-medium">Sotuvchi</th>
              <th className="px-4 py-3 font-medium">Izoh</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id} className="border-b border-slate-100 last:border-0 align-top">
                <td className="px-4 py-3 text-slate-800">{l.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <a href={`tel:${l.phone}`} className="text-slate-600 hover:text-slate-900">{l.phone}</a>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{l.source}</td>
                <td className="px-4 py-3">
                  <Select
                    value={l.status}
                    onChange={(e) => changeStatus(l, e.target.value as LeadStatus)}
                    className="h-8 w-36 text-xs"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Select>
                  {l.status === 'LOST' && l.lostReason && (
                    <div className="mt-1 text-xs text-red-500">{l.lostReason}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Select
                    value={l.assignedTo ?? ''}
                    onChange={(e) => e.target.value && assign.mutate({ id: l.id, assignedTo: e.target.value })}
                    className="h-8 w-32 text-xs"
                  >
                    <option value="">— tayinlash —</option>
                    {(salespeople ?? []).map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </Select>
                </td>
                <td className="px-4 py-3">
                  <NoteCell lead={l} onSave={(note) => saveNote.mutate({ id: l.id, note })} />
                </td>
              </tr>
            ))}
            {leads.length === 0 && !isFetching && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Lid yo'q</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      {hasNextPage && (
        <div className="mt-4 text-center">
          <Button variant="secondary" onClick={() => void fetchNextPage()} disabled={isFetching}>Ko'proq yuklash</Button>
        </div>
      )}
    </div>
  );
}

function NoteCell({ lead, onSave }: { lead: Lead; onSave: (note: string) => void }): ReactNode {
  const [note, setNote] = useState(lead.note ?? '');
  const dirty = note !== (lead.note ?? '');
  return (
    <div className="flex items-center gap-2">
      <Input value={note} onChange={(e) => setNote(e.target.value)} className="h-8 text-xs" placeholder="izoh…" />
      {dirty && (
        <Button size="sm" variant="secondary" onClick={() => onSave(note)}>Saqlash</Button>
      )}
    </div>
  );
}
