import { describe, expect, it } from 'vitest';
import {
  deriveBulkImportState,
  initialBulkImportState
} from '../bulkImport';
import type { BulkImportMessage } from '@/types/import';

describe('deriveBulkImportState', () => {
  it('handles processing sequence', () => {
    const started = deriveBulkImportState(initialBulkImportState, {
      event: 'started',
      import_id: '123',
      actor_id: '999',
      message: 'Bulk import started'
    });

    expect(started.status).toBe('processing');

    const progress = deriveBulkImportState(started, {
      event: 'progress',
      import_id: '123',
      actor_id: '999',
      total: 10,
      processed: 3
    });

    expect(progress.total).toBe(10);
    expect(progress.processed).toBe(3);

    const finished = deriveBulkImportState(progress, {
      event: 'finished',
      import_id: '123',
      actor_id: '999',
      total: 10,
      processed: 10,
      failed: 0
    });

    expect(finished.status).toBe('finished');
    expect(finished.processed).toBe(10);
  });

  it('captures row errors', () => {
    const message: BulkImportMessage = {
      event: 'row_failed',
      import_id: '123',
      actor_id: '999',
      processed: 2,
      total: 5,
      row_data: { full_name: 'Jane', email: 'invalid' },
      error: 'Validation failed'
    };

    const state = deriveBulkImportState(initialBulkImportState, message);

    expect(state.status).toBe('processing');
    expect(state.errors).toHaveLength(1);
    expect(state.errors?.[0].error).toBe('Validation failed');
  });

  it('handles failure events', () => {
    const failed = deriveBulkImportState(initialBulkImportState, {
      event: 'failed',
      import_id: '123',
      actor_id: '999',
      error: 'Something went wrong'
    });

    expect(failed.status).toBe('failed');
    expect(failed.message).toBe('Falha na importação');
  });
});

