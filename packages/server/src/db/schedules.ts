import type { Db } from './connection.js';
import { NOW_SQL, setClause, toSqlBool } from './sql.js';
import { targetParams, targetWhere, type Target } from './target.js';

/** A row targets exactly one of repo or project (enforced by the schema). */
export interface Schedule {
  id: number;
  repoId: number | null;
  projectId: number | null;
  cron: string;
  /** IANA timezone the cron expression is evaluated in. */
  timezone: string;
  enabled: boolean;
  nextRunAt: string | null;
  lastRunAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type NewSchedule = Target & {
  cron: string;
  timezone?: string;
  enabled?: boolean;
  nextRunAt?: string | null;
};

export type SchedulePatch = Partial<
  Pick<Schedule, 'cron' | 'timezone' | 'enabled' | 'nextRunAt' | 'lastRunAt'>
>;

interface ScheduleRow {
  id: number;
  repo_id: number | null;
  project_id: number | null;
  cron: string;
  timezone: string;
  enabled: number;
  next_run_at: string | null;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}

const PATCH_COLUMNS: Record<keyof SchedulePatch, string> = {
  cron: 'cron',
  timezone: 'timezone',
  enabled: 'enabled',
  nextRunAt: 'next_run_at',
  lastRunAt: 'last_run_at',
};

function toSchedule(row: ScheduleRow): Schedule {
  return {
    id: row.id,
    repoId: row.repo_id,
    projectId: row.project_id,
    cron: row.cron,
    timezone: row.timezone,
    enabled: row.enabled === 1,
    nextRunAt: row.next_run_at,
    lastRunAt: row.last_run_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createSchedule(db: Db, input: NewSchedule): Schedule {
  const row = db
    .prepare(
      `INSERT INTO schedules (repo_id, project_id, cron, timezone, enabled, next_run_at)
       VALUES (@repoId, @projectId, @cron, @timezone, @enabled, @nextRunAt)
       RETURNING *`,
    )
    .get({
      ...targetParams(input),
      cron: input.cron,
      timezone: input.timezone ?? 'UTC',
      enabled: toSqlBool(input.enabled ?? true),
      nextRunAt: input.nextRunAt ?? null,
    }) as ScheduleRow;
  return toSchedule(row);
}

export function getSchedule(db: Db, id: number): Schedule | undefined {
  const row = db.prepare('SELECT * FROM schedules WHERE id = ?').get(id) as ScheduleRow | undefined;
  return row && toSchedule(row);
}

/** The schedule of a repo or project, if any (there is at most one each). */
export function getScheduleForTarget(db: Db, target: Target): Schedule | undefined {
  const { column, id } = targetWhere(target);
  const row = db.prepare(`SELECT * FROM schedules WHERE ${column} = ?`).get(id) as
    ScheduleRow | undefined;
  return row && toSchedule(row);
}

export function listSchedules(db: Db, filter: { enabled?: boolean } = {}): Schedule[] {
  const rows =
    filter.enabled === undefined
      ? db.prepare('SELECT * FROM schedules ORDER BY id').all()
      : db
          .prepare('SELECT * FROM schedules WHERE enabled = ? ORDER BY id')
          .all(toSqlBool(filter.enabled));
  return (rows as ScheduleRow[]).map(toSchedule);
}

export function updateSchedule(db: Db, id: number, patch: SchedulePatch): Schedule | undefined {
  const sets = setClause(patch, PATCH_COLUMNS);
  if (sets.length === 0) return getSchedule(db, id);
  const row = db
    .prepare(
      `UPDATE schedules SET ${sets.join(', ')}, updated_at = ${NOW_SQL} WHERE id = @id RETURNING *`,
    )
    .get({
      ...patch,
      id,
      enabled: patch.enabled === undefined ? undefined : toSqlBool(patch.enabled),
    }) as ScheduleRow | undefined;
  return row && toSchedule(row);
}

export function deleteSchedule(db: Db, id: number): boolean {
  return db.prepare('DELETE FROM schedules WHERE id = ?').run(id).changes > 0;
}
