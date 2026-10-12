import { RotateCw } from 'lucide-react';
import { useState } from 'react';
import type { RepoScanState } from '@archilens/shared';
import { scanStatusToPill } from '../scans/scanStatusPill';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { DataTable, type DataTableColumn } from '../ui/DataTable';
import { IdentityCell, ProgressCell } from '../ui/DataTableCells';
import { StatusPill } from '../ui/StatusPill';
import { TextLink } from '../ui/TextLink';
import styles from './ComponentPreview.module.css';

function ScanPill({ state }: { state: RepoScanState }) {
  const { label, ...pill } = scanStatusToPill(state);
  return <StatusPill {...pill}>{label}</StatusPill>;
}

interface Project {
  id: string;
  name: string;
  repos: string;
  state: RepoScanState;
  nextRun: string;
  changes: string;
  highlight?: boolean;
}

const PROJECTS: Project[] = [
  {
    id: 'commerce',
    name: 'Commerce platform',
    repos: '4 repositories · meridian + meridian-cloud',
    state: 'up_to_date',
    nextRun: 'Tomorrow, 08:00',
    changes: '8 this week',
    highlight: true,
  },
  {
    id: 'identity',
    name: 'Customer identity',
    repos: '2 repositories · meridian',
    state: 'up_to_date',
    nextRun: 'Tomorrow, 08:00',
    changes: '4 this week',
  },
  {
    id: 'data',
    name: 'Data & analytics',
    repos: '2 repositories · meridian-cloud',
    state: 'needs_attention',
    nextRun: 'After retry',
    changes: '2 this week',
  },
];

const PROJECT_COLUMNS: DataTableColumn<Project>[] = [
  {
    key: 'name',
    header: 'Project / repositories',
    width: 246,
    render: (p) => <IdentityCell primary={p.name} secondary={p.repos} to="/__components" />,
  },
  { key: 'state', header: 'Latest scan', width: 132, render: (p) => <ScanPill state={p.state} /> },
  { key: 'nextRun', header: 'Next run', width: 124 },
  {
    key: 'changes',
    header: 'Changes',
    width: 100,
    render: (p) => (p.highlight ? <StatusPill tone="accent">{p.changes}</StatusPill> : p.changes),
  },
];

interface Job {
  id: string;
  repo: string;
  detail: string;
  mode: string;
  state: RepoScanState;
  progress?: number;
  info?: string;
  started: string;
}

const JOBS: Job[] = [
  {
    id: '1',
    repo: 'meridian/checkout-api',
    detail: 'main · 38 new commits',
    mode: 'Incremental',
    state: 'running',
    progress: 68,
    started: '3 min ago',
  },
  {
    id: '2',
    repo: 'meridian/storefront',
    detail: 'main · 12 new commits',
    mode: 'Incremental',
    state: 'queued',
    info: 'Starts after checkout-api',
    started: '—',
  },
  {
    id: '3',
    repo: 'meridian-cloud/platform-infra',
    detail: 'main · Jan–Sep 2026',
    mode: 'Backfill',
    state: 'queued',
    info: '9 historical checkpoints',
    started: '—',
  },
  {
    id: '4',
    repo: 'meridian-cloud/analytics-worker',
    detail: 'main · 21 new commits',
    mode: 'Incremental',
    state: 'failed',
    info: 'Provider rate limit · source discarded',
    started: '24 min ago',
  },
];

const noop = () => {};

const JOB_COLUMNS: DataTableColumn<Job>[] = [
  {
    key: 'repo',
    header: 'Repository',
    width: 208,
    render: (j) => <IdentityCell primary={j.repo} secondary={j.detail} />,
  },
  { key: 'mode', header: 'Mode', width: 130 },
  { key: 'state', header: 'Status', width: 132, render: (j) => <ScanPill state={j.state} /> },
  {
    key: 'detail',
    header: 'Progress / detail',
    width: 284,
    render: (j) =>
      j.progress !== undefined ? (
        <ProgressCell label={`Building architecture model · ${j.progress}%`} value={j.progress} />
      ) : (
        j.info
      ),
  },
  { key: 'started', header: 'Started', width: 132 },
  {
    key: 'action',
    header: 'Action',
    width: 90,
    render: (j) =>
      j.state === 'failed' ? (
        <Button size="sm" icon={RotateCw} onClick={noop}>
          Retry
        </Button>
      ) : j.state === 'running' ? (
        <TextLink variant="quiet" to="/__components" arrow>
          View job
        </TextLink>
      ) : (
        <TextLink variant="quiet" onClick={noop}>
          Cancel
        </TextLink>
      ),
  },
];

interface Repo {
  id: string;
  name: string;
  description: string;
  language: string;
  size: string;
  activity: string;
  commits: string;
  baseline: string;
  monitored?: boolean;
}

const REPOS: Repo[] = [
  {
    id: 'inventory-api',
    name: 'inventory-api',
    description: 'Private · Inventory & stock reservations',
    language: 'TypeScript',
    size: '8.4 MB',
    activity: '2 hours ago',
    commits: '1,248',
    baseline: '$2.80',
  },
  {
    id: 'catalog-api',
    name: 'catalog-api',
    description: 'Private · Product catalog & search',
    language: 'Python',
    size: '6.1 MB',
    activity: 'Yesterday',
    commits: '864',
    baseline: '$2.40',
  },
  {
    id: 'notification-svc',
    name: 'notification-svc',
    description: 'Private · Transactional notifications',
    language: 'Go',
    size: '3.2 MB',
    activity: 'Oct 9, 2026',
    commits: '536',
    baseline: '$2.00',
  },
  {
    id: 'checkout-api',
    name: 'checkout-api',
    description: 'Private · Commerce platform',
    language: 'TypeScript',
    size: '12.8 MB',
    activity: '18 min ago',
    commits: '2,146',
    baseline: '',
    monitored: true,
  },
  {
    id: 'design-system',
    name: 'design-system',
    description: 'Public · Shared component library',
    language: 'TypeScript',
    size: '9.6 MB',
    activity: 'Oct 8, 2026',
    commits: '742',
    baseline: '$3.10',
  },
];

