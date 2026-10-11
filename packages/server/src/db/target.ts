/**
 * What a schedule, job, report or model snapshot is about: exactly one repo or
 * one project (the schema enforces this with a CHECK).
 */
export type Target = { repoId: number } | { projectId: number };

export function targetParams(target: Target): { repoId: number | null; projectId: number | null } {
  return 'repoId' in target
    ? { repoId: target.repoId, projectId: null }
    : { repoId: null, projectId: target.projectId };
}

/** Column/value pair for `WHERE <column> = ?`. Column names are constants, never user input. */
export function targetWhere(target: Target): { column: 'repo_id' | 'project_id'; id: number } {
  return 'repoId' in target
    ? { column: 'repo_id', id: target.repoId }
    : { column: 'project_id', id: target.projectId };
}
