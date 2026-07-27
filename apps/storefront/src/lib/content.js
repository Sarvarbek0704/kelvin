import { useQuery } from '@tanstack/react-query';
import { api } from './api';

/**
 * Blog — nashr etilgan maqolalar (docs/13). Ommaviy endpoint (/blog).
 * ⚠️ Hardcode postlar O'RNIGA — kontent admin panelidan boshqariladi.
 */
export function useBlogPosts(limit = 3) {
  return useQuery({
    queryKey: ['blog', limit],
    queryFn: () => api.get(`/blog?limit=${String(limit)}`),
    staleTime: 5 * 60_000,
  });
}

/** Bitta nashr etilgan maqola (slug bo'yicha). */
export function useBlogPost(slug) {
  return useQuery({
    queryKey: ['blog', 'post', slug],
    queryFn: () => api.get(`/blog/${slug}`),
    enabled: Boolean(slug),
  });
}
