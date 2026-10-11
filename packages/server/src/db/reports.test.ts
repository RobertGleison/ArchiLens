import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestDb, seedJob, seedProject, seedRepo } from '../test/db.js';
import type { Db } from './connection.js';
import { deleteJob } from './jobs.js';
import { deleteRepo } from './repos.js';
import {
  createModelSnapshot,
  createReport,
  deleteReport,
  getLatestModelSnapshot,
  getModelSnapshot,
  getReport,
  getReportByJob,
  listModelSnapshots,
  listReports,
} from './reports.js';

let db: Db;
beforeEach(() => {
  db = createTestDb();
});
afterEach(() => {
  db.close();
});

describe('reports', () => {
  it('creates a repo report linked to its job and reads it back', () => {
    const repo = seedRepo(db);
    const job = seedJob(db, { repoId: repo.id });
    const report = createReport(db, {
      jobId: job.id,
      reportPath: 'repos/1/reports/1/report.md',
      summary: 'Added a queue',
    });

    expect(report).toMatchObject({
      jobId: job.id,
      repoId: repo.id,
      projectId: null,
      reportPath: 'repos/1/reports/1/report.md',
      summary: 'Added a queue',
    });
    expect(getReport(db, report.id)).toEqual(report);
    expect(getReportByJob(db, job.id)).toEqual(report);
  });

  it('takes the project target from a project job', () => {
    const p = seedProject(db);
    const job = seedJob(db, { projectId: p.id, mode: 'project' });
    const report = createReport(db, { jobId: job.id, reportPath: 'p.md' });
    expect(report).toMatchObject({ repoId: null, projectId: p.id });
    expect(listReports(db, { projectId: p.id })).toEqual([report]);
  });

  it('allows one report per job and requires an existing job', () => {
    const job = seedJob(db);
    createReport(db, { jobId: job.id, reportPath: 'a.md' });
    expect(() => createReport(db, { jobId: job.id, reportPath: 'b.md' })).toThrow(/UNIQUE/);
    expect(() => createReport(db, { jobId: 999, reportPath: 'c.md' })).toThrow(/not found/);
  });

  it('lists reports for a target newest first with a limit', () => {
    const repo = seedRepo(db);
    const r1 = createReport(db, {
      jobId: seedJob(db, { repoId: repo.id }).id,
      reportPath: '1.md',
    });
    const r2 = createReport(db, {
      jobId: seedJob(db, { repoId: repo.id }).id,
      reportPath: '2.md',
    });

    expect(listReports(db, { repoId: repo.id }).map((r) => r.id)).toEqual([r2.id, r1.id]);
    expect(listReports(db, { repoId: repo.id }, 1).map((r) => r.id)).toEqual([r2.id]);
    expect(listReports(db, { repoId: seedRepo(db).id })).toEqual([]);
  });

  it('deletes reports directly and when their job or repo is deleted', () => {
    const repo = seedRepo(db);
    const j1 = seedJob(db, { repoId: repo.id });
    const j2 = seedJob(db, { repoId: repo.id });
    const j3 = seedJob(db, { repoId: repo.id });
    const r1 = createReport(db, { jobId: j1.id, reportPath: '1.md' });
    const r2 = createReport(db, { jobId: j2.id, reportPath: '2.md' });
    const r3 = createReport(db, { jobId: j3.id, reportPath: '3.md' });

    expect(deleteReport(db, r1.id)).toBe(true);
    deleteJob(db, j2.id);
    expect(getReport(db, r2.id)).toBeUndefined();
    deleteRepo(db, repo.id);
    expect(getReport(db, r3.id)).toBeUndefined();
  });
});

describe('model_snapshots', () => {
  it('creates snapshots and returns the latest for a target', () => {
    const repo = seedRepo(db);
    const s1 = createModelSnapshot(db, {
      jobId: seedJob(db, { repoId: repo.id }).id,
      modelPath: 'repos/1/models/1.json',
      commitSha: 'aaa',
    });
    const s2 = createModelSnapshot(db, {
      jobId: seedJob(db, { repoId: repo.id }).id,
      modelPath: 'repos/1/models/2.json',
    });

    expect(getModelSnapshot(db, s1.id)).toMatchObject({ commitSha: 'aaa', projectId: null });
    expect(s2.commitSha).toBeNull();
    expect(getLatestModelSnapshot(db, { repoId: repo.id })).toEqual(s2);
    expect(listModelSnapshots(db, { repoId: repo.id }).map((s) => s.id)).toEqual([s2.id, s1.id]);
    expect(getLatestModelSnapshot(db, { repoId: seedRepo(db).id })).toBeUndefined();
  });

  it('takes its target from the job and requires an existing job', () => {
    const p = seedProject(db);
    const job = seedJob(db, { projectId: p.id, mode: 'project' });
    expect(createModelSnapshot(db, { jobId: job.id, modelPath: 'm.json' })).toMatchObject({
      repoId: null,
      projectId: p.id,
    });
    expect(() => createModelSnapshot(db, { jobId: 999, modelPath: 'm.json' })).toThrow(/not found/);
  });

  it.each(['reports', 'model_snapshots'])(
    '%s requires exactly one target at the schema level',
    (table) => {
      const job = seedJob(db);
      const p = seedProject(db);
      const path = table === 'reports' ? 'report_path' : 'model_path';
      const insert = db.prepare(
        `INSERT INTO ${table} (job_id, repo_id, project_id, ${path}) VALUES (?, ?, ?, 'x')`,
      );
      expect(() => insert.run(job.id, null, null)).toThrow(/CHECK/);
      expect(() => insert.run(job.id, job.repoId, p.id)).toThrow(/CHECK/);
    },
  );
});
