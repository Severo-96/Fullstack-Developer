import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import BulkImportProgress, { BulkImportState } from '../BulkImportProgress';

const baseState: BulkImportState = {
  status: 'queued',
  processed: 0,
  total: 0,
  failed: 0,
  errors: []
};

describe('BulkImportProgress', () => {
  it('renders nothing when state is idle', () => {
    const { container } = render(
      <BulkImportProgress state={{ ...baseState, status: 'idle' }} onReset={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('displays progress information and errors', () => {
    const handleReset = vi.fn();
    const state: BulkImportState = {
      status: 'processing',
      processed: 3,
      total: 5,
      failed: 1,
      message: 'Processando...',
      errors: [
        {
          event: 'row_failed',
          import_id: '123',
          actor_id: '456',
          row: { email: 'invalid@example.com' },
          error: 'Invalid email'
        }
      ],
      lastEvent: 'row_failed'
    };

    render(<BulkImportProgress state={state} onReset={handleReset} />);

    expect(screen.getByText('Progresso da importação em massa')).toBeInTheDocument();
    expect(screen.getByText('Processando')).toBeInTheDocument();
    expect(screen.getByText('Processando...')).toBeInTheDocument();
    expect(screen.getByText('Processados com sucesso')).toBeInTheDocument();
    expect(screen.getByText('3 de 5')).toBeInTheDocument();
    expect(screen.getByText('Com falha')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText(/Linhas com falha/)).toBeInTheDocument();
    expect(screen.getByText(/Invalid email/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /limpar/i }));
    expect(handleReset).toHaveBeenCalled();
  });

  it('renders completed state with progress bar', () => {
    const state: BulkImportState = {
      status: 'finished',
      processed: 4,
      total: 4,
      failed: 0,
      message: 'Importação concluída com sucesso',
      errors: [],
      lastEvent: 'finished'
    };

    render(<BulkImportProgress state={state} onReset={vi.fn()} />);

    expect(screen.getByText('Concluído')).toBeInTheDocument();
    expect(screen.getByText('Importação concluída com sucesso')).toBeInTheDocument();
    expect(screen.getByText('4 de 4')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });
});

