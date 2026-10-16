import type { Migration } from '../migrate.js';
import { initial } from './0001_initial.js';

// Changes SQLite's ALTER TABLE cannot do (new constraints, changed columns)
// need a table rebuild, in a migration with `foreignKeys: false`:
//   CREATE TABLE new_x (...); INSERT INTO new_x SELECT ... FROM x;
//   DROP TABLE x; ALTER TABLE new_x RENAME TO x; then recreate x's indexes.
// With foreign keys on, DROP TABLE x would cascade-delete rows referencing x.
// See https://www.sqlite.org/lang_altertable.html#otheralter

/** All schema migrations, in the order they must be applied. Append only; never edit. */
export const MIGRATIONS: readonly Migration[] = [initial];
