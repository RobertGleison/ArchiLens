import type { Db } from './connection.js';
import { NOW_SQL, setClause, toSqlBool } from './sql.js';

export type RepoVisibility = 'private' | 'public';

export interface Repo {
  id: number;
  /** `owner/name` as on GitHub. */
  fullName: string;
  owner: string;
  name: string;
  htmlUrl: string;
  visibility: RepoVisibility;
  defaultBranch: string;
  includePaths: string[];
  excludePaths: string[];
  monitoringEnabled: boolean;
  /** When the user consented to sending this repo's source to the LLM; null = no consent. */
  llmConsentGrantedAt: string | null;
  lastScannedSha: string | null;
  lastScannedAt: string | null;
  /** Job that last advanced `lastScannedSha`. */
  lastScannedJobId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewRepo {
  fullName: string;
  owner: string;
  name: string;
  htmlUrl: string;
  visibility: RepoVisibility;
  defaultBranch: string;
  includePaths?: string[];
  excludePaths?: string[];
  monitoringEnabled?: boolean;
}

export type RepoPatch = Partial<
  Pick<
    Repo,
    | 'htmlUrl'
    | 'visibility'
    | 'defaultBranch'
    | 'includePaths'
    | 'excludePaths'
    | 'monitoringEnabled'
    | 'llmConsentGrantedAt'
  >
>;

interface RepoRow {
  id: number;
  full_name: string;
  owner: string;
  name: string;
  html_url: string;
  visibility: RepoVisibility;
  default_branch: string;
  include_paths: string;
  exclude_paths: string;
  monitoring_enabled: number;
  llm_consent_granted_at: string | null;
  last_scanned_sha: string | null;
  last_scanned_at: string | null;
  last_scanned_job_id: number | null;
  created_at: string;
  updated_at: string;
}

const PATCH_COLUMNS: Record<keyof RepoPatch, string> = {
  htmlUrl: 'html_url',
  visibility: 'visibility',
  defaultBranch: 'default_branch',
  includePaths: 'include_paths',
  excludePaths: 'exclude_paths',
  monitoringEnabled: 'monitoring_enabled',
  llmConsentGrantedAt: 'llm_consent_granted_at',
};

function toRepo(row: RepoRow): Repo {
  return {
    id: row.id,
    fullName: row.full_name,
    owner: row.owner,
    name: row.name,
    htmlUrl: row.html_url,
    visibility: row.visibility,
    defaultBranch: row.default_branch,
    includePaths: JSON.parse(row.include_paths) as string[],
    excludePaths: JSON.parse(row.exclude_paths) as string[],
    monitoringEnabled: row.monitoring_enabled === 1,
    llmConsentGrantedAt: row.llm_consent_granted_at,
    lastScannedSha: row.last_scanned_sha,
    lastScannedAt: row.last_scanned_at,
    lastScannedJobId: row.last_scanned_job_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createRepo(db: Db, input: NewRepo): Repo {
  const row = db
    .prepare(
      `INSERT INTO repos (full_name, owner, name, html_url, visibility, default_branch,
                          include_paths, exclude_paths, monitoring_enabled)
       VALUES (@fullName, @owner, @name, @htmlUrl, @visibility, @defaultBranch,
               @includePaths, @excludePaths, @monitoringEnabled)
       RETURNING *`,
    )
    .get({
      ...input,
      includePaths: JSON.stringify(input.includePaths ?? []),
      excludePaths: JSON.stringify(input.excludePaths ?? []),
      monitoringEnabled: toSqlBool(input.monitoringEnabled ?? true),
    }) as RepoRow;
  return toRepo(row);
}

export function getRepo(db: Db, id: number): Repo | undefined {
  const row = db.prepare('SELECT * FROM repos WHERE id = ?').get(id) as RepoRow | undefined;
  return row && toRepo(row);
}

export function getRepoByFullName(db: Db, fullName: string): Repo | undefined {
  const row = db.prepare('SELECT * FROM repos WHERE full_name = ?').get(fullName) as
    RepoRow | undefined;
  return row && toRepo(row);
}

export function listRepos(db: Db, filter: { monitoringEnabled?: boolean } = {}): Repo[] {
  const rows =
    filter.monitoringEnabled === undefined
      ? db.prepare('SELECT * FROM repos ORDER BY full_name').all()
      : db
          .prepare('SELECT * FROM repos WHERE monitoring_enabled = ? ORDER BY full_name')
          .all(toSqlBool(filter.monitoringEnabled));
  return (rows as RepoRow[]).map(toRepo);
}

/** Updates the given fields; returns the updated repo, or undefined if it does not exist. */
export function updateRepo(db: Db, id: number, patch: RepoPatch): Repo | undefined {
  const sets = setClause(patch, PATCH_COLUMNS);
  if (sets.length === 0) return getRepo(db, id);
  const row = db
    .prepare(
      `UPDATE repos SET ${sets.join(', ')}, updated_at = ${NOW_SQL} WHERE id = @id RETURNING *`,
    )
    .get({
      ...patch,
      id,
      includePaths: patch.includePaths && JSON.stringify(patch.includePaths),
      excludePaths: patch.excludePaths && JSON.stringify(patch.excludePaths),
      monitoringEnabled:
        patch.monitoringEnabled === undefined ? undefined : toSqlBool(patch.monitoringEnabled),
    }) as RepoRow | undefined;
  return row && toRepo(row);
}

/** Deletes the repo and (via cascade) its memberships, schedule, jobs, reports and settings. */
export function deleteRepo(db: Db, id: number): boolean {
  return db.prepare('DELETE FROM repos WHERE id = ?').run(id).changes > 0;
}

/**
 * Moves the repo's scan cursor (`last_scanned_sha`) to the `commit_to` of a
 * successfully ingested scan. This is the only code that writes the cursor.
 *
 * Rules (checked atomically in the UPDATE, so concurrent callers cannot race):
 * - the job must be a `succeeded` baseline/incremental repo job with `commit_to`
 *   (backfill jobs scan history and never move the cursor);
 * - the job must be newer than the job that last moved the cursor
 *   (`job.id > last_scanned_job_id`; job ids are AUTOINCREMENT, so creation
 *   order is total). An older baseline that finishes late cannot rewind it;
 * - an incremental job must continue from the current cursor
 *   (`commit_from = last_scanned_sha`, or the cursor is still unset).
 *
 * Ingest must call this in the same `db.transaction` as createReport,
 * createModelSnapshot and updateJobStatus(..., 'succeeded'), so the cursor
 * never moves without the artifacts that justify it (and vice versa).
 */
export function advanceLastScannedSha(db: Db, jobId: number): Repo {
  const job = db
    .prepare('SELECT repo_id, mode, status, commit_from, commit_to FROM jobs WHERE id = ?')
    .get(jobId) as
    | {
        repo_id: number | null;
        mode: string;
        status: string;
        commit_from: string | null;
        commit_to: string | null;
      }
    | undefined;

  if (!job) throw new Error(`Job ${jobId} not found`);
  if (job.repo_id === null) throw new Error(`Job ${jobId} is not a repo scan`);
  if (job.mode !== 'baseline' && job.mode !== 'incremental') {
    throw new Error(`Job ${jobId} is a ${job.mode} scan; only baseline/incremental advance`);
  }
  if (job.status !== 'succeeded') {
    throw new Error(`Job ${jobId} has status ${job.status}; only succeeded jobs advance`);
  }
  if (job.commit_to === null) throw new Error(`Job ${jobId} has no commit_to`);

  const row = db
    .prepare(
      `UPDATE repos
       SET last_scanned_sha = @commitTo, last_scanned_job_id = @jobId,
           last_scanned_at = ${NOW_SQL}, updated_at = ${NOW_SQL}
       WHERE id = @repoId
         AND (last_scanned_job_id IS NULL OR last_scanned_job_id < @jobId)
         AND (@mode = 'baseline' OR last_scanned_sha IS NULL OR last_scanned_sha = @commitFrom)
       RETURNING *`,
    )
    .get({
      repoId: job.repo_id,
      jobId,
      mode: job.mode,
      commitFrom: job.commit_from,
      commitTo: job.commit_to,
    }) as RepoRow | undefined;

  if (!row) {
    throw new Error(
      `Job ${jobId} cannot advance repo ${job.repo_id}: a newer scan already moved the cursor ` +
        `or the incremental range does not start at the current last_scanned_sha`,
    );
  }
  return toRepo(row);
}
