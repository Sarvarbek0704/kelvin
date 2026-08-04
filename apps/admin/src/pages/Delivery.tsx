import { type ReactNode, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, ApiError } from '@/lib/api';
import { label } from '@/lib/i18n';
import { formatSom } from '@/lib/money';
import { Badge, Button, Card, Input, Label, PageHeader, Select } from '@/components/ui';
import type { DeliverySlotRaw, DeliveryZone } from '@/lib/types';

/** "09:00-12:00, 14:00-18:00" → [{start,end}]. Noto'g'ri bo'laklar tashlanadi. */
function parseWindows(raw: string): { start: string; end: string }[] {
  return raw
    .split(',')
    .map((w) => w.trim())
    .filter(Boolean)
    .map((w) => {
      const m = /^(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/.exec(w);
      return m ? { start: m[1], end: m[2] } : null;
    })
    .filter((w): w is { start: string; end: string } => w !== null);
}

/** dateFrom..dateTo (ISO yyyy-mm-dd) oralig'idagi sanalar ro'yxati. */
function dateRange(from: string, to: string): string[] {
  const out: string[] = [];
  const d = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  while (d <= end && out.length < 60) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

/**
 * Yetkazish — zonalar ro'yxati + slot generatsiyasi.
 * ⚠️ Backend'da zona PATCH yo'q — shu sabab tahrirlash emas, faqat ko'rish.
 *    Slotlar POST /delivery/slots orqali kunma-kun yaratiladi.
 */
export function DeliveryPage(): ReactNode {
  const [error, setError] = useState<string | null>(null);

  const { data: zones } = useQuery({
    queryKey: ['delivery', 'zones'],
    queryFn: () => api.get<DeliveryZone[]>('/delivery/zones'),
  });

  return (
    <div>
      <PageHeader title="Yetkazish" />
      {error !== null && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
      )}

      {/* Zonalar */}
      <Card className="mb-6 overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3 font-medium">Zonalar</div>
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Nomi</th>
              <th className="px-4 py-3 font-medium">Tumanlar</th>
              <th className="px-4 py-3 text-right font-medium">Narx</th>
              <th className="px-4 py-3 text-right font-medium">Bepul chegara</th>
              <th className="px-4 py-3 text-center font-medium">ETA (kun)</th>
              <th className="px-4 py-3 font-medium">Holat</th>
            </tr>
          </thead>
          <tbody>
            {(zones ?? []).map((z) => (
              <tr key={z.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-medium">{label(z.name)}</td>
                <td className="px-4 py-3 text-slate-500">{z.districts.join(', ')}</td>
                <td className="px-4 py-3 text-right">{formatSom(z.priceAmount)}</td>
                <td className="px-4 py-3 text-right">
                  {z.freeThresholdAmount !== null ? formatSom(z.freeThresholdAmount) : '—'}
                </td>
                <td className="px-4 py-3 text-center text-slate-500">
                  {z.etaDaysMin}–{z.etaDaysMax}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={z.isActive ? 'green' : 'amber'}>{z.isActive ? 'Faol' : "O'chiq"}</Badge>
                </td>
              </tr>
            ))}
            {(zones ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Zona yo'q (seed'da yaratiladi)
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <SlotGenerator zones={zones ?? []} onError={setError} />
        <SlotViewer zones={zones ?? []} />
      </div>
    </div>
  );
}

/** Kelasi N kun uchun slot generatsiyasi: sana oralig'i × vaqt oynalari. */
function SlotGenerator({
  zones,
  onError,
}: {
  zones: DeliveryZone[];
  onError: (msg: string | null) => void;
}): ReactNode {
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const [zoneId, setZoneId] = useState('');
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [windows, setWindows] = useState('09:00-13:00, 14:00-18:00');
  const [capacity, setCapacity] = useState('10');
  const [result, setResult] = useState<string | null>(null);

  const wins = parseWindows(windows);
  const days = dateFrom && dateTo ? dateRange(dateFrom, dateTo) : [];
  const total = wins.length * days.length;

  const generate = useMutation({
    mutationFn: async () => {
      let created = 0;
      // Ketma-ket — API validatsiya xatosida qaysi slot ekani aniq bo'ladi.
      for (const date of days) {
        for (const w of wins) {
          await api.post('/delivery/slots', {
            zoneId,
            date,
            startTime: w.start,
            endTime: w.end,
            capacity: Number(capacity),
          });
          created += 1;
        }
      }
      return created;
    },
    onSuccess: (created) => {
      onError(null);
      setResult(`${created} ta slot yaratildi`);
      void qc.invalidateQueries({ queryKey: ['delivery', 'slots'] });
    },
    onError: (e) => {
      setResult(null);
      onError(e instanceof ApiError ? e.problem.detail : 'Xatolik');
    },
  });

  return (
    <Card className="p-5">
      <div className="mb-3 font-medium">Slot generatsiyasi</div>
      {result !== null && (
        <div className="mb-3 rounded-md bg-green-50 px-4 py-2 text-sm text-green-700">{result}</div>
      )}
      <div className="space-y-3">
        <div>
          <Label>Zona</Label>
          <Select value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
            <option value="">Tanlang…</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {label(z.name)}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Sanadan</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <Label>Sanagacha</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>
        <div>
          <Label>Vaqt oynalari (vergul bilan)</Label>
          <Input
            value={windows}
            onChange={(e) => setWindows(e.target.value)}
            placeholder="09:00-13:00, 14:00-18:00"
          />
        </div>
        <div className="w-32">
          <Label>Sig'im (har slot)</Label>
          <Input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
        </div>
        <div className="flex items-center gap-3">
          <Button
            disabled={!zoneId || total === 0 || Number(capacity) < 1 || generate.isPending}
            onClick={() => generate.mutate()}
          >
            {generate.isPending ? 'Yaratilmoqda…' : `${total} ta slot yaratish`}
          </Button>
          {total > 0 && (
            <span className="text-sm text-slate-500">
              {days.length} kun × {wins.length} oyna
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

/** Zona + sana bo'yicha bo'sh slotlarni ko'rish (GET /delivery/slots). */
function SlotViewer({ zones }: { zones: DeliveryZone[] }): ReactNode {
  const today = new Date().toISOString().slice(0, 10);
  const [zoneId, setZoneId] = useState('');
  const [date, setDate] = useState(today);

  const { data: slots, isFetching } = useQuery({
    queryKey: ['delivery', 'slots', zoneId, date],
    queryFn: () => api.get<DeliverySlotRaw[]>(`/delivery/slots?zoneId=${zoneId}&date=${date}`),
    enabled: zoneId !== '' && date !== '',
  });

  return (
    <Card className="p-5">
      <div className="mb-3 font-medium">Bo'sh slotlar (tekshirish)</div>
      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <Label>Zona</Label>
          <Select value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
            <option value="">Tanlang…</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {label(z.name)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Sana</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>
      <ul className="space-y-1 text-sm">
        {(slots ?? []).map((s) => (
          <li key={s.id} className="flex justify-between border-b border-slate-100 py-1.5 last:border-0">
            <span>
              {s.start_time}–{s.end_time}
            </span>
            <span className="text-slate-500">
              {s.booked}/{s.capacity} band
            </span>
          </li>
        ))}
        {zoneId !== '' && (slots ?? []).length === 0 && !isFetching && (
          <li className="py-4 text-center text-slate-400">Bu kunga bo'sh slot yo'q</li>
        )}
        {zoneId === '' && <li className="py-4 text-center text-slate-400">Zona va sanani tanlang</li>}
      </ul>
    </Card>
  );
}
