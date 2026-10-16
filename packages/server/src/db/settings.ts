import type { Db } from './connection.js';
import { NOW_SQL } from './sql.js';

/** Where a setting applies. Lookups do not fall back between scopes; callers decide. */
export type SettingScope =
  { scope: 'global' } | { scope: 'repo'; repoId: number } | { scope: 'project'; projectId: number };

export const GLOBAL: SettingScope = { scope: 'global' };

function scopeParams(scope: SettingScope): {
  scope: SettingScope['scope'];
  repoId: number | null;
  projectId: number | null;
} {
  return {
    scope: scope.scope,
    repoId: scope.scope === 'repo' ? scope.repoId : null,
    projectId: scope.scope === 'project' ? scope.projectId : null,
  };
}

const SCOPE_WHERE = `key = @key AND scope = @scope
  AND ifnull(repo_id, 0) = ifnull(@repoId, 0) AND ifnull(project_id, 0) = ifnull(@projectId, 0)`;

/** Returns the parsed JSON value, or undefined if the setting is not set in that scope. */
export function getSetting<T = unknown>(
  db: Db,
  key: string,
  scope: SettingScope = GLOBAL,
): T | undefined {
  const value = db
    .prepare(`SELECT value FROM settings WHERE ${SCOPE_WHERE}`)
    .pluck()
    .get({ key, ...scopeParams(scope) }) as string | undefined;
  return value === undefined ? undefined : (JSON.parse(value) as T);
}

/** Inserts or replaces a setting. `value` must be JSON-serialisable. */
export function setSetting(
  db: Db,
  key: string,
  value: unknown,
  scope: SettingScope = GLOBAL,
): void {
  const json = JSON.stringify(value);
  if (json === undefined) throw new Error(`Setting "${key}" value is not JSON-serialisable`);
  db.prepare(
    `INSERT INTO settings (key, value, scope, repo_id, project_id)
     VALUES (@key, @value, @scope, @repoId, @projectId)
     ON CONFLICT (key, scope, ifnull(repo_id, 0), ifnull(project_id, 0))
     DO UPDATE SET value = excluded.value, updated_at = ${NOW_SQL}`,
  ).run({ key, value: json, ...scopeParams(scope) });
}

export function deleteSetting(db: Db, key: string, scope: SettingScope = GLOBAL): boolean {
  return (
    db.prepare(`DELETE FROM settings WHERE ${SCOPE_WHERE}`).run({ key, ...scopeParams(scope) })
      .changes > 0
  );
}

/** All settings in one scope as a key -> parsed value map. */
export function listSettings(db: Db, scope: SettingScope = GLOBAL): Record<string, unknown> {
  const rows = db
    .prepare(
      `SELECT key, value FROM settings WHERE scope = @scope
       AND ifnull(repo_id, 0) = ifnull(@repoId, 0) AND ifnull(project_id, 0) = ifnull(@projectId, 0)
       ORDER BY key`,
    )
    .all(scopeParams(scope)) as { key: string; value: string }[];
  return Object.fromEntries(rows.map((r) => [r.key, JSON.parse(r.value) as unknown]));
}
