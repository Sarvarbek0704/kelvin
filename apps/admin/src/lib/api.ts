import type { AuthTokensResponse, ProblemDetails } from '@kelvin/contracts';
import { useAuth } from './auth-store';

const BASE = '/api/v1';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly problem: ProblemDetails,
  ) {
    super(problem.detail || problem.title);
    this.name = 'ApiError';
  }
}

/**
 * ⚠️ SINGLE-FLIGHT REFRESH: bir vaqtda 10 ta 401 kelsa ham FAQAT BITTA
 *    /auth/refresh yuboriladi. Boshqalar shu promise'ni kutadi.
 *    docs/15-roadmap.md §2.3 (Faza 0 DoD)
 */
let refreshInFlight: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  refreshInFlight ??= (async (): Promise<boolean> => {
    try {
      const res = await fetch(`${BASE}/auth/refresh`, { method: 'POST', credentials: 'include' });
      if (!res.ok) {
        return false;
      }
      const data = (await res.json()) as AuthTokensResponse;
      useAuth.getState().setSession(data.accessToken, data.user);
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** 401'da refresh + retry qilinmasin (masalan, login/refresh o'zi). */
  noRetry?: boolean;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const exec = async (): Promise<Response> => {
    const token = useAuth.getState().accessToken;
    return fetch(`${BASE}${path}`, {
      method: opts.method ?? 'GET',
      credentials: 'include',
      headers: {
        ...(opts.body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token !== null && { Authorization: `Bearer ${token}` }),
      },
      ...(opts.body !== undefined && { body: JSON.stringify(opts.body) }),
    });
  };

  let res = await exec();

  // 401 → single-flight refresh → bir marta retry.
  if (res.status === 401 && !opts.noRetry) {
    const ok = await doRefresh();
    if (ok) {
      res = await exec();
    } else {
      useAuth.getState().clear();
    }
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const data: unknown = res.status === 204 ? undefined : await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, data as ProblemDetails);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string): Promise<T> => request<T>(path),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> =>
    request<T>(path, { method: 'POST', body, ...opts }),
  patch: <T>(path: string, body?: unknown): Promise<T> =>
    request<T>(path, { method: 'PATCH', body }),
  del: <T>(path: string): Promise<T> => request<T>(path, { method: 'DELETE' }),
  refresh: doRefresh,
};

/** Login — access token + user. Refresh cookie serverdan keladi. */
export async function login(identifier: string, password: string): Promise<AuthTokensResponse> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, data as ProblemDetails);
  }
  return data as AuthTokensResponse;
}

export async function logout(): Promise<void> {
  await fetch(`${BASE}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(
    () => undefined,
  );
  useAuth.getState().clear();
}
