import type { BulkImportMessage } from '@/types/import';
import type { BulkImportState } from '@/components/BulkImportProgress';

export const initialBulkImportState: BulkImportState = {
  status: 'idle',
  processed: 0,
  total: 0,
  failed: 0,
  errors: []
};

export function deriveBulkImportState(
  previous: BulkImportState,
  message: BulkImportMessage
): BulkImportState {
  switch (message.event) {
    case 'queued':
      return {
        status: 'queued',
        processed: message.processed ?? 0,
        total: message.total ?? 0,
        failed: message.failed ?? 0,
        errors: message.errors || [],
        message: 'Na fila para processamento',
        lastEvent: message.event
      };
    case 'started':
    case 'processing':
      return {
        ...previous,
        status: 'processing',
        processed: message.processed ?? previous.processed,
        total: message.total ?? previous.total,
        failed: message.failed ?? previous.failed,
        errors: message.errors || [],
        message: 'Processando',
        lastEvent: message.event
      };
    case 'progress':
      return {
        ...previous,
        status: 'processing',
        processed: message.processed ?? previous.processed,
        total: message.total ?? previous.total,
        failed: message.failed ?? previous.failed,
        errors: message.errors || previous.errors,
        message: message.message ?? previous.message,
        lastEvent: message.event
      };
    case 'row_failed':
      return {
        ...previous,
        status: 'processing',
        processed: message.processed ?? previous.processed,
        total: message.total ?? previous.total,
        failed: (message.failed ?? previous.failed) + 1,
        errors: [
          ...(previous.errors ?? []),
          ...(message.errors ?? []),
          ...(message.row_data
            ? [{ row: message.row_data, error: message.error ?? 'Desconhecido' }]
            : [])
        ],
        lastEvent: message.event
      };
    case 'finished':
      return {
        ...previous,
        status: 'finished',
        processed: message.processed ?? previous.processed,
        total: message.total ?? previous.total,
        failed: message.failed ?? previous.failed,
        errors: message.errors || [],
        message:
          (message.failed ?? previous.failed ?? 0) > 0
            ? 'Importação concluída'
            : 'Importação concluída com sucesso',
        lastEvent: message.event
      };
    case 'failed':
      return {
        ...previous,
        status: 'failed',
        processed: message.processed ?? previous.processed,
        total: message.total ?? previous.total,
        failed: message.failed ?? previous.failed,
        errors: message.errors || [],
        message: message.message ?? 'Falha na importação',
        lastEvent: message.event
      };
    default:
      return previous;
  }
}

