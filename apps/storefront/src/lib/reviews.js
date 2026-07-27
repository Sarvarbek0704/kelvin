import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

/**
 * Sharhlar (docs/10) — ommaviy o'qish (tasdiqlangan) + yozish (moderatsiyaga).
 */
export function useReviewSummary(productId) {
  return useQuery({
    queryKey: ['reviews', 'summary', productId],
    queryFn: () => api.get(`/reviews/summary?productId=${productId}`),
    enabled: Boolean(productId),
  });
}

export function useProductReviews(productId) {
  return useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => api.get(`/reviews?productId=${productId}`),
    enabled: Boolean(productId),
  });
}

export function useSubmitReview(productId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ rating, title, body }) =>
      api.post('/reviews', { productId, rating, ...(title && { title }), body }),
    onSuccess: () => {
      // Sharh moderatsiyaga tushadi — ro'yxat darhol o'zgarmaydi, lekin summary'ni yangilaymiz.
      void qc.invalidateQueries({ queryKey: ['reviews', productId] });
    },
  });
}
