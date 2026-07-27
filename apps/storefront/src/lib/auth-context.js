import { createContext, useContext } from 'react';

/** Auth konteksti — Provider `auth.jsx` da (fast-refresh: hook/context alohida). */
export const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth faqat AuthProvider ichida ishlaydi');
  }
  return ctx;
}
