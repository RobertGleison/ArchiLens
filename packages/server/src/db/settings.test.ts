import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestDb, seedProject, seedRepo } from '../test/db.js';
import type { Db } from './connection.js';
import { deleteRepo } from './repos.js';
import { deleteSetting, getSetting, listSettings, setSetting } from './settings.js';

let db: Db;
beforeEach(() => {
  db = createTestDb();
});
afterEach(() => {
  db.close();
});

describe('settings', () => {
  it('stores and reads JSON values globally by default', () => {
    expect(getSetting(db, 'schedule.default')).toBeUndefined();

    setSetting(db, 'schedule.default', { cron: '0 6 * * 1', timezone: 'UTC' });
    setSetting(db, 'digest.enabled', false);

    expect(getSetting(db, 'schedule.default')).toEqual({ cron: '0 6 * * 1', timezone: 'UTC' });
    expect(getSetting<boolean>(db, 'digest.enabled')).toBe(false);
  });

  it('upserts: setting a key again replaces its value', () => {
    setSetting(db, 'model', 'a');
    setSetting(db, 'model', 'b');
    expect(getSetting(db, 'model')).toBe('b');
    expect(db.prepare('SELECT count(*) FROM settings').pluck().get()).toBe(1);
  });

  it('keeps the same key independent across global, repo and project scopes', () => {
    const r1 = seedRepo(db);
    const r2 = seedRepo(db);
    const p = seedProject(db);

    setSetting(db, 'model', 'global');
    setSetting(db, 'model', 'repo-1', { scope: 'repo', repoId: r1.id });
    setSetting(db, 'model', 'project', { scope: 'project', projectId: p.id });
    setSetting(db, 'model', 'repo-1b', { scope: 'repo', repoId: r1.id });

    expect(getSetting(db, 'model')).toBe('global');
    expect(getSetting(db, 'model', { scope: 'repo', repoId: r1.id })).toBe('repo-1b');
    expect(getSetting(db, 'model', { scope: 'repo', repoId: r2.id })).toBeUndefined();
    expect(getSetting(db, 'model', { scope: 'project', projectId: p.id })).toBe('project');
  });

  it('lists settings of one scope and deletes by key and scope', () => {
    const repo = seedRepo(db);
    setSetting(db, 'b', 2);
    setSetting(db, 'a', [1]);
    setSetting(db, 'a', 'repo', { scope: 'repo', repoId: repo.id });

    expect(listSettings(db)).toEqual({ a: [1], b: 2 });
    expect(listSettings(db, { scope: 'repo', repoId: repo.id })).toEqual({ a: 'repo' });

    expect(deleteSetting(db, 'a', { scope: 'repo', repoId: repo.id })).toBe(true);
    expect(getSetting(db, 'a')).toEqual([1]);
    expect(deleteSetting(db, 'a', { scope: 'repo', repoId: repo.id })).toBe(false);
  });

  it('rejects values that cannot be serialised and unknown scope targets', () => {
    expect(() => setSetting(db, 'x', undefined)).toThrow(/JSON/);
    expect(() => setSetting(db, 'x', 1, { scope: 'repo', repoId: 999 })).toThrow(/FOREIGN KEY/);
  });

  it('drops scoped settings when the repo is deleted', () => {
    const repo = seedRepo(db);
    setSetting(db, 'k', 1, { scope: 'repo', repoId: repo.id });
    deleteRepo(db, repo.id);
    expect(db.prepare('SELECT count(*) FROM settings').pluck().get()).toBe(0);
  });
});
