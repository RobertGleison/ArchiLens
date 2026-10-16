import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestDb, seedProject, seedRepo } from '../test/db.js';
import type { Db } from './connection.js';
import {
  addRepoToProject,
  createProject,
  deleteProject,
  getProject,
  listProjectRepoIds,
  listProjects,
  listProjectsForRepo,
  removeRepoFromProject,
  updateProject,
} from './projects.js';
import { deleteRepo } from './repos.js';

let db: Db;
beforeEach(() => {
  db = createTestDb();
});
afterEach(() => {
  db.close();
});

describe('projects', () => {
  it('creates, reads, lists, updates and deletes projects', () => {
    const p = createProject(db, { name: 'Platform', description: 'Core services' });
    createProject(db, { name: 'Apps' });

    expect(getProject(db, p.id)).toMatchObject({ name: 'Platform', description: 'Core services' });
    expect(listProjects(db).map((x) => x.name)).toEqual(['Apps', 'Platform']);

    expect(updateProject(db, p.id, { description: null })).toMatchObject({
      name: 'Platform',
      description: null,
    });

    expect(deleteProject(db, p.id)).toBe(true);
    expect(getProject(db, p.id)).toBeUndefined();
  });

  it('rejects duplicate project names', () => {
    createProject(db, { name: 'Dup' });
    expect(() => createProject(db, { name: 'Dup' })).toThrow(/UNIQUE/);
  });
});

describe('project_repos', () => {
  it('lets a repo belong to several projects', () => {
    const repo = seedRepo(db);
    const a = seedProject(db, 'A');
    const b = seedProject(db, 'B');

    addRepoToProject(db, a.id, repo.id);
    addRepoToProject(db, b.id, repo.id);
    addRepoToProject(db, a.id, repo.id); // idempotent

    expect(listProjectRepoIds(db, a.id)).toEqual([repo.id]);
    expect(listProjectsForRepo(db, repo.id).map((p) => p.name)).toEqual(['A', 'B']);
  });

  it('removes a membership', () => {
    const repo = seedRepo(db);
    const p = seedProject(db);
    addRepoToProject(db, p.id, repo.id);

    expect(removeRepoFromProject(db, p.id, repo.id)).toBe(true);
    expect(listProjectRepoIds(db, p.id)).toEqual([]);
    expect(removeRepoFromProject(db, p.id, repo.id)).toBe(false);
  });

  it('cascades memberships when a repo or project is deleted', () => {
    const r1 = seedRepo(db);
    const r2 = seedRepo(db);
    const p = seedProject(db);
    addRepoToProject(db, p.id, r1.id);
    addRepoToProject(db, p.id, r2.id);

    deleteRepo(db, r1.id);
    expect(listProjectRepoIds(db, p.id)).toEqual([r2.id]);

    deleteProject(db, p.id);
    expect(listProjectsForRepo(db, r2.id)).toEqual([]);
  });

  it('rejects memberships for unknown repos', () => {
    const p = seedProject(db);
    expect(() => addRepoToProject(db, p.id, 999)).toThrow(/FOREIGN KEY/);
  });
});
