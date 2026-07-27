/**
 * Storefront API client — ommaviy katalog/qidiruv.
 *
 * ⚠️ Commit qilingan hardcode ma'lumot O'RNIGA. Narx/qoldiq har doim serverdan.
 * Vite dev'da `/api` → :3000 proxy (vite.config.js).
 */
const BASE = '/api/v1';

export class ApiError extends Error {
  constructor(status, problem) {
    super(problem?.detail || problem?.title || 'Xatolik');
    this.name = 'ApiError';
    this.status = status;
    this.problem = problem;
  }
}

// ⚠️ Access token XOTIRADA (localStorage'da EMAS — XSS'ga kamroq ta'sirlanadi).
// Refresh token httpOnly cookie'da; sahifa qayta yuklanganda /auth/refresh tiklaydi.
let accessToken = null;
export function setAccessToken(token) {
  accessToken = token ?? null;
}
export function getAccessToken() {
  return accessToken;
}

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'include', // cart_token / refresh cookie'lari
    headers: {
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...(accessToken !== null && { Authorization: `Bearer ${accessToken}` }),
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
  const data = res.status === 204 ? undefined : await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, data);
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  del: (path) => request(path, { method: 'DELETE' }),
};

import i18n from '../i18n';

/**
 * Ko'p tilli matndan joriy tilga mos ko'rsatish.
 *
 * ⚠️ Joriy til `uz` bo'lsa uz-Latn afzal (yo'q bo'lsa ru'ga tushadi); aks holda
 *    ru afzal. Dizayn ruscha, lekin katalog ma'lumoti ikki tilli — til
 *    almashtirilganda mahsulot/kategoriya nomlari mos tilda chiqadi.
 */
export function label(text) {
  if (!text) return '';
  const uzFirst = (i18n.language ?? 'ru').startsWith('uz');
  const order = uzFirst
    ? [text['uz-Latn'], text.ru, text['uz-Cyrl']]
    : [text.ru, text['uz-Latn'], text['uz-Cyrl']];
  return order.find((v) => v) ?? Object.values(text)[0] ?? '';
}
