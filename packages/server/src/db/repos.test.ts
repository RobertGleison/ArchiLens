import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestDb, seedJob, seedRepo } from '../test/db.js';
import type { Db } from './connection.js';
import { createJob, deleteJob, updateJobStatus } from './jobs.js';
import {
  advanceLastScannedSha,
  createRepo,
  deleteRepo,
  getRepo,
  getRepoByFullName,
  listRepos,
  updateRepo,
} from './repos.js';

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

let db: Db;
beforeEach(() => {
  db = createTestDb();
});
afterEach(() => {
  db.close();
});

describe('repos', () => {
  it('creates a repo with defaults and reads it back camelCased', () => {
    const repo = createRepo(db, {
      fullName: 'vercel/next.js',
      owner: 'vercel',
      name: 'next.js',
      htmlUrl: 'https://github.com/vercel/next.js',
      visibility: 'public',
      defaultBranch: 'canary',
    });

    expect(repo).toMatchObject({
      fullName: 'vercel/next.js',
      owner: 'vercel',
      name: 'next.js',
      visibility: 'public',
      defaultBranch: 'canary',
      includePaths: [],
      excludePaths: [],
      monitoringEnabled: true,
      llmConsentGrantedAt: null,
      lastScannedSha: null,
      lastScannedAt: null,
      lastScannedJobId: null,
    });
    expect(repo.createdAt).toMatch(ISO);
    expect(getRepo(db, repo.id)).toEqual(repo);
    expect(getRepoByFullName(db, 'vercel/next.js')).toEqual(repo);
  });

  it('round-trips include/exclude paths and monitoring flag', () => {
    const repo = seedRepo(db, {
      includePaths: ['src/**'],
      excludePaths: ['docs/**', 'test/**'],
      monitoringEnabled: false,
    });
    expect(getRepo(db, repo.id)).toMatchObject({
      includePaths: ['src/**'],
      excludePaths: ['docs/**', 'test/**'],
      monitoringEnabled: false,
    });
  });

  it('rejects duplicate full names and invalid visibility', () => {
    seedRepo(db, { owner: 'acme', name: 'api' });
    expect(() => seedRepo(db, { owner: 'acme', name: 'api' })).toThrow(/UNIQUE/);
    expect(() => seedRepo(db, { visibility: 'internal' as never })).toThrow(/CHECK/);
  });

  it('lists repos by full name, optionally filtered by monitoring', () => {
    seedRepo(db, { owner: 'b', name: 'two' });
    seedRepo(db, { owner: 'a', name: 'one', monitoringEnabled: false });

    expect(listRepos(db).map((r) => r.fullName)).toEqual(['a/one', 'b/two']);
    expect(listRepos(db, { monitoringEnabled: true }).map((r) => r.fullName)).toEqual(['b/two']);
  });

  it('updates fields, including granting and revoking LLM consent', () => {
    const repo = seedRepo(db);
    const grantedAt = '2026-10-12T09:00:00.000Z';

    const updated = updateRepo(db, repo.id, {
      llmConsentGrantedAt: grantedAt,
      excludePaths: ['vendor/**'],
      monitoringEnabled: false,
    });
    expect(updated).toMatchObject({
      llmConsentGrantedAt: grantedAt,
      excludePaths: ['vendor/**'],
      monitoringEnabled: false,
      defaultBranch: 'main',
    });

    expect(updateRepo(db, repo.id, { llmConsentGrantedAt: null })?.llmConsentGrantedAt).toBeNull();
  });

  it('returns undefined when updating a missing repo', () => {
    expect(updateRepo(db, 999, { defaultBranch: 'dev' })).toBeUndefined();
  });

  it('deletes a repo', () => {
    const repo = seedRepo(db);
    expect(deleteRepo(db, repo.id)).toBe(true);
    expect(getRepo(db, repo.id)).toBeUndefined();
    expect(deleteRepo(db, repo.id)).toBe(false);
  });
});

