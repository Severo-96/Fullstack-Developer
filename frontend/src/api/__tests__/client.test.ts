import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { request, ApiError } from '../client';

const originalFetch = globalThis.fetch;

describe('api/client error handling', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('surface first detail when backend error is Failed to process user', async () => {
    const mockResponse = {
      ok: false,
      status: 422,
      statusText: 'Unprocessable Content',
      headers: {
        get: (name: string) =>
          name.toLowerCase() === 'content-type' ? 'application/json' : null
      },
      json: () =>
        Promise.resolve({
          error: 'Failed to process user',
          details: [
            'Email has already been taken',
            "Password can't be blank"
          ]
        }),
      text: () => Promise.resolve('')
    };

    (globalThis.fetch as unknown as vi.Mock).mockResolvedValueOnce(mockResponse);

    await expect(
      request('/register', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({})
      })
    ).rejects.toMatchObject<ApiError>({
      message: 'E-mail já está em uso',
      status: 422
    });
  });
});

