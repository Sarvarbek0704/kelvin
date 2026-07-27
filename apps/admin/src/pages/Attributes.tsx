import { type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { label } from '@/lib/i18n';
import { Badge, Card, PageHeader } from '@/components/ui';
import type { Attribute } from '@/lib/types';

export function AttributesPage(): ReactNode {
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
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((a) => (
              <tr key={a.id} className="border-b border-slate-100 last:border-0">
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
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