describe('advanceLastScannedSha', () => {
  it('sets last_scanned_sha to commit_to of a succeeded baseline/incremental job', () => {
    const repo = seedRepo(db);
    const job = createJob(db, { repoId: repo.id, mode: 'incremental', commitTo: 'abc123' });
    updateJobStatus(db, job.id, 'succeeded');

    const advanced = advanceLastScannedSha(db, job.id);

    expect(advanced.lastScannedSha).toBe('abc123');
    expect(advanced.lastScannedAt).toMatch(ISO);
    expect(getRepo(db, repo.id)?.lastScannedSha).toBe('abc123');
  });

  it.each(['queued', 'running', 'failed', 'cancelled'] as const)(
    'refuses a %s job and leaves the sha untouched',
    (status) => {
      const repo = seedRepo(db);
      const job = createJob(db, { repoId: repo.id, mode: 'baseline', commitTo: 'abc' });
      if (status !== 'queued') updateJobStatus(db, job.id, status);

      expect(() => advanceLastScannedSha(db, job.id)).toThrow(/only succeeded/);
      expect(getRepo(db, repo.id)?.lastScannedSha).toBeNull();
    },
  );

  it('refuses an older job that finishes after a newer one (no rewind)', () => {
    const repo = seedRepo(db);
    const baseline = createJob(db, { repoId: repo.id, mode: 'baseline', commitTo: 'aaa' });
    const incr = createJob(db, {
      repoId: repo.id,
      mode: 'incremental',
      commitFrom: 'aaa',
      commitTo: 'bbb',
    });
    updateJobStatus(db, incr.id, 'succeeded');
    updateJobStatus(db, baseline.id, 'succeeded');

    expect(advanceLastScannedSha(db, incr.id).lastScannedSha).toBe('bbb');
    expect(() => advanceLastScannedSha(db, baseline.id)).toThrow(/cannot advance/);
    expect(getRepo(db, repo.id)).toMatchObject({
      lastScannedSha: 'bbb',
      lastScannedJobId: incr.id,
    });
  });

  it('lets a newer baseline reset the cursor', () => {
    const repo = seedRepo(db);
    const first = seedJob(db, { repoId: repo.id, mode: 'baseline', commitTo: 'aaa' });
    const second = seedJob(db, { repoId: repo.id, mode: 'baseline', commitTo: 'zzz' });
    updateJobStatus(db, first.id, 'succeeded');
    updateJobStatus(db, second.id, 'succeeded');

    advanceLastScannedSha(db, first.id);
    expect(advanceLastScannedSha(db, second.id).lastScannedSha).toBe('zzz');
  });

  it('refuses an incremental job that does not start at the current cursor', () => {
    const repo = seedRepo(db);
    const base = seedJob(db, { repoId: repo.id, mode: 'baseline', commitTo: 'aaa' });
    const gap = seedJob(db, {
      repoId: repo.id,
      mode: 'incremental',
      commitFrom: 'xxx',
      commitTo: 'yyy',
    });
    updateJobStatus(db, base.id, 'succeeded');
    updateJobStatus(db, gap.id, 'succeeded');
    advanceLastScannedSha(db, base.id);

    expect(() => advanceLastScannedSha(db, gap.id)).toThrow(/cannot advance/);
    expect(getRepo(db, repo.id)?.lastScannedSha).toBe('aaa');
  });

  it('does not reuse job ids after deleting the latest job', () => {
    const repo = seedRepo(db);
    const job = seedJob(db, { repoId: repo.id, mode: 'baseline', commitTo: 'aaa' });
    updateJobStatus(db, job.id, 'succeeded');
    advanceLastScannedSha(db, job.id);
    deleteJob(db, job.id);

    expect(seedJob(db, { repoId: repo.id }).id).toBeGreaterThan(job.id);
  });

  it('refuses backfill jobs, jobs without commit_to and unknown jobs', () => {
    const backfill = seedJob(db, { mode: 'backfill', commitTo: 'old' });
    updateJobStatus(db, backfill.id, 'succeeded');
    expect(() => advanceLastScannedSha(db, backfill.id)).toThrow(/backfill/);

    const noCommit = seedJob(db, { mode: 'baseline' });
    updateJobStatus(db, noCommit.id, 'succeeded');
    expect(() => advanceLastScannedSha(db, noCommit.id)).toThrow(/commit_to/);

    expect(() => advanceLastScannedSha(db, 999)).toThrow(/not found/);
  });
});
