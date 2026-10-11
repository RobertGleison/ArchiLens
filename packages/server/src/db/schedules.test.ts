import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestDb, seedProject, seedRepo } from '../test/db.js';
import type { Db } from './connection.js';
import { deleteRepo } from './repos.js';
import {
  createSchedule,
  deleteSchedule,
  getSchedule,
  getScheduleForTarget,
  listSchedules,
  updateSchedule,
} from './schedules.js';

let db: Db;
beforeEach(() => {
  db = createTestDb();
});
afterEach(() => {
  db.close();
});

describe('schedules', () => {
  it('creates a repo schedule with UTC default and finds it by target', () => {
    const repo = seedRepo(db);
    const s = createSchedule(db, { repoId: repo.id, cron: '0 6 * * 1' });

    expect(s).toMatchObject({
      repoId: repo.id,
      projectId: null,
      cron: '0 6 * * 1',
      timezone: 'UTC',
      enabled: true,
      nextRunAt: null,
    });
    expect(getScheduleForTarget(db, { repoId: repo.id })).toEqual(s);
    expect(getSchedule(db, s.id)).toEqual(s);
  });

  it('creates a project schedule with a timezone', () => {
    const p = seedProject(db);
    const s = createSchedule(db, {
      projectId: p.id,
      cron: '0 9 * * *',
      timezone: 'Europe/Lisbon',
    });
    expect(getScheduleForTarget(db, { projectId: p.id })).toMatchObject({
      id: s.id,
      timezone: 'Europe/Lisbon',
    });
  });

  it('enforces exactly one target and at most one schedule per target', () => {
    const repo = seedRepo(db);
    const p = seedProject(db);
    createSchedule(db, { repoId: repo.id, cron: '* * * * *' });

    expect(() => createSchedule(db, { repoId: repo.id, cron: '0 * * * *' })).toThrow(/UNIQUE/);

    const insert = db.prepare(
      "INSERT INTO schedules (repo_id, project_id, cron) VALUES (?, ?, '* * * * *')",
    );
    expect(() => insert.run(seedRepo(db).id, p.id)).toThrow(/CHECK/);
    expect(() => insert.run(null, null)).toThrow(/CHECK/);
  });

  it('updates and filters by enabled', () => {
    const a = createSchedule(db, { repoId: seedRepo(db).id, cron: '0 1 * * *' });
    createSchedule(db, { repoId: seedRepo(db).id, cron: '0 2 * * *' });

    const updated = updateSchedule(db, a.id, {
      enabled: false,
      lastRunAt: '2026-10-12T01:00:00.000Z',
      nextRunAt: '2026-10-13T01:00:00.000Z',
    });
    expect(updated).toMatchObject({
      enabled: false,
      lastRunAt: '2026-10-12T01:00:00.000Z',
      nextRunAt: '2026-10-13T01:00:00.000Z',
    });

    expect(listSchedules(db)).toHaveLength(2);
    expect(listSchedules(db, { enabled: true }).map((s) => s.cron)).toEqual(['0 2 * * *']);
  });

  it('deletes schedules directly and via repo cascade', () => {
    const r1 = seedRepo(db);
    const r2 = seedRepo(db);
    const s1 = createSchedule(db, { repoId: r1.id, cron: '* * * * *' });
    const s2 = createSchedule(db, { repoId: r2.id, cron: '* * * * *' });

    expect(deleteSchedule(db, s1.id)).toBe(true);
    deleteRepo(db, r2.id);

    expect(getSchedule(db, s1.id)).toBeUndefined();
    expect(getSchedule(db, s2.id)).toBeUndefined();
  });
});
