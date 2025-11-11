import React, { ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/api/auth', () => ({
  fetchCurrentUser: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  updateProfile: vi.fn(),
  deleteProfile: vi.fn()
}));

vi.mock('@/api/client', () => ({
  setAuthToken: vi.fn(),
  clearAuthToken: vi.fn()
}));

import { AuthProvider, AuthContext } from '../AuthContext';
import * as authApi from '@/api/auth';
import * as clientApi from '@/api/client';

const mockAuth = vi.mocked(authApi);
const mockClient = vi.mocked(clientApi);

const adminUser = {
  id: 1,
  full_name: 'Admin User',
  email: 'admin@example.com',
  role: 'admin' as const,
  created_at: '',
  updated_at: ''
};

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

const renderWithProvider = async (children: ReactNode) => {
  const result = render(<AuthProvider>{children}</AuthProvider>);
  await flushPromises();
  return result;
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mockAuth.fetchCurrentUser.mockResolvedValue(adminUser);
});

describe('AuthContext', () => {
  it('logs in and stores token', async () => {
    mockAuth.login.mockResolvedValue('token-123');

    const TestComponent = () => {
      const auth = React.useContext(AuthContext);
      if (!auth) throw new Error('missing context');
      return (
        <>
          <span data-testid="current-email">{auth.user?.email ?? 'guest'}</span>
          <button onClick={() => auth.login('admin@example.com', 'password')}>
            login
          </button>
        </>
      );
    };

    await renderWithProvider(<TestComponent />);

    const user = userEvent.setup();
    await user.click(screen.getByText('login'));

    await waitFor(() =>
      expect(screen.getByTestId('current-email')).toHaveTextContent('admin@example.com')
    );
    expect(mockAuth.login).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'password'
    });
    expect(mockClient.setAuthToken).toHaveBeenCalledWith('token-123');
    expect(localStorage.getItem('umanni_frontend_token')).toBe('token-123');
  });

  it('registers and fetches user', async () => {
    mockAuth.register.mockResolvedValue('token-999');

    const TestComponent = () => {
      const auth = React.useContext(AuthContext);
      if (!auth) throw new Error('missing context');
      return (
        <>
          <span data-testid="user-role">{auth.user?.role ?? 'guest'}</span>
          <button
            onClick={() =>
              auth.register({
                full_name: 'New User',
                email: 'new@example.com',
                password: 'password123'
              })
            }
          >
            register
          </button>
        </>
      );
    };

    await renderWithProvider(<TestComponent />);

    const user = userEvent.setup();
    await user.click(screen.getByText('register'));

    await waitFor(() =>
      expect(screen.getByTestId('user-role')).toHaveTextContent('admin')
    );
    expect(mockAuth.register).toHaveBeenCalled();
    expect(mockClient.setAuthToken).toHaveBeenCalledWith('token-999');
  });

  it('logs out and clears session', async () => {
    mockAuth.login.mockResolvedValue('token-clear');

    const TestComponent = () => {
      const auth = React.useContext(AuthContext);
      if (!auth) throw new Error('missing context');
      return (
        <>
          <span data-testid="status">{auth.isAuthenticated ? 'auth' : 'guest'}</span>
          <button onClick={() => auth.login('admin@example.com', 'password')}>login</button>
          <button onClick={() => auth.logout()}>logout</button>
        </>
      );
    };

    await renderWithProvider(<TestComponent />);

    const user = userEvent.setup();
    await user.click(screen.getByText('login'));
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('auth')
    );

    await user.click(screen.getByText('logout'));

    expect(screen.getByTestId('status')).toHaveTextContent('guest');
    expect(mockClient.clearAuthToken).toHaveBeenCalled();
    expect(localStorage.getItem('umanni_frontend_token')).toBeNull();
  });

  it('clears session on refresh failure', async () => {
    mockAuth.login.mockResolvedValue('token-refresh');
    const TestComponent = () => {
      const auth = React.useContext(AuthContext);
      if (!auth) throw new Error('missing context');
      return (
        <>
          <button onClick={() => auth.login('admin@example.com', 'password')}>
            login
          </button>
          <button onClick={() => auth.refreshCurrentUser()}>refresh</button>
        </>
      );
    };

    await renderWithProvider(<TestComponent />);

    const user = userEvent.setup();
    await user.click(screen.getByText('login'));
    await waitFor(() =>
      expect(localStorage.getItem('umanni_frontend_token')).toBe('token-refresh')
    );

    mockAuth.fetchCurrentUser.mockRejectedValueOnce(new Error('invalid'));

    await user.click(screen.getByText('refresh'));

    await waitFor(() => expect(mockClient.clearAuthToken).toHaveBeenCalled());
  });
});

