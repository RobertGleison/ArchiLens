import type { Db } from './connection.js';
import { MIGRATIONS } from './migrations/index.js';

export interface Migration {
  /** Positive, strictly increasing integer; doubles as the applied-version key. */
  version: number;
  name: string;
  sql: string;
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
    db.transaction(() => {
      db.exec(migration.sql);
      record.run(migration.version, migration.name);
    })();
    newlyApplied.push(migration.version);
  }
  return newlyApplied;
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