const REPO_COLUMNS: DataTableColumn<Repo>[] = [
  {
    key: 'name',
    header: 'Repository',
    width: 242,
    render: (r) => <IdentityCell primary={r.name} secondary={r.description} />,
  },
  {
    key: 'language',
    header: 'Language / size',
    width: 124,
    render: (r) => <IdentityCell primary={r.language} secondary={r.size} />,
  },
  { key: 'activity', header: 'Activity', width: 110 },
  { key: 'commits', header: 'Commits', width: 72 },
  {
    key: 'baseline',
    header: 'Est. baseline',
    width: 100,
    render: (r) => (r.monitored ? <StatusPill tone="accent">Monitored</StatusPill> : r.baseline),
  },
];

interface Module {
  id: string;
  name: string;
  path: string;
  responsibility: string;
  dependencies: string;
  evidence: string;
}

const MODULES: Module[] = [
  {
    id: 'checkout',
    name: 'CheckoutModule',
    path: 'src/checkout',
    responsibility: 'Coordinates checkout sessions and order creation',
    dependencies: 'OrdersModule · Redis · Stripe',
    evidence: 'checkout.module.ts:12–34',
  },
  {
    id: 'events',
    name: 'PaymentEventsModule',
    path: 'src/events',
    responsibility: 'Publishes asynchronous payment lifecycle events',
    dependencies: 'Amazon SQS · payments-worker',
    evidence: 'payment.publisher.ts:18–61',
  },
  {
    id: 'persistence',
    name: 'PersistenceModule',
    path: 'src/persistence',
    responsibility: 'Owns order storage and database migrations',
    dependencies: 'PostgreSQL · TypeORM',
    evidence: 'database.config.ts:7–28',
  },
];

const MODULE_COLUMNS: DataTableColumn<Module>[] = [
  {
    key: 'name',
    header: 'Module',
    width: 180,
    render: (m) => <IdentityCell primary={m.name} secondary={m.path} />,
  },
  { key: 'responsibility', header: 'Responsibility', width: 352 },
  { key: 'dependencies', header: 'Dependencies', width: 236 },
  {
    key: 'evidence',
    header: 'Evidence',
    width: 280,
    render: (m) => (
      <TextLink variant="mono" href="https://github.com/meridian/checkout-api" external>
        {m.evidence}
      </TextLink>
    ),
  },
];

/** DataTable examples matching the Figma tables (LIN-85). */
export function DataTablePreview() {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(['inventory-api', 'catalog-api', 'notification-svc']),
  );
  const [state, setState] = useState<'empty' | 'loading' | 'error'>('empty');
  return (
    <>
      <div className={styles.mainColumn}>
        <Card
          title="Your architecture landscape"
          description="3 projects · 8 repositories · main branches"
          action={<TextLink to="/__components">View all projects</TextLink>}
        >
          <DataTable
            caption="Projects"
            columns={PROJECT_COLUMNS}
            rows={PROJECTS}
            getRowId={(p) => p.id}
          />
        </Card>
      </div>

      <div className={styles.fullColumn}>
        <Card title="Scan queue" description="1 running · 2 queued · 1 failed">
          <DataTable
            caption="Scan queue"
            columns={JOB_COLUMNS}
            rows={JOBS}
            getRowId={(j) => j.id}
          />
        </Card>
      </div>

      <div className={styles.discoverColumn}>
        <Card title="Repositories in meridian" description="18 repositories available">
          <DataTable
            caption="Repositories in meridian"
            columns={REPO_COLUMNS}
            rows={REPOS}
            getRowId={(r) => r.id}
            selection={{
              selectedIds: selected,
              onSelectedIdsChange: setSelected,
              isRowSelectable: (r) => !r.monitored,
              getRowLabel: (r) => `Select ${r.name}`,
            }}
            footnote="Estimates use source size, selected detail and model rates; actual cost may vary. Commit counts are informational, not the analysis unit."
          />
        </Card>
      </div>

      <div className={styles.fullColumn}>
        <Card title="Modules & evidence" description="Clickable rows (hover)">
          <DataTable
            caption="Modules"
            columns={MODULE_COLUMNS}
            rows={MODULES}
            getRowId={(m) => m.id}
            onRowClick={noop}
          />
        </Card>
      </div>

      <div className={styles.discoverColumn}>
        <Card
          title="States"
          description="Slots for LIN-87 state components; 3 rows high by default"
          action={
            <Button
              size="sm"
              onClick={() =>
                setState((s) => (s === 'empty' ? 'loading' : s === 'loading' ? 'error' : 'empty'))
              }
            >
              Next state ({state})
            </Button>
          }
        >
          <DataTable
            caption="Scan queue"
            columns={JOB_COLUMNS.slice(0, 4)}
            rows={[]}
            getRowId={(j) => j.id}
            loading={state === 'loading'}
            loadingState="Loading scans…"
            errorState={state === 'error' ? 'Could not load the scan queue.' : undefined}
            emptyState="No scans queued."
          />
        </Card>
      </div>
    </>
  );
}
