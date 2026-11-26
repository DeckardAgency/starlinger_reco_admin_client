/**
 * Order handoff to Starlinger's ERP (abas) through the middleware
 * (backend: OrderErpController / ErpOrderSender). Admin only, plain JSON.
 */

/** ERP_SEND_MODE on the backend: off = nothing happens, log = message is built and logged only, on = real orders. */
export type ErpSendMode = 'off' | 'log' | 'on';

export type ErpStatus =
  | 'pending'
  | 'sending'
  | 'logged'
  | 'failed'
  | 'sent'
  | 'accepted'
  | 'rejected'
  | 'confirmed';

export type ErpLogKind = 'send_order' | 'log_only' | 'result' | 'confirmation' | 'document' | 'ping';

/** One message exchanged with the middleware (out = RECO → middleware, in = callback). */
export interface ErpLogEntry {
  id: number;
  direction: 'out' | 'in';
  kind: ErpLogKind;
  /** Raw message body, usually JSON */
  payload: string | null;
  /** Raw answer body, usually JSON */
  response: string | null;
  httpStatus: number | null;
  error: string | null;
  createdAt: string;
}

/** GET /api/v1/orders/{id}/erp */
export interface OrderErpState {
  mode: ErpSendMode;
  /** null = never handed to abas (drafts, imported legacy orders) */
  status: ErpStatus | null;
  attempts: number;
  /** Last send failure or abas rejection */
  error: string | null;
  erpReference: string | null;
  abasReference: string | null;
  sentAt: string | null;
  resultAt: string | null;
  confirmedAt: string | null;
  /** Net delivery charge sent as the delivery line (a preview until the order is first handed over) */
  deliveryCost: number | null;
  /** What would stop the order from being sent (missing article codes, …) */
  problems: string[];
  /** The message that is (or would be) sent; null for drafts */
  payload: Record<string, unknown> | null;
  canSend: boolean;
  /** Newest first */
  logs: ErpLogEntry[];
}

/** POST /api/v1/orders/{id}/erp/send */
export interface OrderErpSendResponse extends OrderErpState {
  result: 'sent' | 'logged' | 'failed' | 'invalid';
}

/** Error body of the send endpoint (409: switched off, draft, or already with abas). */
export interface OrderErpApiError {
  error: string;
}

export const ERP_STATUS_LABELS: Record<ErpStatus, string> = {
  pending: 'Waiting to be sent',
  sending: 'Sending',
  logged: 'Logged only (not sent)',
  failed: 'Not sent',
  sent: 'Queued at middleware',
  accepted: 'Accepted by abas',
  rejected: 'Rejected by abas',
  confirmed: 'Order confirmation received',
};

export const ERP_MODE_LABELS: Record<ErpSendMode, string> = {
  off: 'Sending switched off',
  log: 'Log only — nothing is sent',
  on: 'Live — sends real orders',
};

export const ERP_LOG_KIND_LABELS: Record<ErpLogKind, string> = {
  send_order: 'Order sent',
  log_only: 'Logged only',
  result: 'abas result',
  confirmation: 'Order confirmation',
  document: 'Document',
  ping: 'Ping',
};
