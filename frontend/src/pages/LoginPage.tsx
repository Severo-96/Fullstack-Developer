import { FormEvent, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { isValidEmail } from '@/utils/validators';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: Location })?.from?.pathname;

  if (isAuthenticated && !isLoading) {
    return <Navigate to={from || '/profile'} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isValidEmail(email) || password.length === 0) {
      setError('Informe um e-mail válido e a senha');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const user = await login(email, password);
      navigate(user.role === 'admin' ? '/admin' : '/profile', { replace: true });
    } catch (exception) {
      setError(
        exception instanceof Error ? exception.message : 'Falha no login. Tente novamente.'
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <div className="card shadow-sm border-0">
          <div className="card-body p-4">
            <h1 className="h3 mb-3 text-center">Bem-vindo de volta</h1>
            <p className="text-muted text-center mb-4">
              Entre para acessar o painel
            </p>

            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-3">
                <label htmlFor="login-email" className="form-label">
                  E-mail
                </label>
                <input
                  id="login-email"
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="mb-3">
                <label htmlFor="login-password" className="form-label">
                  Senha
                </label>
                <input
                  id="login-password"
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="current-password"
                  minLength={6}
                />
              </div>

              <div className="d-grid">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Entrando...' : 'Entrar'}
                </button>
              </div>
            </form>

            <p className="mt-3 mb-0 text-center text-muted">
              Novo por aqui? <Link to="/register">Criar uma conta</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

