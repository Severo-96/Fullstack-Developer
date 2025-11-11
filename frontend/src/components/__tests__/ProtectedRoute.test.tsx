import { ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn()
}));

const { useAuth } = await import('@/hooks/useAuth');
const mockedUseAuth = vi.mocked(useAuth);

const renderWithRouter = (ui: ReactNode, initialEntry = '/protected') =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/protected"
          element={<ProtectedRoute>{ui}</ProtectedRoute>}
        />
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/profile" element={<div>Profile Page</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state while session is loading', () => {
    mockedUseAuth.mockReturnValue({
      isLoading: true,
      isAuthenticated: false,
      isAdmin: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshCurrentUser: vi.fn(),
      updateProfile: vi.fn(),
      deleteAccount: vi.fn(),
      token: null,
      user: null
    });

    renderWithRouter(<div>Protected</div>);
    expect(screen.getByText('Carregando sessão...')).toBeInTheDocument();
  });

  it('redirects unauthenticated users to login', () => {
    mockedUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      isAdmin: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshCurrentUser: vi.fn(),
      updateProfile: vi.fn(),
      deleteAccount: vi.fn(),
      token: null,
      user: null
    });

    renderWithRouter(<div>Protected</div>);
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('redirects non-admin users when admin access is required', () => {
    mockedUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      isAdmin: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshCurrentUser: vi.fn(),
      updateProfile: vi.fn(),
      deleteAccount: vi.fn(),
      token: 'token',
      user: { id: 1 } as any
    });

    render(
      <MemoryRouter initialEntries={['/admin-area']}>
        <Routes>
          <Route
            path="/admin-area"
            element={
              <ProtectedRoute requireAdmin>
                <div>Admin Area</div>
              </ProtectedRoute>
            }
          />
          <Route path="/profile" element={<div>Profile Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Profile Page')).toBeInTheDocument();
  });

  it('renders children when authenticated and requirements satisfied', () => {
    mockedUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      isAdmin: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshCurrentUser: vi.fn(),
      updateProfile: vi.fn(),
      deleteAccount: vi.fn(),
      token: 'token',
      user: { id: 1 } as any
    });

    renderWithRouter(<div>Protected Content</div>);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});

