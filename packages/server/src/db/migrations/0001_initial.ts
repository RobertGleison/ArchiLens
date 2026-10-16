import type { Migration } from '../migrate.js';

// Timestamps are ISO-8601 UTC TEXT (same shape as Date#toISOString()).
// Artifact paths (report.md, model.json, job logs) are relative to the data dir.
// JSON columns hold JSON text; the data-access layer parses/serialises them.
const NOW = `(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

export const initial: Migration = {
  version: 1,
  name: 'initial',
  sql: /* sql */ `
CREATE TABLE repos (
  id                     INTEGER PRIMARY KEY,
  full_name              TEXT    NOT NULL UNIQUE,
  owner                  TEXT    NOT NULL,
  name                   TEXT    NOT NULL,
  html_url               TEXT    NOT NULL,
  visibility             TEXT    NOT NULL CHECK (visibility IN ('private', 'public')),
  default_branch         TEXT    NOT NULL,
  include_paths          TEXT    NOT NULL DEFAULT '[]' CHECK (json_type(include_paths) = 'array'),
  exclude_paths          TEXT    NOT NULL DEFAULT '[]' CHECK (json_type(exclude_paths) = 'array'),
  monitoring_enabled     INTEGER NOT NULL DEFAULT 1 CHECK (monitoring_enabled IN (0, 1)),
  llm_consent_granted_at TEXT,
  last_scanned_sha       TEXT,
  last_scanned_at        TEXT,
  -- Job that last moved the cursor. Deliberately no FK: deleting job history
  -- must not reset it (jobs.id is AUTOINCREMENT, so ids are never reused).
  last_scanned_job_id    INTEGER,
  created_at             TEXT    NOT NULL DEFAULT ${NOW},
  updated_at             TEXT    NOT NULL DEFAULT ${NOW}
) STRICT;

CREATE TABLE projects (
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at  TEXT NOT NULL DEFAULT ${NOW},
  updated_at  TEXT NOT NULL DEFAULT ${NOW}
) STRICT;

CREATE TABLE project_repos (
  project_id INTEGER NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  repo_id    INTEGER NOT NULL REFERENCES repos (id) ON DELETE CASCADE,
  added_at   TEXT    NOT NULL DEFAULT ${NOW},
  PRIMARY KEY (project_id, repo_id)
) STRICT;
CREATE INDEX project_repos_repo_idx ON project_repos (repo_id);

-- At most one schedule per repo and per project; global defaults live in settings.
CREATE TABLE schedules (
  id          INTEGER PRIMARY KEY,
  repo_id     INTEGER UNIQUE REFERENCES repos (id) ON DELETE CASCADE,
  project_id  INTEGER UNIQUE REFERENCES projects (id) ON DELETE CASCADE,
  cron        TEXT    NOT NULL,
  timezone    TEXT    NOT NULL DEFAULT 'UTC',
  enabled     INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  next_run_at TEXT,
  last_run_at TEXT,
  created_at  TEXT    NOT NULL DEFAULT ${NOW},
  updated_at  TEXT    NOT NULL DEFAULT ${NOW},
  CHECK ((repo_id IS NULL) <> (project_id IS NULL))
) STRICT;

CREATE TABLE jobs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  repo_id       INTEGER REFERENCES repos (id) ON DELETE CASCADE,
  project_id    INTEGER REFERENCES projects (id) ON DELETE CASCADE,
  mode          TEXT    NOT NULL CHECK (mode IN ('baseline', 'incremental', 'backfill', 'project')),
  status        TEXT    NOT NULL DEFAULT 'queued'
                        CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  commit_from   TEXT,
  commit_to     TEXT,
  skill_version TEXT,
  model         TEXT,
  tokens_in     INTEGER NOT NULL DEFAULT 0 CHECK (tokens_in >= 0),
  tokens_out    INTEGER NOT NULL DEFAULT 0 CHECK (tokens_out >= 0),
  attempt       INTEGER NOT NULL DEFAULT 1 CHECK (attempt >= 1),
  error         TEXT,
  log_path      TEXT,
  created_at    TEXT    NOT NULL DEFAULT ${NOW},
  started_at    TEXT,
  finished_at   TEXT,
  CHECK ((repo_id IS NULL) <> (project_id IS NULL)),
  CHECK ((mode = 'project') = (project_id IS NOT NULL))
) STRICT;
CREATE INDEX jobs_status_idx ON jobs (status, created_at);
CREATE INDEX jobs_repo_idx ON jobs (repo_id, created_at);
CREATE INDEX jobs_project_idx ON jobs (project_id, created_at);

