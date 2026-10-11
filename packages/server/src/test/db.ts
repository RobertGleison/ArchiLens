import { openDatabase, type Db } from '../db/connection.js';
import { createJob, type Job, type NewJob } from '../db/jobs.js';
import { runMigrations } from '../db/migrate.js';
import { createProject, type Project } from '../db/projects.js';
import { createRepo, type NewRepo, type Repo } from '../db/repos.js';
import { createReport, type Report } from '../db/reports.js';

/** Fresh in-memory database with the full schema applied. */
export function createTestDb(): Db {
  const db = openDatabase(':memory:');
  runMigrations(db);
  return db;
}

let seq = 0;

export function seedRepo(db: Db, overrides: Partial<NewRepo> = {}): Repo {
  const name = overrides.name ?? `repo-${++seq}`;
  const owner = overrides.owner ?? 'acme';
  return createRepo(db, {
    fullName: `${owner}/${name}`,
    owner,
    name,
    htmlUrl: `https://github.com/${owner}/${name}`,
    visibility: 'private',
    defaultBranch: 'main',
    ...overrides,
  });
}

export function seedProject(db: Db, name = `project-${++seq}`): Project {
  return createProject(db, { name });
}

export function seedJob(db: Db, input: Partial<NewJob> = {}): Job {
  const target = 'projectId' in input || 'repoId' in input ? {} : { repoId: seedRepo(db).id };
  return createJob(db, { mode: 'baseline', ...target, ...input } as NewJob);
}

/** A report for a fresh repo job. */
export function seedReport(db: Db): Report {
  const job = seedJob(db);
  return createReport(db, { jobId: job.id, repoId: job.repoId!, reportPath: 'reports/1.md' });
}
