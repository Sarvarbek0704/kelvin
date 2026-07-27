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
