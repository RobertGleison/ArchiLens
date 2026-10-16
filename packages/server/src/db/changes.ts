import type { Db } from './connection.js';

export type ChangeType = 'added' | 'removed' | 'modified';
export type EvidenceKind = 'commit' | 'pr' | 'file' | 'url';

export interface Evidence {
  id: number;
  changeId: number;
  kind: EvidenceKind;
  /** Commit SHA, PR number, file path or URL, depending on `kind`. */
  ref: string;
  url: string | null;
  note: string | null;
}

export interface NewEvidence {
  kind: EvidenceKind;
  ref: string;
  url?: string | null;
  note?: string | null;
}

/** An architectural change detected in a report, with its supporting evidence. */
export interface Change {
  id: number;
  reportId: number;
  changeType: ChangeType;
  category: string | null;
  title: string;
  description: string | null;
  createdAt: string;
  evidence: Evidence[];
}

export interface NewChange {
  reportId: number;
  changeType: ChangeType;
  category?: string | null;
  title: string;
  description?: string | null;
  evidence?: NewEvidence[];
}

interface ChangeRow {
  id: number;
  report_id: number;
  change_type: ChangeType;
  category: string | null;
  title: string;
  description: string | null;
  created_at: string;
}

interface EvidenceRow {
  id: number;
  change_id: number;
  kind: EvidenceKind;
  ref: string;
  url: string | null;
  note: string | null;
}

function toEvidence(row: EvidenceRow): Evidence {
  return {
    id: row.id,
    changeId: row.change_id,
    kind: row.kind,
    ref: row.ref,
    url: row.url,
    note: row.note,
  };
}

function toChange(row: ChangeRow, evidence: Evidence[]): Change {
  return {
    id: row.id,
    reportId: row.report_id,
    changeType: row.change_type,
    category: row.category,
    title: row.title,
    description: row.description,
    createdAt: row.created_at,
    evidence,
  };
}

/** Inserts a change and its evidence atomically. */
export function createChange(db: Db, input: NewChange): Change {
  return db.transaction((): Change => {
    const row = db
      .prepare(
        `INSERT INTO changes (report_id, change_type, category, title, description)
         VALUES (?, ?, ?, ?, ?) RETURNING *`,
      )
      .get(
        input.reportId,
        input.changeType,
        input.category ?? null,
        input.title,
        input.description ?? null,
      ) as ChangeRow;
    const evidence = (input.evidence ?? []).map((e) => addEvidence(db, row.id, e));
    return toChange(row, evidence);
  })();
}

export function addEvidence(db: Db, changeId: number, input: NewEvidence): Evidence {
  const row = db
    .prepare(
      `INSERT INTO change_evidence (change_id, kind, ref, url, note)
       VALUES (?, ?, ?, ?, ?) RETURNING *`,
    )
    .get(changeId, input.kind, input.ref, input.url ?? null, input.note ?? null) as EvidenceRow;
  return toEvidence(row);
}

export function getChange(db: Db, id: number): Change | undefined {
  const row = db.prepare('SELECT * FROM changes WHERE id = ?').get(id) as ChangeRow | undefined;
  if (!row) return undefined;
  const evidence = db
    .prepare('SELECT * FROM change_evidence WHERE change_id = ? ORDER BY id')
    .all(id) as EvidenceRow[];
  return toChange(row, evidence.map(toEvidence));
}

/** All changes of a report (insertion order), each with its evidence. */
export function listChangesForReport(db: Db, reportId: number): Change[] {
  const rows = db
    .prepare('SELECT * FROM changes WHERE report_id = ? ORDER BY id')
    .all(reportId) as ChangeRow[];
  const evidenceRows = db
    .prepare(
      `SELECT e.* FROM change_evidence e
       JOIN changes c ON c.id = e.change_id
       WHERE c.report_id = ? ORDER BY e.id`,
    )
    .all(reportId) as EvidenceRow[];

  const byChange = new Map<number, Evidence[]>();
  for (const e of evidenceRows) {
    const list = byChange.get(e.change_id) ?? [];
    list.push(toEvidence(e));
    byChange.set(e.change_id, list);
  }
  return rows.map((row) => toChange(row, byChange.get(row.id) ?? []));
}

export function deleteChange(db: Db, id: number): boolean {
  return db.prepare('DELETE FROM changes WHERE id = ?').run(id).changes > 0;
}
