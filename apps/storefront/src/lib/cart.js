import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

/**
 * Savat — server tomonda (mehmon uchun cart_token httpOnly cookie). React Query
 * bilan boshqariladi (Zustand emas — savat serverda, klient sinxroni shart emas).
 * Mutatsiya javobi CartView'ni qaytaradi → keshni darhol yangilaymiz.
 */
export const CART_KEY = ['cart'];

export function useCart() {
  return useQuery({ queryKey: CART_KEY, queryFn: () => api.get('/cart') });
}

export function useCartMutations() {
  const qc = useQueryClient();
  const onSuccess = (view) => {
    if (view) qc.setQueryData(CART_KEY, view);
    void qc.invalidateQueries({ queryKey: CART_KEY });
  };

  const add = useMutation({
    mutationFn: ({ variantId, quantity = 1 }) => api.post('/cart/items', { variantId, quantity }),
    onSuccess,
  });
  const setQuantity = useMutation({
    mutationFn: ({ variantId, quantity }) => api.patch(`/cart/items/${variantId}`, { quantity }),
    onSuccess,
  });
  const remove = useMutation({
    mutationFn: (variantId) => api.del(`/cart/items/${variantId}`),
    onSuccess,
  });
  const clear = useMutation({ mutationFn: () => api.del('/cart'), onSuccess });

  return { add, setQuantity, remove, clear };
}
