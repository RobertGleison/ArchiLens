import type { JobStatus } from '@archilens/shared';
import type { Db } from './connection.js';
import { NOW_SQL, setClause } from './sql.js';
import { targetParams, targetWhere, type Target } from './target.js';

export type JobMode = 'baseline' | 'incremental' | 'backfill' | 'project';
export type { JobStatus };

/** A scan of one repo, or (mode `project`) a consolidated project report. */
export interface Job {
  id: number;
  repoId: number | null;
  projectId: number | null;
  mode: JobMode;
  status: JobStatus;
  commitFrom: string | null;
  commitTo: string | null;
  skillVersion: string | null;
  model: string | null;
  tokensIn: number;
  tokensOut: number;
  attempt: number;
  error: string | null;
  /** Relative to the data dir. */
  logPath: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

/** Repo jobs use baseline/incremental/backfill; project jobs use mode `project`. */
export type NewJob = Target & {
  mode: JobMode;
  commitFrom?: string | null;
  commitTo?: string | null;
  skillVersion?: string | null;
  model?: string | null;
  attempt?: number;
  logPath?: string | null;
};

export type JobPatch = Partial<
  Pick<Job, 'commitFrom' | 'commitTo' | 'skillVersion' | 'model' | 'logPath' | 'error'>
>;

interface JobRow {
  id: number;
  repo_id: number | null;
  project_id: number | null;
  mode: JobMode;
  status: JobStatus;
  commit_from: string | null;
  commit_to: string | null;
  skill_version: string | null;
  model: string | null;
  tokens_in: number;
  tokens_out: number;
  attempt: number;
  error: string | null;
  log_path: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

const PATCH_COLUMNS: Record<keyof JobPatch, string> = {
  commitFrom: 'commit_from',
  commitTo: 'commit_to',
  skillVersion: 'skill_version',
  model: 'model',
  logPath: 'log_path',
  error: 'error',
};

function toJob(row: JobRow): Job {
  return {
    id: row.id,
    repoId: row.repo_id,
    projectId: row.project_id,
    mode: row.mode,
    status: row.status,
    commitFrom: row.commit_from,
    commitTo: row.commit_to,
    skillVersion: row.skill_version,
    model: row.model,
    tokensIn: row.tokens_in,
    tokensOut: row.tokens_out,
    attempt: row.attempt,
    error: row.error,
    logPath: row.log_path,
    createdAt: row.created_at,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
  };
}

export function createJob(db: Db, input: NewJob): Job {
  const row = db
    .prepare(
      `INSERT INTO jobs (repo_id, project_id, mode, commit_from, commit_to, skill_version, model,
                         attempt, log_path)
       VALUES (@repoId, @projectId, @mode, @commitFrom, @commitTo, @skillVersion, @model,
               @attempt, @logPath)
       RETURNING *`,
    )
    .get({
      ...targetParams(input),
      mode: input.mode,
      commitFrom: input.commitFrom ?? null,
      commitTo: input.commitTo ?? null,
      skillVersion: input.skillVersion ?? null,
      model: input.model ?? null,
      attempt: input.attempt ?? 1,
      logPath: input.logPath ?? null,
    }) as JobRow;
  return toJob(row);
}

export function getJob(db: Db, id: number): Job | undefined {
  const row = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as JobRow | undefined;
  return row && toJob(row);
}

/** Jobs with the given status, oldest first (queue order). */
export function listJobsByStatus(db: Db, status: JobStatus): Job[] {
  const rows = db
    .prepare('SELECT * FROM jobs WHERE status = ? ORDER BY created_at, id')
    .all(status) as JobRow[];
  return rows.map(toJob);
}

/** Job history, newest first, optionally for one repo or project. */
export function listJobs(db: Db, filter: { target?: Target; limit?: number } = {}): Job[] {
  const limit = filter.limit ?? -1;
  if (!filter.target) {
    const rows = db
      .prepare('SELECT * FROM jobs ORDER BY created_at DESC, id DESC LIMIT ?')
      .all(limit) as JobRow[];
    return rows.map(toJob);
  }
  const { column, id } = targetWhere(filter.target);
  const rows = db
    .prepare(`SELECT * FROM jobs WHERE ${column} = ? ORDER BY created_at DESC, id DESC LIMIT ?`)
    .all(id, limit) as JobRow[];
  return rows.map(toJob);
}

/**
 * Moves a job to `status`.
 * - `running` stamps `started_at`; terminal statuses stamp `finished_at`.
 * - `queued`/`running` (e.g. a retry) clear `finished_at` and `error`;
 *   `queued` also clears `started_at`.
 * - `error` is stored when given (ignored when entering queued/running).
 * - `from`: only transition if the job currently has that status (compare-and-set);
 *   returns undefined when the job is missing or its status differs.
 */
export function updateJobStatus(
  db: Db,
  id: number,
  status: JobStatus,
  options: { error?: string | null; from?: JobStatus } = {},
): Job | undefined {
  const row = db
    .prepare(
      `UPDATE jobs SET
         status = @status,
         started_at = CASE @status WHEN 'running' THEN ${NOW_SQL}
                                   WHEN 'queued' THEN NULL ELSE started_at END,
         finished_at = CASE WHEN @status IN ('queued', 'running') THEN NULL
                            ELSE ${NOW_SQL} END,
         error = CASE WHEN @status IN ('queued', 'running') THEN NULL
                      WHEN @hasError THEN @error ELSE error END
       WHERE id = @id AND (@from IS NULL OR status = @from)
       RETURNING *`,
    )
    .get({
      id,
      status,
      from: options.from ?? null,
      hasError: options.error === undefined ? 0 : 1,
      error: options.error ?? null,
    }) as JobRow | undefined;
  return row && toJob(row);
}

/** Records total LLM token usage for the job (overwrites previous totals). */
export function setJobTokens(
  db: Db,
  id: number,
  usage: { tokensIn: number; tokensOut: number },
): Job | undefined {
  const row = db
    .prepare('UPDATE jobs SET tokens_in = ?, tokens_out = ? WHERE id = ? RETURNING *')
    .get(usage.tokensIn, usage.tokensOut, id) as JobRow | undefined;
  return row && toJob(row);
}

export function updateJob(db: Db, id: number, patch: JobPatch): Job | undefined {
  const sets = setClause(patch, PATCH_COLUMNS);
  if (sets.length === 0) return getJob(db, id);
  const row = db
    .prepare(`UPDATE jobs SET ${sets.join(', ')} WHERE id = @id RETURNING *`)
    .get({ ...patch, id }) as JobRow | undefined;
  return row && toJob(row);
}

export function deleteJob(db: Db, id: number): boolean {
  return db.prepare('DELETE FROM jobs WHERE id = ?').run(id).changes > 0;
}
