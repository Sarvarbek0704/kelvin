import { create } from 'zustand';
import type { AuthUserView, Permission } from '@kelvin/contracts';

interface AuthState {
  /** Access token — FAQAT xotirada (localStorage EMAS, XSS himoyasi). */
  accessToken: string | null;
  user: AuthUserView | null;
  /** Ilova yuklanganda refresh urinildimi (loading holatini boshqarish). */
  bootstrapped: boolean;
  setSession: (accessToken: string, user: AuthUserView) => void;
  clear: () => void;
  setBootstrapped: () => void;
  can: (permission: Permission) => boolean;
}

export const useAuth = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  bootstrapped: false,
  setSession: (accessToken, user) => set({ accessToken, user }),
  clear: () => set({ accessToken: null, user: null }),
  setBootstrapped: () => set({ bootstrapped: true }),
  can: (permission) => get().user?.permissions.includes(permission) ?? false,
}));
