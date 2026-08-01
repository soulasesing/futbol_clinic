export type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: BodyInit | Record<string, unknown> | unknown[];
  token?: string | null;
};

export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');

const getErrorMessage = (payload: unknown): string => {
  if (payload && typeof payload === 'object') {
    const value = payload as Record<string, unknown>;
    if (typeof value.message === 'string') return value.message;
    if (typeof value.error === 'string') return value.error;
  }
  return 'No fue posible completar la solicitud.';
};

const clearSuspendedSession = (status: number, payload: unknown): void => {
  if (
    status !== 403
    || !payload
    || typeof payload !== 'object'
    || (payload as Record<string, unknown>).code !== 'TENANT_SUSPENDED'
    || typeof window === 'undefined'
  ) return;
  const loginPath = localStorage.getItem('loginPath') || '/';
  localStorage.removeItem('jwt');
  localStorage.removeItem('user');
  localStorage.removeItem('lastActivityAt');
  window.location.assign(
    `${loginPath}${loginPath.includes('?') ? '&' : '?'}suspended=1`
  );
};

const clearUnauthorizedSession = (status: number): void => {
  if (status !== 401 || typeof window === 'undefined') return;
  const loginPath = localStorage.getItem('loginPath') || '/login';
  localStorage.removeItem('jwt');
  localStorage.removeItem('user');
  localStorage.removeItem('lastActivityAt');
  const separator = loginPath.includes('?') ? '&' : '?';
  window.location.assign(`${loginPath}${separator}expired=1`);
};

export const apiRequest = async <T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> => {
  const token = options.token ?? (
    typeof window !== 'undefined' ? localStorage.getItem('jwt') : null
  );
  const isFormData = options.body instanceof FormData;
  const headers = new Headers(options.headers);

  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
    ...options,
    headers,
    body: options.body && !isFormData && typeof options.body !== 'string'
      ? JSON.stringify(options.body)
      : options.body as BodyInit | undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  let payload: unknown;
  if (response.status !== 204) {
    payload = contentType.includes('application/json')
      ? await response.json()
      : await response.text();
  }

  if (!response.ok) {
    clearSuspendedSession(response.status, payload);
    clearUnauthorizedSession(response.status);
    throw new ApiError(getErrorMessage(payload), response.status, payload);
  }

  return payload as T;
};

export const apiBlob = async (
  path: string,
  token?: string | null,
): Promise<Blob> => {
  const authToken = token ?? (
    typeof window !== 'undefined' ? localStorage.getItem('jwt') : null
  );
  const headers = new Headers();
  if (authToken) headers.set('Authorization', `Bearer ${authToken}`);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const response = await fetch(`${API_BASE_URL}${normalizedPath}`, { headers });
  if (!response.ok) {
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      payload = undefined;
    }
    clearSuspendedSession(response.status, payload);
    clearUnauthorizedSession(response.status);
    throw new ApiError(getErrorMessage(payload), response.status, payload);
  }
  return response.blob();
};

export const api = {
  get: <T>(path: string, token?: string | null): Promise<T> =>
    apiRequest<T>(path, { method: 'GET', token }),
  post: <T>(path: string, body?: ApiRequestOptions['body'], token?: string | null): Promise<T> =>
    apiRequest<T>(path, { method: 'POST', body, token }),
  patch: <T>(path: string, body?: ApiRequestOptions['body'], token?: string | null): Promise<T> =>
    apiRequest<T>(path, { method: 'PATCH', body, token }),
  blob: (path: string, token?: string | null): Promise<Blob> =>
    apiBlob(path, token),
};

export const unwrapCollection = <T>(value: unknown, key: string): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record[key])) return record[key] as T[];
    if (record.data && typeof record.data === 'object') {
      const data = record.data as Record<string, unknown>;
      if (Array.isArray(data[key])) return data[key] as T[];
    }
  }
  return [];
};
