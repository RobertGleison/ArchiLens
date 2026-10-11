import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestDb, seedJob, seedProject, seedRepo } from '../test/db.js';
import type { Db } from './connection.js';
import {
  createJob,
  deleteJob,
  getJob,
  listJobs,
  listJobsByStatus,
  setJobTokens,
  updateJob,
  updateJobStatus,
} from './jobs.js';
import { deleteRepo } from './repos.js';

let db: Db;
beforeEach(() => {
  db = createTestDb();
});
afterEach(() => {
  db.close();
});

describe('jobs', () => {
  it('creates a queued repo job with reproducibility fields', () => {
    const repo = seedRepo(db);
    const job = createJob(db, {
      repoId: repo.id,
      mode: 'incremental',
      commitFrom: 'aaa',
      commitTo: 'bbb',
      skillVersion: '1.2.0',
      model: 'claude-opus',
      logPath: 'logs/jobs/1.log',
    });

    expect(job).toMatchObject({
      repoId: repo.id,
      projectId: null,
      mode: 'incremental',
      status: 'queued',
      commitFrom: 'aaa',
      commitTo: 'bbb',
      skillVersion: '1.2.0',
      model: 'claude-opus',
      tokensIn: 0,
      tokensOut: 0,
      attempt: 1,
      error: null,
      logPath: 'logs/jobs/1.log',
      startedAt: null,
      finishedAt: null,
    });
    expect(getJob(db, job.id)).toEqual(job);
  });

  it('creates project jobs only with mode project, and repo jobs never with it', () => {
    const p = seedProject(db);
    const repo = seedRepo(db);

    expect(createJob(db, { projectId: p.id, mode: 'project' })).toMatchObject({
      projectId: p.id,
      repoId: null,
    });
    expect(() => createJob(db, { projectId: p.id, mode: 'baseline' })).toThrow(/CHECK/);
    expect(() => createJob(db, { repoId: repo.id, mode: 'project' })).toThrow(/CHECK/);
  });

  it('rejects invalid modes, statuses and attempts', () => {
    expect(() => seedJob(db, { mode: 'nightly' as never })).toThrow(/CHECK/);
    expect(() => seedJob(db, { attempt: 0 })).toThrow(/CHECK/);
    const job = seedJob(db);
    expect(() => updateJobStatus(db, job.id, 'done' as never)).toThrow(/CHECK/);
  });

  it('stamps started_at on running and finished_at on terminal status, storing errors', () => {
    const job = seedJob(db);

    const running = updateJobStatus(db, job.id, 'running');
    expect(running?.status).toBe('running');
    expect(running?.startedAt).not.toBeNull();
    expect(running?.finishedAt).toBeNull();

    const failed = updateJobStatus(db, job.id, 'failed', { error: 'claude exited 1' });
    expect(failed).toMatchObject({
      status: 'failed',
      error: 'claude exited 1',
      startedAt: running?.startedAt,
    });
    expect(failed?.finishedAt).not.toBeNull();
  });

  it('keeps an existing error unless a new one is given', () => {
    const job = seedJob(db);
    updateJobStatus(db, job.id, 'failed', { error: 'boom' });
    expect(updateJobStatus(db, job.id, 'cancelled')?.error).toBe('boom');
    expect(updateJobStatus(db, job.id, 'cancelled', { error: null })?.error).toBeNull();
  });

  it('records token usage and patches fields', () => {
    const job = seedJob(db);
    expect(setJobTokens(db, job.id, { tokensIn: 1200, tokensOut: 340 })).toMatchObject({
      tokensIn: 1200,
      tokensOut: 340,
    });
    expect(() => setJobTokens(db, job.id, { tokensIn: -1, tokensOut: 0 })).toThrow(/CHECK/);

    expect(updateJob(db, job.id, { commitTo: 'ccc', logPath: 'logs/x.log' })).toMatchObject({
      commitTo: 'ccc',
      logPath: 'logs/x.log',
    });
    expect(updateJob(db, 999, { commitTo: 'x' })).toBeUndefined();
  });

  it('lists jobs by status oldest first', () => {
    const a = seedJob(db);
    const b = seedJob(db);
    const c = seedJob(db);
    updateJobStatus(db, b.id, 'running');

    expect(listJobsByStatus(db, 'queued').map((j) => j.id)).toEqual([a.id, c.id]);
    expect(listJobsByStatus(db, 'running').map((j) => j.id)).toEqual([b.id]);
  });

  it('lists job history newest first, by target and with a limit', () => {
    const repo = seedRepo(db);
    const j1 = seedJob(db, { repoId: repo.id });
    const j2 = seedJob(db, { repoId: repo.id, attempt: 2 });
    const other = seedJob(db);

    expect(listJobs(db, { target: { repoId: repo.id } }).map((j) => j.id)).toEqual([j2.id, j1.id]);
    expect(listJobs(db, { limit: 1 }).map((j) => j.id)).toEqual([other.id]);
    expect(listJobs(db)).toHaveLength(3);
  });

  it('deletes jobs directly and via repo cascade', () => {
    const repo = seedRepo(db);
    const j1 = seedJob(db, { repoId: repo.id });
    const j2 = seedJob(db, { repoId: repo.id });

    expect(deleteJob(db, j1.id)).toBe(true);
    deleteRepo(db, repo.id);
    expect(getJob(db, j2.id)).toBeUndefined();
  });
});
