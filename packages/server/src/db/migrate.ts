import type { Db } from './connection.js';
import { MIGRATIONS } from './migrations/index.js';

export interface Migration {
  /** Positive, strictly increasing integer; doubles as the applied-version key. */
  version: number;
  name: string;
  sql: string;
  /**
   * Set to false for migrations that rebuild tables (see migrations/index.ts).
   * Foreign keys are switched off for the migration (the pragma is a no-op
   * inside a transaction, so this happens before BEGIN), integrity is verified
   * with `PRAGMA foreign_key_check` before commit, and they are switched back on.
   */
  foreignKeys?: false;
}

/**
 * Applies every migration not yet recorded in `schema_migrations`, each in its
 * own transaction (a failing migration leaves no trace). Re-running is a no-op.
 * Returns the versions applied by this call.
 */
export function runMigrations(db: Db, migrations: readonly Migration[] = MIGRATIONS): number[] {
  assertOrdered(migrations);
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    INTEGER PRIMARY KEY,
      name       TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    ) STRICT
  `);

  const applied = new Set(
    db
      .prepare('SELECT version FROM schema_migrations')
      .pluck()
      .all()
      .map((v) => v as number),
  );
  const record = db.prepare('INSERT INTO schema_migrations (version, name) VALUES (?, ?)');
  const newlyApplied: number[] = [];

  for (const migration of migrations) {
    if (applied.has(migration.version)) continue;
    applyOne(db, migration, () => record.run(migration.version, migration.name));
    newlyApplied.push(migration.version);
  }
  return newlyApplied;
}

function applyOne(db: Db, migration: Migration, recordApplied: () => void): void {
  const run = db.transaction(() => {
    db.exec(migration.sql);
    if (migration.foreignKeys === false) assertForeignKeysIntact(db, migration);
    recordApplied();
  });

  if (migration.foreignKeys !== false) {
    run.immediate();
    return;
  }
  db.pragma('foreign_keys = OFF');
  try {
    run.immediate();
  } finally {
    db.pragma('foreign_keys = ON');
  }
}

function assertForeignKeysIntact(db: Db, migration: Migration): void {
  const violations = db.pragma('foreign_key_check') as { table: string; parent: string }[];
  if (violations.length > 0) {
    const first = violations[0]!;
    throw new Error(
      `Migration "${migration.name}" left ${violations.length} foreign key violation(s), ` +
        `e.g. ${first.table} -> ${first.parent}`,
    );
  }
}

function assertOrdered(migrations: readonly Migration[]): void {
  let previous = 0;
  for (const { version, name } of migrations) {
    if (!Number.isInteger(version) || version <= previous) {
      throw new Error(`Migration "${name}" has version ${version}; versions must increase`);
    }
    previous = version;
  }
}
