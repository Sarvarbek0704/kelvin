import { type ReactNode, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { api, ApiError } from '@/lib/api';
import { formatSom } from '@/lib/money';
import { Badge, Button, Card, Input, Label, PageHeader, Select } from '@/components/ui';
import type { Address, AdminOrderDetail, CourierOption, Payment, Shipment } from '@/lib/types';

const MANUAL_PROVIDERS = ['CASH', 'BANK_TRANSFER'];

export function OrderDetailPage(): ReactNode {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [refundFor, setRefundFor] = useState<string | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [addressId, setAddressId] = useState('');
  const [courierId, setCourierId] = useState('');

  const { data: order } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get<AdminOrderDetail>(`/orders/admin/${id}`),
  });
  const { data: payments } = useQuery({
    queryKey: ['order', id, 'payments'],
    queryFn: () => api.get<Payment[]>(`/payments/admin?orderId=${id}`),
  });
  const { data: shipments } = useQuery({
    queryKey: ['order', id, 'shipments'],
    queryFn: () => api.get<Shipment[]>(`/shipments?orderId=${id}`),
  });
  const { data: addresses } = useQuery({
    queryKey: ['addresses', order?.customerId],
    queryFn: () => api.get<Address[]>(`/addresses/admin?customerId=${order?.customerId ?? ''}`),
    enabled: Boolean(order?.customerId),
  });
  const { data: couriers } = useQuery({
    queryKey: ['couriers'],
    queryFn: () => api.get<CourierOption[]>('/shipments/couriers'),
  });

  const invalidate = (): void => {
    void qc.invalidateQueries({ queryKey: ['order', id] });
    void qc.invalidateQueries({ queryKey: ['orders'] });
  };
  const onErr = (e: unknown): void =>
    setError(e instanceof ApiError ? e.problem.detail : 'Xatolik');

  const transition = useMutation({
    mutationFn: (to: string) => api.post(`/orders/${id}/transition`, { to }),
    onSuccess: () => {
      setError(null);
      invalidate();
    },
    onError: onErr,
  });

  const capture = useMutation({
    mutationFn: (paymentId: string) => api.post(`/payments/${paymentId}/capture`),
    onSuccess: () => {
      setError(null);
      invalidate();
    },
    onError: onErr,
  });

  const refund = useMutation({
    mutationFn: (paymentId: string) =>
      api.post(`/payments/${paymentId}/refund`, {
        amount: refundAmount,
        reason: refundReason || 'admin refund',
        idempotencyKey: crypto.randomUUID(),
      }),
    onSuccess: () => {
      setError(null);
      setRefundFor(null);
      setRefundReason('');
      invalidate();
    },
    onError: onErr,
  });

  const createShipment = useMutation({
    mutationFn: () => api.post('/shipments', { orderId: id, addressId }),
    onSuccess: () => {
      setError(null);
      invalidate();
    },
    onError: onErr,
  });

  const assignCourier = useMutation({
    mutationFn: (shipmentId: string) => api.post(`/shipments/${shipmentId}/assign`, { courierId }),
    onSuccess: () => {
      setError(null);
      invalidate();
    },
    onError: onErr,
  });

  // ASSIGNED → transit; IN_TRANSIT → deliver (allowedTransitions boshqaradi).
  const shipmentStep = useMutation({
    mutationFn: ({ shipmentId, path }: { shipmentId: string; path: string }) =>
      api.post(`/shipments/${shipmentId}/${path}`),
    onSuccess: () => {
      setError(null);
      invalidate();
    },
    onError: onErr,
  });

  if (!order) {
    return <p className="text-slate-400">Yuklanmoqda…</p>;
  }

  return (
    <div>
      <button
        onClick={() => navigate('/orders')}
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft size={16} /> Buyurtmalar
      </button>

      <PageHeader
        title={order.number}
        action={<Badge tone="slate">{order.status}</Badge>}
      />

      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Qatorlar + summa */}
        <Card className="lg:col-span-2">
          <div className="border-b border-slate-100 px-5 py-3 font-medium">Tovarlar</div>
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="px-5 py-2 font-medium">SKU</th>
                <th className="px-5 py-2 text-center font-medium">Soni</th>
                <th className="px-5 py-2 text-right font-medium">Narx</th>
                <th className="px-5 py-2 text-right font-medium">Jami</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((it) => (
                <tr key={it.variantId} className="border-t border-slate-100">
                  <td className="px-5 py-2 font-mono text-xs">{it.sku}</td>
                  <td className="px-5 py-2 text-center">{it.quantity}</td>
                  <td className="px-5 py-2 text-right">{formatSom(it.unitAmount)}</td>
                  <td className="px-5 py-2 text-right">{formatSom(it.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="space-y-1 border-t border-slate-100 px-5 py-3 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Tovarlar</span>
              <span>{formatSom(order.subtotalAmount)}</span>
            </div>
            {order.discountAmount !== '0' && (
              <div className="flex justify-between text-slate-500">
                <span>Chegirma</span>
                <span>−{formatSom(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500">
              <span>Yetkazish</span>
              <span>{formatSom(order.deliveryAmount)}</span>
            </div>
            <div className="flex justify-between pt-1 text-base font-semibold text-slate-900">
              <span>Jami</span>
              <span>{formatSom(order.totalAmount)}</span>
            </div>
          </div>
        </Card>

        {/* Amallar */}
        <div className="space-y-6">
          <Card className="p-5">
            <div className="mb-3 font-medium">Mijoz</div>
            {order.customer ? (
              <div className="space-y-1 text-sm">
                <div className="font-medium text-slate-900">
                  {order.customer.firstName ?? 'Ism ko’rsatilmagan'}
                </div>
                <a href={`tel:${order.customer.phone}`} className="text-slate-600 hover:text-slate-900">
                  {order.customer.phone}
                </a>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Kontakt yo'q</p>
            )}
          </Card>

          <Card className="p-5">
            <div className="mb-3 font-medium">Holatni o'zgartirish</div>
            {order.allowedTransitions.length === 0 ? (
              <p className="text-sm text-slate-400">Terminal holat — o'tish yo'q</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {order.allowedTransitions.map((to) => (
                  <Button
                    key={to}
                    size="sm"
                    variant={to === 'CANCELLED' ? 'danger' : 'secondary'}
                    disabled={transition.isPending}
                    onClick={() => transition.mutate(to)}
                  >
                    {to}
                  </Button>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="mb-3 font-medium">To'lovlar</div>
            {(payments ?? []).length === 0 && (
              <p className="text-sm text-slate-400">To'lov yo'q</p>
            )}
            <div className="space-y-3">
              {(payments ?? []).map((p) => (
                <div key={p.id} className="rounded-md border border-slate-100 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{p.provider}</span>
                    <Badge tone={p.status === 'PAID' ? 'green' : p.status === 'FAILED' ? 'red' : 'amber'}>
                      {p.status}
                    </Badge>
                  </div>
                  <div className="mt-1 text-sm text-slate-500">{formatSom(p.amount)}</div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {p.status === 'PENDING' && MANUAL_PROVIDERS.includes(p.provider) && (
                      <Button size="sm" disabled={capture.isPending} onClick={() => capture.mutate(p.id)}>
                        Naqd qabul qilindi
                      </Button>
                    )}
                    {(p.status === 'PAID' || p.status === 'PARTIALLY_REFUNDED') && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setRefundFor(refundFor === p.id ? null : p.id);
                          setRefundAmount(p.amount);
                        }}
                      >
                        Refund
                      </Button>
                    )}
                  </div>

                  {refundFor === p.id && (
                    <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                      <div>
                        <Label>Summa (tiyin)</Label>
                        <Input
                          value={refundAmount}
                          onChange={(e) => setRefundAmount(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Sabab</Label>
                        <Input
                          value={refundReason}
                          onChange={(e) => setRefundReason(e.target.value)}
                          placeholder="brak, mijoz rad etdi…"
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={refund.isPending}
                        onClick={() => refund.mutate(p.id)}
                      >
                        Refundni tasdiqlash
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Yetkazish (jo'natma) — order CONFIRMED bo'lgach yaratiladi */}
          <Card className="p-5">
            <div className="mb-3 font-medium">Yetkazish</div>
            {(() => {
              const shipment = shipments?.[0];
              if (shipment) {
                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge tone={shipment.status === 'DELIVERED' ? 'green' : 'amber'}>
                        {shipment.status}
                      </Badge>
                      {shipment.trackingNumber && (
                        <span className="font-mono text-xs text-slate-500">
                          {shipment.trackingNumber}
                        </span>
                      )}
                    </div>

                    {shipment.allowedTransitions.includes('ASSIGNED') && (
                      <div className="space-y-2">
                        <Select value={courierId} onChange={(e) => setCourierId(e.target.value)}>
                          <option value="">Kuryer tanlang…</option>
                          {(couriers ?? []).map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.fullName} ({c.phone})
                            </option>
                          ))}
                        </Select>
                        <Button
                          size="sm"
                          disabled={!courierId || assignCourier.isPending}
                          onClick={() => assignCourier.mutate(shipment.id)}
                        >
                          Kuryer tayinlash
                        </Button>
                      </div>
                    )}
                    {shipment.allowedTransitions.includes('IN_TRANSIT') && (
                      <Button
                        size="sm"
                        disabled={shipmentStep.isPending}
                        onClick={() => shipmentStep.mutate({ shipmentId: shipment.id, path: 'transit' })}
                      >
                        Yo'lda deb belgilash
                      </Button>
                    )}
                    {shipment.allowedTransitions.includes('DELIVERED') && (
                      <Button
                        size="sm"
                        disabled={shipmentStep.isPending}
                        onClick={() => shipmentStep.mutate({ shipmentId: shipment.id, path: 'deliver' })}
                      >
                        Yetkazildi
                      </Button>
                    )}
                  </div>
                );
              }
              if (order.status !== 'CONFIRMED') {
                return (
                  <p className="text-sm text-slate-400">
                    Jo'natma faqat CONFIRMED buyurtma uchun (hozir {order.status})
                  </p>
                );
              }
              return (
                <div className="space-y-2">
                  <Select value={addressId} onChange={(e) => setAddressId(e.target.value)}>
                    <option value="">Manzil tanlang…</option>
                    {(addresses ?? []).map((a) => (
                      <option key={a.id} value={a.id}>
                        {[a.region, a.city, a.street, a.apartment].filter(Boolean).join(', ')}
                      </option>
                    ))}
                  </Select>
                  <Button
                    size="sm"
                    disabled={!addressId || createShipment.isPending}
                    onClick={() => createShipment.mutate()}
                  >
                    Jo'natma yaratish
                  </Button>
                </div>
              );
            })()}
          </Card>

          {/* Holat tarixi (timeline) */}
          {order.timeline.length > 0 && (
            <Card className="p-5">
              <div className="mb-3 font-medium">Tarix</div>
              <ol className="space-y-3">
                {order.timeline.map((t, i) => (
                  <li key={`${t.toStatus}-${i}`} className="flex gap-3 text-sm">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-slate-300" />
                    <div>
                      <div className="font-medium text-slate-800">
                        {t.fromStatus ? `${t.fromStatus} → ${t.toStatus}` : t.toStatus}
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(t.createdAt).toLocaleString('ru-RU')}
                        {t.reason ? ` · ${t.reason}` : ''}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
