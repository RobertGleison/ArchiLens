import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { databasePath, openDatabase, type Db } from './connection.js';
import { runMigrations, type Migration } from './migrate.js';
import { MIGRATIONS } from './migrations/index.js';

const EXPECTED_TABLES = [
  'change_evidence',
  'changes',
  'deliveries',
  'jobs',
  'model_snapshots',
  'project_repos',
  'projects',
  'reports',
  'repos',
  'schedules',
  'schema_migrations',
  'settings',
];

function tableNames(db: Db): string[] {
  return db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    )
    .pluck()
    .all() as string[];
}

function appliedVersions(db: Db): { version: number; name: string; applied_at: string }[] {
  return db.prepare('SELECT * FROM schema_migrations ORDER BY version').all() as {
    version: number;
    name: string;
    applied_at: string;
  }[];
}

describe('runMigrations', () => {
  let db: Db;

  beforeEach(() => {
    db = openDatabase(':memory:');
  });

  afterEach(() => {
    db.close();
  });

  it('applies all migrations to a fresh database', () => {
    const applied = runMigrations(db);

    expect(applied).toEqual(MIGRATIONS.map((m) => m.version));
    expect(tableNames(db)).toEqual(EXPECTED_TABLES);
  });

  it('records each applied version with its name and timestamp', () => {
    runMigrations(db);

    const rows = appliedVersions(db);
    expect(rows.map((r) => [r.version, r.name])).toEqual(
      MIGRATIONS.map((m) => [m.version, m.name]),
    );
    expect(rows[0]?.applied_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('is a no-op when run again', () => {
    runMigrations(db);
    const before = appliedVersions(db);

    expect(runMigrations(db)).toEqual([]);
    expect(appliedVersions(db)).toEqual(before);
  });

  it('applies only migrations that are newer than the recorded ones', () => {
    const first: Migration = { version: 1, name: 'one', sql: 'CREATE TABLE a (x INTEGER)' };
    const second: Migration = { version: 2, name: 'two', sql: 'CREATE TABLE b (x INTEGER)' };
    runMigrations(db, [first]);

    expect(runMigrations(db, [first, second])).toEqual([2]);
    expect(appliedVersions(db).map((r) => r.version)).toEqual([1, 2]);
  });

  it('rolls back a failing migration and records nothing for it', () => {
    const good: Migration = { version: 1, name: 'good', sql: 'CREATE TABLE a (x INTEGER)' };
    const bad: Migration = {
      version: 2,
      name: 'bad',
      sql: 'CREATE TABLE b (x INTEGER); INSERT INTO missing_table VALUES (1);',
    };

    expect(() => runMigrations(db, [good, bad])).toThrow(/missing_table/);
    expect(tableNames(db)).toEqual(['a', 'schema_migrations']);
    expect(appliedVersions(db).map((r) => r.version)).toEqual([1]);
  });

  it('rejects migrations that are not in strictly increasing version order', () => {
    const a: Migration = { version: 2, name: 'a', sql: '' };
    const b: Migration = { version: 1, name: 'b', sql: '' };
    expect(() => runMigrations(db, [a, b])).toThrow(/versions must increase/);
  });

  it('enforces foreign keys', () => {
    runMigrations(db);
    expect(() =>
      db.prepare('INSERT INTO project_repos (project_id, repo_id) VALUES (999, 999)').run(),
    ).toThrow(/FOREIGN KEY/);
  });
});

describe('openDatabase on disk', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'archilens-db-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('creates archilens.db in WAL mode and keeps migrations across reopen', () => {
    const file = databasePath(dir);
    expect(file).toBe(join(dir, 'archilens.db'));

    const first = openDatabase(file);
    expect(first.pragma('journal_mode', { simple: true })).toBe('wal');
    expect(runMigrations(first)).toEqual(MIGRATIONS.map((m) => m.version));
    first.close();

    const second = openDatabase(file);
    expect(runMigrations(second)).toEqual([]);
    second.close();
  });
});
