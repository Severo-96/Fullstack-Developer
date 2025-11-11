const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

let authToken: string | null = null;

export class ApiError extends Error {
  readonly status: number;
  readonly data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const clearAuthToken = () => {
  authToken = null;
};

export const getAuthToken = () => authToken;

export interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function request<T>(
  path: string,
  { skipAuth = false, ...options }: RequestOptions = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const method = options.method || 'GET';
  const headers = new Headers(options.headers || {});
  const isFormData = options.body instanceof FormData;

  if (!isFormData && method !== 'GET' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  headers.set('Accept', 'application/json');

  if (!skipAuth && authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  const response = await fetch(url, {
    ...options,
    method,
    headers
  });

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    const message =
      (payload && extractErrorMessage(payload)) || response.statusText;
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

async function parseResponseBody(response: Response) {
  const contentType = response.headers.get('Content-Type') || '';

  if (contentType.includes('application/json')) {
    return response.status === 204 ? null : response.json();
  }

  return response.text().catch(() => null);
}

function extractErrorMessage(data: unknown): string | undefined {
  if (!data) return undefined;

  if (typeof data === 'string') {
    return data;
  }

  if (typeof data === 'object') {
    const record = data as Record<string, unknown>;

    if (typeof record.error === 'string') {
      return record.error;
    }

    if (Array.isArray(record.errors)) {
      return record.errors.join(', ');
    }
  }

  return undefined;
}

