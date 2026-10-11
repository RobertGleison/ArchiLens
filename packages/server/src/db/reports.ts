import type { Db } from './connection.js';
import { targetParams, targetWhere, type Target } from './target.js';

export interface Report {
  id: number;
  jobId: number;
  repoId: number | null;
  projectId: number | null;
  /** Path of report.md, relative to the data dir. */
  reportPath: string;
  summary: string | null;
  createdAt: string;
}

export type NewReport = Target & {
  jobId: number;
  reportPath: string;
  summary?: string | null;
};

export interface ModelSnapshot {
  id: number;
  jobId: number;
  repoId: number | null;
  projectId: number | null;
  /** Path of model.json, relative to the data dir. */
  modelPath: string;
  commitSha: string | null;
  createdAt: string;
}

export type NewModelSnapshot = Target & {
  jobId: number;
  modelPath: string;
  commitSha?: string | null;
};

interface ReportRow {
  id: number;
  job_id: number;
  repo_id: number | null;
  project_id: number | null;
  report_path: string;
  summary: string | null;
  created_at: string;
}

interface ModelSnapshotRow {
  id: number;
  job_id: number;
  repo_id: number | null;
  project_id: number | null;
  model_path: string;
  commit_sha: string | null;
  created_at: string;
}

function toReport(row: ReportRow): Report {
  return {
    id: row.id,
    jobId: row.job_id,
    repoId: row.repo_id,
    projectId: row.project_id,
    reportPath: row.report_path,
    summary: row.summary,
    createdAt: row.created_at,
  };
}

function toModelSnapshot(row: ModelSnapshotRow): ModelSnapshot {
  return {
    id: row.id,
    jobId: row.job_id,
    repoId: row.repo_id,
    projectId: row.project_id,
    modelPath: row.model_path,
    commitSha: row.commit_sha,
    createdAt: row.created_at,
  };
}

export function createReport(db: Db, input: NewReport): Report {
  const row = db
    .prepare(
      `INSERT INTO reports (job_id, repo_id, project_id, report_path, summary)
       VALUES (@jobId, @repoId, @projectId, @reportPath, @summary)
       RETURNING *`,
    )
    .get({
      jobId: input.jobId,
      ...targetParams(input),
      reportPath: input.reportPath,
      summary: input.summary ?? null,
    }) as ReportRow;
  return toReport(row);
}

export function getReport(db: Db, id: number): Report | undefined {
  const row = db.prepare('SELECT * FROM reports WHERE id = ?').get(id) as ReportRow | undefined;
  return row && toReport(row);
}

export function getReportByJob(db: Db, jobId: number): Report | undefined {
  const row = db.prepare('SELECT * FROM reports WHERE job_id = ?').get(jobId) as
    ReportRow | undefined;
  return row && toReport(row);
}

/** Reports for a repo or project, newest first. */
export function listReports(db: Db, target: Target, limit = -1): Report[] {
  const { column, id } = targetWhere(target);
  const rows = db
    .prepare(`SELECT * FROM reports WHERE ${column} = ? ORDER BY created_at DESC, id DESC LIMIT ?`)
    .all(id, limit) as ReportRow[];
  return rows.map(toReport);
}

export function deleteReport(db: Db, id: number): boolean {
  return db.prepare('DELETE FROM reports WHERE id = ?').run(id).changes > 0;
}

export function createModelSnapshot(db: Db, input: NewModelSnapshot): ModelSnapshot {
  const row = db
    .prepare(
      `INSERT INTO model_snapshots (job_id, repo_id, project_id, model_path, commit_sha)
       VALUES (@jobId, @repoId, @projectId, @modelPath, @commitSha)
       RETURNING *`,
    )
    .get({
      jobId: input.jobId,
      ...targetParams(input),
      modelPath: input.modelPath,
      commitSha: input.commitSha ?? null,
    }) as ModelSnapshotRow;
  return toModelSnapshot(row);
}

export function getModelSnapshot(db: Db, id: number): ModelSnapshot | undefined {
  const row = db.prepare('SELECT * FROM model_snapshots WHERE id = ?').get(id) as
    ModelSnapshotRow | undefined;
  return row && toModelSnapshot(row);
}

/** Most recent model snapshot for a repo or project (the baseline for the next diff). */
export function getLatestModelSnapshot(db: Db, target: Target): ModelSnapshot | undefined {
  const { column, id } = targetWhere(target);
  const row = db
    .prepare(
      `SELECT * FROM model_snapshots WHERE ${column} = ? ORDER BY created_at DESC, id DESC LIMIT 1`,
    )
    .get(id) as ModelSnapshotRow | undefined;
  return row && toModelSnapshot(row);
}

/** Model snapshots for a repo or project, newest first. */
export function listModelSnapshots(db: Db, target: Target, limit = -1): ModelSnapshot[] {
  const { column, id } = targetWhere(target);
  const rows = db
    .prepare(
      `SELECT * FROM model_snapshots WHERE ${column} = ? ORDER BY created_at DESC, id DESC LIMIT ?`,
    )
    .all(id, limit) as ModelSnapshotRow[];
  return rows.map(toModelSnapshot);
}
