import { describe, expect, it, vi, beforeAll, afterAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import UsersCountCard from '../UsersCountCard';

describe('UsersCountCard', () => {
  const originalDate = Date;

  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('renders placeholder when counts are not available', () => {
    render(<UsersCountCard counts={null} />);
    expect(
      screen.getByText('Aguardando estatísticas de usuários...')
    ).toBeInTheDocument();
  });

  it('renders counts summary when data is provided', () => {
    const snapshot = {
      total: 10,
      admin: 3,
      non_admin: 7,
      updated_at: '2025-11-11T12:34:56Z'
    };

    render(<UsersCountCard counts={snapshot} />);

    expect(screen.getByText('Total de usuários')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Administradores')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Usuários padrão')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();

    const formattedTime = new Date(snapshot.updated_at).toLocaleTimeString();
    expect(
      screen.getByText((content) => content.includes('Atualizado às'))
    ).toHaveTextContent(formattedTime);
  });
});

