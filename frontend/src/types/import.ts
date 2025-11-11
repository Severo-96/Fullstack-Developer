export type BulkImportEvent =
  | 'queued'
  | 'started'
  | 'processing'
  | 'progress'
  | 'row_failed'
  | 'finished'
  | 'failed';

export interface BulkImportMessage {
  import_id: string;
  actor_id: string;
  event: BulkImportEvent;
  message?: string;
  total?: number;
  processed?: number;
  failed?: number;
  errors?: Array<{ row: Record<string, unknown>; error: string | string[] }>;
  row_data?: Record<string, unknown>;
  error?: string;
}

export interface BulkImportResponse {
  import_id: string;
  actor_id: string;
  status: 'queued';
}

