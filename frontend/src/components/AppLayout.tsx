import { PropsWithChildren } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const AppLayout = ({ children }: PropsWithChildren) => {
  const navigate = useNavigate();
  const { user, isAdmin, logout, isAuthenticated } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
        <div className="container">
          <Link to="/" className="navbar-brand">
            Umanni Users
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <div className="d-flex align-items-center gap-2 me-auto mb-2 mb-lg-0">
              {isAuthenticated && isAdmin && (
                <Link className="btn btn-outline-light btn-sm" to="/admin">
                  Dashboard
                </Link>
              )}
              {isAuthenticated && (
                <Link className="btn btn-outline-light btn-sm" to="/profile">
                  Profile
                </Link>
              )}
            </div>
            <div className="d-flex align-items-center gap-3">
              {user && (
                <div className="text-white small">
                  <div>{user.full_name}</div>
                  <div className="text-opacity-75">{user.email}</div>
                </div>
              )}
              {isAuthenticated ? (
                <button
                  type="button"
                  className="btn btn-outline-light btn-sm"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              ) : (
                <div className="d-flex gap-2">
                  <Link to="/login" className="btn btn-outline-light btn-sm">
                    Login
                  </Link>
                  <Link to="/register" className="btn btn-light btn-sm">
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow-1">
        <div className="container py-4">{children}</div>
      </main>

      <footer className="bg-light py-3 border-top">
        <div className="container text-center text-muted small">
          <span>Umanni Fullstack Assessment &middot; {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;

