import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

/** Savol-javob (docs/10 §9.4) — ommaviy tasdiqlangan + savol berish (moderatsiyaga). */
export function useProductQuestions(productId) {
  return useQuery({
    queryKey: ['questions', productId],
    queryFn: () => api.get(`/questions?productId=${productId}`),
    enabled: Boolean(productId),
  });
}

export function useAskQuestion(productId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post('/questions', { productId, body }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['questions', productId] }),
  });
}
