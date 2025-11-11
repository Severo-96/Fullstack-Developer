const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const ERROR_TRANSLATIONS: Record<string, string> = {
  'Failed to process user': 'Falha ao processar usuário',
  'User not found': 'Usuário não encontrado',
  'Invalid credentials': 'Credenciais inválidas',
  'Missing parameter': 'Parâmetro obrigatório ausente',
  'file parameter is required': 'O arquivo é obrigatório',
  'file must be a CSV or Excel spreadsheet':
    'O arquivo deve ser um CSV ou planilha Excel',
  'file size must be 5MB or less': 'O arquivo deve ter no máximo 5MB',
  'Email has already been taken': 'E-mail já está em uso',
  "Full name can't be blank": 'Nome completo é obrigatório',
  "Email can't be blank": 'E-mail é obrigatório',
  'Email is invalid': 'E-mail inválido',
  "Password can't be blank": 'Senha é obrigatória',
  'Password is too short (minimum is 6 characters)':
    'Senha muito curta (mínimo de 6 caracteres)',
  'Import failed': 'Falha na importação',
  'Bulk import failed to start': 'Não foi possível iniciar a importação em massa',
  'Unable to delete user': 'Não foi possível excluir o usuário',
  'Unable to toggle role': 'Não foi possível alterar a função',
  'Unable to load users': 'Não foi possível carregar os usuários'
};

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
      (payload && extractErrorMessage(payload)) ||
      translateMessage(response.statusText);
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
    return translateMessage(data);
  }

  if (typeof data === 'object') {
    const record = data as Record<string, unknown>;

    const errorMessage =
      typeof record.error === 'string' ? record.error : undefined;

    const detail = extractFirstDetail(record.details);
    if (errorMessage === 'Failed to process user' && detail) {
      return translateMessage(detail);
    }

    if (errorMessage) {
      return translateMessage(errorMessage);
    }

    if (detail) {
      return translateMessage(detail);
    }

    if (Array.isArray(record.errors)) {
      const first = record.errors.find(
        (item): item is string => typeof item === 'string' && item.trim().length > 0
      );
      if (first) {
        return translateMessage(stripGenericPrefixes(first));
      }
    }
  }

  return undefined;
}

function extractFirstDetail(details: unknown): string | undefined {
  if (!details) return undefined;

  if (typeof details === 'string') {
    return stripGenericPrefixes(details);
  }

  if (Array.isArray(details)) {
    const first = details.find(
      (item): item is string => typeof item === 'string' && item.trim().length > 0
    );
    return first ? stripGenericPrefixes(first) : undefined;
  }

  return undefined;
}

function stripGenericPrefixes(message: string): string {
  return message.replace(/^Validation failed:\s*/i, '').trim();
}

function translateMessage(message: string): string {
  const trimmed = message.trim();
  return ERROR_TRANSLATIONS[trimmed] ?? trimmed;
}