CREATE TABLE reports (
  id          INTEGER PRIMARY KEY,
  job_id      INTEGER NOT NULL UNIQUE REFERENCES jobs (id) ON DELETE CASCADE,
  repo_id     INTEGER REFERENCES repos (id) ON DELETE CASCADE,
  project_id  INTEGER REFERENCES projects (id) ON DELETE CASCADE,
  report_path TEXT    NOT NULL,
  summary     TEXT,
  created_at  TEXT    NOT NULL DEFAULT ${NOW},
  CHECK ((repo_id IS NULL) <> (project_id IS NULL))
) STRICT;
CREATE INDEX reports_repo_idx ON reports (repo_id, created_at);
CREATE INDEX reports_project_idx ON reports (project_id, created_at);

CREATE TABLE model_snapshots (
  id         INTEGER PRIMARY KEY,
  job_id     INTEGER NOT NULL UNIQUE REFERENCES jobs (id) ON DELETE CASCADE,
  repo_id    INTEGER REFERENCES repos (id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects (id) ON DELETE CASCADE,
  model_path TEXT    NOT NULL,
  commit_sha TEXT,
  created_at TEXT    NOT NULL DEFAULT ${NOW},
  CHECK ((repo_id IS NULL) <> (project_id IS NULL))
) STRICT;
CREATE INDEX model_snapshots_repo_idx ON model_snapshots (repo_id, created_at);
CREATE INDEX model_snapshots_project_idx ON model_snapshots (project_id, created_at);

CREATE TABLE changes (
  id          INTEGER PRIMARY KEY,
  report_id   INTEGER NOT NULL REFERENCES reports (id) ON DELETE CASCADE,
  change_type TEXT    NOT NULL CHECK (change_type IN ('added', 'removed', 'modified')),
  category    TEXT,
  title       TEXT    NOT NULL,
  description TEXT,
  created_at  TEXT    NOT NULL DEFAULT ${NOW}
) STRICT;
CREATE INDEX changes_report_idx ON changes (report_id);

-- ref: commit SHA, PR number, file path or URL depending on kind.
CREATE TABLE change_evidence (
  id        INTEGER PRIMARY KEY,
  change_id INTEGER NOT NULL REFERENCES changes (id) ON DELETE CASCADE,
  kind      TEXT    NOT NULL CHECK (kind IN ('commit', 'pr', 'file', 'url')),
  ref       TEXT    NOT NULL,
  url       TEXT,
  note      TEXT
) STRICT;
CREATE INDEX change_evidence_change_idx ON change_evidence (change_id);

CREATE TABLE deliveries (
  id         INTEGER PRIMARY KEY,
  report_id  INTEGER NOT NULL REFERENCES reports (id) ON DELETE CASCADE,
  channel    TEXT    NOT NULL CHECK (channel IN ('in_app', 'email', 'slack', 'teams', 'rss')),
  status     TEXT    NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  target     TEXT,
  error      TEXT,
  created_at TEXT    NOT NULL DEFAULT ${NOW},
  sent_at    TEXT,
  updated_at TEXT    NOT NULL DEFAULT ${NOW}
) STRICT;
CREATE INDEX deliveries_report_idx ON deliveries (report_id);
CREATE INDEX deliveries_status_idx ON deliveries (status, created_at);

CREATE TABLE settings (
  id         INTEGER PRIMARY KEY,
  scope      TEXT    NOT NULL CHECK (scope IN ('global', 'repo', 'project')),
  repo_id    INTEGER REFERENCES repos (id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects (id) ON DELETE CASCADE,
  key        TEXT    NOT NULL,
  value      TEXT    NOT NULL CHECK (json_valid(value)),
  updated_at TEXT    NOT NULL DEFAULT ${NOW},
  CHECK (
    (scope = 'global'  AND repo_id IS NULL     AND project_id IS NULL) OR
    (scope = 'repo'    AND repo_id IS NOT NULL AND project_id IS NULL) OR
    (scope = 'project' AND repo_id IS NULL     AND project_id IS NOT NULL)
  )
) STRICT;
CREATE UNIQUE INDEX settings_key_scope_idx
  ON settings (key, scope, ifnull(repo_id, 0), ifnull(project_id, 0));
`,
};
