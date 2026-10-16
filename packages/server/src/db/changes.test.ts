import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestDb, seedReport } from '../test/db.js';
import {
  addEvidence,
  createChange,
  deleteChange,
  getChange,
  listChangesForReport,
} from './changes.js';
import type { Db } from './connection.js';
import { deleteReport } from './reports.js';

let db: Db;
beforeEach(() => {
  db = createTestDb();
});
afterEach(() => {
  db.close();
});

describe('changes and evidence', () => {
  it('creates a change with evidence of every kind', () => {
    const report = seedReport(db);
    const change = createChange(db, {
      reportId: report.id,
      changeType: 'added',
      category: 'datastore',
      title: 'Introduced Redis cache',
      description: 'Sessions now cached in Redis',
      evidence: [
        { kind: 'commit', ref: 'abc123', url: 'https://github.com/a/b/commit/abc123' },
        { kind: 'pr', ref: '42', url: 'https://github.com/a/b/pull/42', note: 'Add cache' },
        { kind: 'file', ref: 'src/cache/redis.ts' },
        { kind: 'url', ref: 'https://redis.io' },
      ],
    });

    expect(change).toMatchObject({
      reportId: report.id,
      changeType: 'added',
      category: 'datastore',
      title: 'Introduced Redis cache',
    });
    expect(change.evidence.map((e) => [e.kind, e.ref])).toEqual([
      ['commit', 'abc123'],
      ['pr', '42'],
      ['file', 'src/cache/redis.ts'],
      ['url', 'https://redis.io'],
    ]);
    expect(change.evidence[1]).toMatchObject({ changeId: change.id, note: 'Add cache' });
    expect(getChange(db, change.id)).toEqual(change);
  });

  it('rolls back the change when any evidence row is invalid', () => {
    const report = seedReport(db);
    expect(() =>
      createChange(db, {
        reportId: report.id,
        changeType: 'removed',
        title: 'Dropped queue',
        evidence: [
          { kind: 'commit', ref: 'abc' },
          { kind: 'issue' as never, ref: '7' },
        ],
      }),
    ).toThrow(/CHECK/);
    expect(listChangesForReport(db, report.id)).toEqual([]);
  });

  it('rejects unknown change types and reports', () => {
    const report = seedReport(db);
    expect(() =>
      createChange(db, { reportId: report.id, changeType: 'renamed' as never, title: 'x' }),
    ).toThrow(/CHECK/);
    expect(() => createChange(db, { reportId: 999, changeType: 'added', title: 'x' })).toThrow(
      /FOREIGN KEY/,
    );
  });

  it('lists changes of a report with their own evidence only', () => {
    const report = seedReport(db);
    const other = seedReport(db);
    const a = createChange(db, { reportId: report.id, changeType: 'added', title: 'A' });
    const b = createChange(db, { reportId: report.id, changeType: 'modified', title: 'B' });
    createChange(db, {
      reportId: other.id,
      changeType: 'added',
      title: 'Other',
      evidence: [{ kind: 'file', ref: 'x' }],
    });
    addEvidence(db, b.id, { kind: 'file', ref: 'src/b.ts' });

    const changes = listChangesForReport(db, report.id);
    expect(changes.map((c) => c.title)).toEqual(['A', 'B']);
    expect(changes[0]?.evidence).toEqual([]);
    expect(changes[1]?.evidence.map((e) => e.ref)).toEqual(['src/b.ts']);
    expect(a.evidence).toEqual([]);
  });

  it('cascades evidence on change delete and changes on report delete', () => {
    const report = seedReport(db);
    const c1 = createChange(db, {
      reportId: report.id,
      changeType: 'added',
      title: 'A',
      evidence: [{ kind: 'url', ref: 'https://x' }],
    });
    const c2 = createChange(db, { reportId: report.id, changeType: 'added', title: 'B' });

    expect(deleteChange(db, c1.id)).toBe(true);
    expect(db.prepare('SELECT count(*) FROM change_evidence').pluck().get()).toBe(0);

    deleteReport(db, report.id);
    expect(getChange(db, c2.id)).toBeUndefined();
  });
});
