import { translateMessage } from '@/api/client';

export interface BulkImportState {
  status: 'idle' | 'queued' | 'processing' | 'finished' | 'failed';
  processed: number;
  total: number;
  failed: number;
  message?: string;
  errors: BulkImportMessage['errors'];
  lastEvent?: BulkImportMessage['event'];
}

interface BulkImportProgressProps {
  state: BulkImportState;
  onReset: () => void;
}

const BulkImportProgress = ({ state, onReset }: BulkImportProgressProps) => {
  if (state.status === 'idle') return null;

  const progress =
    state.total > 0 ? Math.round(((state.processed + state.failed) / state.total) * 100) : 0;

  return (
    <div className="card shadow-sm border-0 mt-4">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="card-title mb-0">Progresso da importação em massa</h5>
            <small className="text-muted text-uppercase">
              {state.status === 'queued' && 'Na fila'}
              {state.status === 'processing' && 'Processando'}
              {state.status === 'finished' && 'Concluído'}
              {state.status === 'failed' && 'Falhou'}
            </small>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={onReset}
          >
            Limpar
          </button>
        </div>

        {state.total > 0 && (
          <div className="progress mb-3" style={{ height: '1.5rem' }}>
            <div
              className={`progress-bar ${
                state.status === 'failed' ? 'bg-danger' : 'bg-primary'
              }`}
              role="progressbar"
              style={{ width: `${progress}%` }}
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              {progress}%
            </div>
          </div>
        )}

        <dl className="row mb-0">
          <dt className="col-sm-3">Processados com sucesso</dt>
          <dd className="col-sm-9">
            {state.processed} {state.total ? `de ${state.total}` : ''}
          </dd>
          <dt className="col-sm-3">Com falha</dt>
          <dd className="col-sm-9">{state.failed}</dd>
          {state.message && (
            <>
              <dt className="col-sm-3">Mensagem</dt>
              <dd className="col-sm-9">{state.message}</dd>
            </>
          )}
        </dl>

        {state.errors && state.errors.length > 0 && (
          <div className="alert alert-warning mt-3" role="alert">
            <h6 className="alert-heading">Linhas com falha ({state.errors.length})</h6>
            <ul className="small mb-0">
              {state.errors.map((error, index) => {
                const messages = normalizeErrorMessages(error.error);
                return (
                  <li key={`${index}-${messages.join('|')}-${JSON.stringify(error.row)}`}>
                    <strong>{messages.join(' • ')}</strong>
                    {error.row && (
                      <>
                        {': '}
                        <code>{JSON.stringify(error.row)}</code>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkImportProgress;

type BulkImportErrorEntry = NonNullable<BulkImportState['errors']>[number];

function normalizeErrorMessages(error: BulkImportErrorEntry['error']): string[] {
  if (!error) return ['Erro desconhecido'];

  const base = Array.isArray(error) ? error : [error];
  const translated = base
    .map((message) => translateMessage(
      typeof message === 'string' ? message : String(message)
    ))
    .map((message) => message.trim())
    .filter((message) => message.length > 0);

  return translated.length > 0 ? translated : ['Erro desconhecido'];
}

