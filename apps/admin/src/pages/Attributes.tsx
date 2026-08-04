import { Fragment, type ReactNode, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, ApiError } from '@/lib/api';
import { label } from '@/lib/i18n';
import { Badge, Button, Card, Input, Label, PageHeader } from '@/components/ui';
import type { Attribute, AttributeValue } from '@/lib/types';

export function AttributesPage(): ReactNode {
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ['attributes'],
    queryFn: () => api.get<Attribute[]>('/attributes'),
  });

  return (
    <div>
      <PageHeader title="Atributlar reestri" />
      <p className="mb-6 text-slate-500">
        Yoritgichga xos texnik atributlar. Variant o‘qlari matritsa generatsiyasida ishlatiladi.
      </p>
      {error !== null && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
      )}
      <Card>
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-slate-500">
            <tr>
              <th className="p-4 font-medium">Nom</th>
              <th className="p-4 font-medium">Kod</th>
              <th className="p-4 font-medium">Tip</th>
              <th className="p-4 font-medium">Birlik</th>
              <th className="p-4 font-medium">Qiymatlar</th>
              <th className="p-4 font-medium">Belgilar</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((a) => (
              <Fragment key={a.id}>
                <tr className="border-b border-slate-100 last:border-0">
                  <td className="p-4 font-medium">{label(a.name)}</td>
                  <td className="p-4 font-mono text-xs text-slate-500">{a.code}</td>
                  <td className="p-4">
                    <Badge>{a.type}</Badge>
                  </td>
                  <td className="p-4 text-slate-500">{a.unit ?? '—'}</td>
                  <td className="p-4 text-slate-500">
                    {a.values.length > 0 ? a.values.map((v) => v.code).join(', ') : '—'}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      {a.isVariantAxis && <Badge tone="amber">o‘q</Badge>}
                      {a.isFilterable && <Badge tone="green">filtr</Badge>}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditId(editId === a.id ? null : a.id)}
                    >
                      {editId === a.id ? 'Yopish' : 'Tahrirlash'}
                    </Button>
                  </td>
                </tr>
                {editId === a.id && (
                  <tr className="bg-slate-50">
                    <td colSpan={7} className="px-4 py-4">
                      <AttributeEditor attribute={a} onError={setError} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/** LocalizedText payload: ru bo'sh bo'lsa uz'dan nusxa (Content naqshi). */
const toLoc = (uz: string, ru: string): { 'uz-Latn': string; ru: string } => ({
  'uz-Latn': uz,
  ru: ru || uz,
});

/** Atribut nomi (uz/ru) tahrirlash + qiymat qo'shish/tahrirlash. */
function AttributeEditor({
  attribute,
  onError,
}: {
  attribute: Attribute;
  onError: (msg: string | null) => void;
}): ReactNode {
  const qc = useQueryClient();
  const [nameUz, setNameUz] = useState(attribute.name['uz-Latn'] ?? '');
  const [nameRu, setNameRu] = useState(attribute.name.ru ?? '');

  const invalidate = (): void => void qc.invalidateQueries({ queryKey: ['attributes'] });
  const onErr = (e: unknown): void =>
    onError(e instanceof ApiError ? e.problem.detail : 'Xatolik');

  const saveName = useMutation({
    mutationFn: () => api.patch(`/attributes/${attribute.id}`, { name: toLoc(nameUz, nameRu) }),
    onSuccess: () => {
      onError(null);
      invalidate();
    },
    onError: onErr,
  });

  // --- Yangi qiymat ---------------------------------------------------------
  const [valCode, setValCode] = useState('');
  const [valUz, setValUz] = useState('');
  const [valRu, setValRu] = useState('');
  const addValue = useMutation({
    mutationFn: () =>
      api.post(`/attributes/${attribute.id}/values`, {
        code: valCode.trim(),
        label: toLoc(valUz, valRu),
      }),
    onSuccess: () => {
      onError(null);
      setValCode('');
      setValUz('');
      setValRu('');
      invalidate();
    },
    onError: onErr,
  });

  return (
    <div className="space-y-4">
      {/* Nom (uz/ru) */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-56">
          <Label>Nom (uz)</Label>
          <Input value={nameUz} onChange={(e) => setNameUz(e.target.value)} />
        </div>
        <div className="w-56">
          <Label>Nom (ru)</Label>
          <Input value={nameRu} onChange={(e) => setNameRu(e.target.value)} />
        </div>
        <Button size="sm" disabled={!nameUz.trim() || saveName.isPending} onClick={() => saveName.mutate()}>
          Nomni saqlash
        </Button>
      </div>

      {/* Qiymatlar */}
      <div>
        <div className="mb-2 text-sm font-medium text-slate-700">Qiymatlar</div>
        <div className="space-y-2">
          {attribute.values.map((v) => (
            <ValueEditor key={v.id} value={v} onError={onError} />
          ))}
          {attribute.values.length === 0 && (
            <p className="text-xs text-slate-400">Qiymat yo‘q</p>
          )}
        </div>
      </div>

      {/* Yangi qiymat qo'shish */}
      <div className="flex flex-wrap items-end gap-3 border-t border-slate-200 pt-3">
        <div className="w-36">
          <Label>Yangi kod</Label>
          <Input value={valCode} onChange={(e) => setValCode(e.target.value)} placeholder="3000" />
        </div>
        <div className="w-48">
          <Label>Label (uz)</Label>
          <Input value={valUz} onChange={(e) => setValUz(e.target.value)} />
        </div>
        <div className="w-48">
          <Label>Label (ru)</Label>
          <Input value={valRu} onChange={(e) => setValRu(e.target.value)} />
        </div>
        <Button
          size="sm"
          variant="secondary"
          disabled={!valCode.trim() || !valUz.trim() || addValue.isPending}
          onClick={() => addValue.mutate()}
        >
          Qiymat qo'shish
        </Button>
      </div>
    </div>
  );
}

/** Bitta qiymat labelini (uz/ru) inline tahrirlash. */
function ValueEditor({
  value,
  onError,
}: {
  value: AttributeValue;
  onError: (msg: string | null) => void;
}): ReactNode {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [uz, setUz] = useState('');
  const [ru, setRu] = useState('');

  const save = useMutation({
    mutationFn: () => api.patch(`/attributes/values/${value.id}`, { label: toLoc(uz, ru) }),
    onSuccess: () => {
      onError(null);
      setEditing(false);
      void qc.invalidateQueries({ queryKey: ['attributes'] });
    },
    onError: (e) => onError(e instanceof ApiError ? e.problem.detail : 'Xatolik'),
  });

  if (!editing) {
    return (
      <div className="flex items-center gap-2 text-sm">
        {value.hexColor !== null && (
          <span
            className="inline-block h-3 w-3 rounded-full border border-slate-300"
            style={{ background: value.hexColor }}
          />
        )}
        <span className="font-mono text-xs text-slate-500">{value.code}</span>
        <span>{label(value.label)}</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setUz(value.label['uz-Latn'] ?? '');
            setRu(value.label.ru ?? '');
            setEditing(true);
          }}
        >
          Tahrirlash
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-mono text-xs text-slate-500">{value.code}</span>
      <Input className="h-8 w-44 text-sm" value={uz} onChange={(e) => setUz(e.target.value)} placeholder="uz" />
      <Input className="h-8 w-44 text-sm" value={ru} onChange={(e) => setRu(e.target.value)} placeholder="ru" />
      <Button size="sm" disabled={!uz.trim() || save.isPending} onClick={() => save.mutate()}>
        Saqlash
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
        Bekor
      </Button>
    </div>
  );
}
