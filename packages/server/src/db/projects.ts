import type { Db } from './connection.js';
import { NOW_SQL, setClause } from './sql.js';

export interface Project {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewProject {
  name: string;
  description?: string | null;
}

export type ProjectPatch = Partial<Pick<Project, 'name' | 'description'>>;

interface ProjectRow {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

const PATCH_COLUMNS: Record<keyof ProjectPatch, string> = {
  name: 'name',
  description: 'description',
};

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createProject(db: Db, input: NewProject): Project {
  const row = db
    .prepare('INSERT INTO projects (name, description) VALUES (?, ?) RETURNING *')
    .get(input.name, input.description ?? null) as ProjectRow;
  return toProject(row);
}

export function getProject(db: Db, id: number): Project | undefined {
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as ProjectRow | undefined;
  return row && toProject(row);
}

export function listProjects(db: Db): Project[] {
  return (db.prepare('SELECT * FROM projects ORDER BY name').all() as ProjectRow[]).map(toProject);
}

export function updateProject(db: Db, id: number, patch: ProjectPatch): Project | undefined {
  const sets = setClause(patch, PATCH_COLUMNS);
  if (sets.length === 0) return getProject(db, id);
  const row = db
    .prepare(
      `UPDATE projects SET ${sets.join(', ')}, updated_at = ${NOW_SQL} WHERE id = @id RETURNING *`,
    )
    .get({ ...patch, id }) as ProjectRow | undefined;
  return row && toProject(row);
}

export function deleteProject(db: Db, id: number): boolean {
  return db.prepare('DELETE FROM projects WHERE id = ?').run(id).changes > 0;
}

/** Adds a repo to a project; adding an existing member is a no-op. */
export function addRepoToProject(db: Db, projectId: number, repoId: number): void {
  db.prepare(
    'INSERT INTO project_repos (project_id, repo_id) VALUES (?, ?) ON CONFLICT DO NOTHING',
  ).run(projectId, repoId);
}

export function removeRepoFromProject(db: Db, projectId: number, repoId: number): boolean {
  return (
    db
      .prepare('DELETE FROM project_repos WHERE project_id = ? AND repo_id = ?')
      .run(projectId, repoId).changes > 0
  );
}

/** Repo ids in a project, ascending. */
export function listProjectRepoIds(db: Db, projectId: number): number[] {
  return db
    .prepare('SELECT repo_id FROM project_repos WHERE project_id = ? ORDER BY repo_id')
    .pluck()
    .all(projectId) as number[];
}

/** Projects a repo belongs to, by name. */
export function listProjectsForRepo(db: Db, repoId: number): Project[] {
  const rows = db
    .prepare(
      `SELECT p.* FROM projects p
       JOIN project_repos pr ON pr.project_id = p.id
       WHERE pr.repo_id = ? ORDER BY p.name`,
    )
    .all(repoId) as ProjectRow[];
  return rows.map(toProject);
}
