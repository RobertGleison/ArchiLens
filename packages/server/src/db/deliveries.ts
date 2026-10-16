import type { Db } from './connection.js';
import { NOW_SQL } from './sql.js';

export type DeliveryChannel = 'in_app' | 'email' | 'slack' | 'teams' | 'rss';
export type DeliveryStatus = 'pending' | 'sent' | 'failed';

export interface Delivery {
  id: number;
  reportId: number;
  channel: DeliveryChannel;
  status: DeliveryStatus;
  /** Channel-specific destination (e.g. email address); null when implied by the channel. */
  target: string | null;
  error: string | null;
  createdAt: string;
  sentAt: string | null;
  updatedAt: string;
}

export interface NewDelivery {
  reportId: number;
  channel: DeliveryChannel;
  target?: string | null;
}

interface DeliveryRow {
  id: number;
  report_id: number;
  channel: DeliveryChannel;
  status: DeliveryStatus;
  target: string | null;
  error: string | null;
  created_at: string;
  sent_at: string | null;
  updated_at: string;
}

function toDelivery(row: DeliveryRow): Delivery {
  return {
    id: row.id,
    reportId: row.report_id,
    channel: row.channel,
    status: row.status,
    target: row.target,
    error: row.error,
    createdAt: row.created_at,
    sentAt: row.sent_at,
    updatedAt: row.updated_at,
  };
}

/** Records a pending delivery of a report through a channel. */
export function createDelivery(db: Db, input: NewDelivery): Delivery {
  const row = db
    .prepare('INSERT INTO deliveries (report_id, channel, target) VALUES (?, ?, ?) RETURNING *')
    .get(input.reportId, input.channel, input.target ?? null) as DeliveryRow;
  return toDelivery(row);
}

export function getDelivery(db: Db, id: number): Delivery | undefined {
  const row = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(id) as
    DeliveryRow | undefined;
  return row && toDelivery(row);
}

export function listDeliveriesForReport(db: Db, reportId: number): Delivery[] {
  const rows = db
    .prepare('SELECT * FROM deliveries WHERE report_id = ? ORDER BY id')
    .all(reportId) as DeliveryRow[];
  return rows.map(toDelivery);
}

/** Deliveries with the given status, oldest first. */
export function listDeliveriesByStatus(db: Db, status: DeliveryStatus): Delivery[] {
  const rows = db
    .prepare('SELECT * FROM deliveries WHERE status = ? ORDER BY created_at, id')
    .all(status) as DeliveryRow[];
  return rows.map(toDelivery);
}

export function markDeliverySent(db: Db, id: number): Delivery | undefined {
  const row = db
    .prepare(
      `UPDATE deliveries
       SET status = 'sent', error = NULL, sent_at = ${NOW_SQL}, updated_at = ${NOW_SQL}
       WHERE id = ? RETURNING *`,
    )
    .get(id) as DeliveryRow | undefined;
  return row && toDelivery(row);
}

export function markDeliveryFailed(db: Db, id: number, error: string): Delivery | undefined {
  const row = db
    .prepare(
      `UPDATE deliveries SET status = 'failed', error = ?, updated_at = ${NOW_SQL}
       WHERE id = ? RETURNING *`,
    )
    .get(error, id) as DeliveryRow | undefined;
  return row && toDelivery(row);
}
