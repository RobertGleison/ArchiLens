import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestDb, seedReport } from '../test/db.js';
import type { Db } from './connection.js';
import {
  createDelivery,
  getDelivery,
  listDeliveriesByStatus,
  listDeliveriesForReport,
  markDeliveryFailed,
  markDeliverySent,
} from './deliveries.js';
import { deleteReport } from './reports.js';

let db: Db;
beforeEach(() => {
  db = createTestDb();
});
afterEach(() => {
  db.close();
});

describe('deliveries', () => {
  it('creates a pending delivery for a report', () => {
    const report = seedReport(db);
    const d = createDelivery(db, { reportId: report.id, channel: 'email', target: 'me@x.dev' });

    expect(d).toMatchObject({
      reportId: report.id,
      channel: 'email',
      status: 'pending',
      target: 'me@x.dev',
      error: null,
      sentAt: null,
    });
    expect(getDelivery(db, d.id)).toEqual(d);
  });

  it('rejects unknown channels', () => {
    const report = seedReport(db);
    expect(() => createDelivery(db, { reportId: report.id, channel: 'fax' as never })).toThrow(
      /CHECK/,
    );
  });

  it('marks failed with an error, then sent clearing the error', () => {
    const report = seedReport(db);
    const d = createDelivery(db, { reportId: report.id, channel: 'slack' });

    expect(markDeliveryFailed(db, d.id, 'webhook 500')).toMatchObject({
      status: 'failed',
      error: 'webhook 500',
      sentAt: null,
    });

    const sent = markDeliverySent(db, d.id);
    expect(sent).toMatchObject({ status: 'sent', error: null });
    expect(sent?.sentAt).not.toBeNull();
    expect(markDeliverySent(db, 999)).toBeUndefined();
  });

  it('lists by report and by status', () => {
    const report = seedReport(db);
    const a = createDelivery(db, { reportId: report.id, channel: 'in_app' });
    const b = createDelivery(db, { reportId: report.id, channel: 'rss' });
    const c = createDelivery(db, { reportId: seedReport(db).id, channel: 'teams' });
    markDeliverySent(db, b.id);

    expect(listDeliveriesForReport(db, report.id).map((d) => d.id)).toEqual([a.id, b.id]);
    expect(listDeliveriesByStatus(db, 'pending').map((d) => d.id)).toEqual([a.id, c.id]);
  });

  it('cascades when the report is deleted', () => {
    const report = seedReport(db);
    const d = createDelivery(db, { reportId: report.id, channel: 'in_app' });
    deleteReport(db, report.id);
    expect(getDelivery(db, d.id)).toBeUndefined();
  });
});
