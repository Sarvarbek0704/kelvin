import { useQuery } from '@tanstack/react-query';
import { api } from './api';

/**
 * Yetkazish — zonalar (ommaviy) va narx hisobi (quote). Narx SERVERDA hisoblanadi
 * (subtotal freeThreshold'dan yuqori → bepul); storefront faqat ko'rsatadi.
 *
 * @see docs/07 §8, docs/09
 */
export function useDeliveryZones() {
  return useQuery({
    queryKey: ['delivery-zones'],
    queryFn: () => api.get('/delivery/zones'),
    staleTime: 5 * 60_000, // zonalar kam o'zgaradi
  });
}

/**
 * Tanlangan zona uchun yetkazish narxi. subtotal (tiyin, string) o'zgarsa qayta
 * so'raladi. Zona tanlanmaguncha so'rov yuborilmaydi.
 */
export function useDeliveryQuote(zoneId, subtotalTiyin) {
  return useQuery({
    queryKey: ['delivery-quote', zoneId, String(subtotalTiyin ?? '')],
    queryFn: () => api.get(`/delivery/zones/${zoneId}/quote?subtotal=${String(subtotalTiyin ?? 0)}`),
    enabled: Boolean(zoneId) && subtotalTiyin !== undefined && subtotalTiyin !== null,
  });
}

/** Zona + sana uchun bo'sh yetkazish slotlari (date: 'YYYY-MM-DD'). */
export function useDeliverySlots(zoneId, date) {
  return useQuery({
    queryKey: ['delivery-slots', zoneId, date],
    queryFn: () => api.get(`/delivery/slots?zoneId=${zoneId}&date=${date}`),
    enabled: Boolean(zoneId) && Boolean(date),
  });
}

/** Mijoz manzillari (kabinet/checkout). */
export function useAddresses(enabled) {
  return useQuery({
    queryKey: ['addresses'],
    queryFn: () => api.get('/addresses'),
    enabled: Boolean(enabled),
  });
}
