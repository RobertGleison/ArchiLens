import { join } from 'node:path';
import Database from 'better-sqlite3';

export type Db = Database.Database;

export const DB_FILENAME = 'archilens.db';

export function databasePath(dataDir: string): string {
  return join(dataDir, DB_FILENAME);
}

/** Opens (creating if needed) a SQLite database. Pass ':memory:' for tests. */
export function openDatabase(filename: string): Db {
  const db = new Database(filename);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  return db;
}
