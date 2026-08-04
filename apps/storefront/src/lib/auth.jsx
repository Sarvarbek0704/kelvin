import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, setAccessToken } from './api';
import { CART_KEY } from './cart';
import { AuthContext } from './auth-context';

/**
 * Mijoz autentifikatsiyasi — access token XOTIRADA, refresh httpOnly cookie'da.
 * Sahifa yuklanganda /auth/refresh token tiklaydi. Login/register'dan keyin
 * mehmon savati mijoz savatiga birlashadi (/cart/merge).
 */
export function AuthProvider({ children }) {
  const qc = useQueryClient();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api
      .post('/auth/refresh')
      .then((res) => {
        setAccessToken(res.accessToken);
        setUser(res.user);
      })
      .catch(() => {
        // Refresh cookie yo'q/eskirgan — mehmon holatida davom etamiz.
      })
      .finally(() => setReady(true));
  }, []);

  const afterAuth = async (res) => {
    setAccessToken(res.accessToken);
    setUser(res.user);
    // Mehmon savatini mijoz savatiga birlashtirish (union+max).
    await api.post('/cart/merge').catch(() => {});
    void qc.invalidateQueries({ queryKey: CART_KEY });
    return res.user;
  };

  // Kirish — email+parol.
  const login = async (email, password) => afterAuth(await api.post('/auth/login', { email, password }));

  // Ro'yxatdan o'tish: 1-qadam (email+parol → kod email'ga), 2-qadam (kodni
  // tasdiqlash → token). Kod hech qachon javobda kelmaydi — faqat email'da.
  const register = async (data) => api.post('/auth/register', data);

  const verifyRegister = async (email, code) =>
    afterAuth(await api.post('/auth/register/verify', { email, code }));

  const resendOtp = async (email) => api.post('/auth/otp/resend', { email });

  // Parol tiklash: kod so'rash → kod+yangi parol (muvaffaqiyatda darhol kiradi).
  const forgotPassword = async (email) => api.post('/auth/password/forgot', { email });

  const resetPassword = async (email, code, password) =>
    afterAuth(await api.post('/auth/password/reset', { email, code, password }));

  const logout = async () => {
    await api.post('/auth/logout').catch(() => {});
    setAccessToken(null);
    setUser(null);
    void qc.invalidateQueries({ queryKey: CART_KEY });
  };

  return (
    <AuthContext.Provider
      value={{ user, ready, login, register, verifyRegister, resendOtp, forgotPassword, resetPassword, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
