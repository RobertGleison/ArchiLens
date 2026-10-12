import {
  Activity,
  ArrowUpRight,
  Bell,
  CalendarClock,
  Check,
  ChevronDown,
  CircleAlert,
  CircleHelp,
  Clock,
  Download,
  ExternalLink,
  FileCode,
  FolderGit2,
  FolderPlus,
  GitCompareArrows,
  History,
  Info,
  Layers,
  Lock,
  Maximize2,
  MessageSquare,
  Play,
  Plus,
  RotateCw,
  Search,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { RepoScanState } from '@archilens/shared';
import { SCAN_STATUS_PILLS } from '../scans/scanStatusPill';
import { AnchorList } from '../ui/AnchorList';
import { AttributeList, AttributeListItem } from '../ui/AttributeList';
import { Button, type ButtonSize, type ButtonVariant } from '../ui/Button';
import { Card, CardFootnote, SubsectionHeading } from '../ui/Card';
import { Checkbox } from '../ui/Checkbox';
import { Divider } from '../ui/Divider';
import { IconButton } from '../ui/IconButton';
import { KeyHint } from '../ui/KeyHint';
import { StatGrid } from '../ui/layout';
import { Notice } from '../ui/Notice';
import { OptionCard, OptionCardGroup, PreviewTile } from '../ui/OptionCard';
import { ProgressBar } from '../ui/ProgressBar';
import { StatTile } from '../ui/StatTile';
import { GithubIcon } from '../ui/icons/GithubIcon';
import { Spinner } from '../ui/Spinner';
import { StatusPill } from '../ui/StatusPill';
import { TextLink } from '../ui/TextLink';
import styles from './ComponentPreview.module.css';
import { DataTablePreview } from './DataTablePreview';
import { FormsPreview, TabsPreview } from './FormsPreview';
import { StatesPreview } from './StatesPreview';

const noop = () => {};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <ul className={styles.rows}>{children}</ul>
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <li className={styles.row}>
      <span className={styles.label}>{label}</span>
      <div className={styles.items}>{children}</div>
    </li>
  );
}

const BUTTON_MATRIX: [ButtonVariant, ButtonSize][] = [
  ['primary', 'md'],
  ['secondary', 'md'],
  ['primary', 'sm'],
  ['secondary', 'sm'],
];

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.stack}>{children}</div>
    </section>
  );
}

function Caption({ children }: { children: ReactNode }) {
  return <p className={styles.caption}>{children}</p>;
}

function OptionCardDemo() {
  const [mode, setMode] = useState<string | null>('incremental');
  const [orgs, setOrgs] = useState<string[]>(['meridian']);
  return (
    <>
      <Caption>Scan modes (3:13418), radio group: arrow keys move the selection</Caption>
      <OptionCardGroup name="scan-mode" aria-label="Scan mode" value={mode} onValueChange={setMode}>
        <OptionCard
          value="baseline"
          icon={Layers}
          title="Baseline"
          description="Rebuild the current architecture"
          meta="Estimated $3.60 · ~210k tokens"
          showSelectedPill
        />
        <OptionCard
          value="incremental"
          icon={GitCompareArrows}
          title="Incremental"
          description="Changes since the last successful scan"
          meta="Estimated $0.42 · ~24k tokens"
          showSelectedPill
        />
        <OptionCard
          value="backfill"
          icon={History}
          title="Historical backfill"
          description="Reconstruct architecture over time"
          meta="Estimated $9.20 · monthly checkpoints"
          showSelectedPill
        />
      </OptionCardGroup>
      <Caption>Organization sources (3:13008), checkbox group, row layout</Caption>
      <OptionCardGroup
        type="checkbox"
        name="organizations"
        aria-label="Organizations"
        value={orgs}
        onValueChange={setOrgs}
      >
        <OptionCard
          layout="row"
          value="meridian"
          title="meridian"
          description="18 repositories available"
          trailing={<StatusPill tone="accent">Approved</StatusPill>}
        />
        <OptionCard
          layout="row"
          value="meridian-cloud"
          title="meridian-cloud"
          description="9 repositories available"
          trailing={<StatusPill tone="accent">Approved</StatusPill>}
        />
        <OptionCard
          layout="row"
          value="meridian-labs"
          title="meridian-labs"
          description="Approval requested Oct 10"
          trailing={<StatusPill>Pending approval</StatusPill>}
          disabled
        />
      </OptionCardGroup>
    </>
  );
}

/** Dev-only page (`/__components`) showing every UI component variant and state. */
export function ComponentPreview() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Components</h1>

      <Section title="Button">
        {BUTTON_MATRIX.map(([variant, size]) => (
          <Row key={`${variant}-${size}`} label={`${variant} / ${size}`}>
            <Button variant={variant} size={size} icon={Plus}>
              With icon
            </Button>
            <Button variant={variant} size={size}>
              No icon
            </Button>
            <Button variant={variant} size={size} icon={Plus} disabled>
              Disabled
            </Button>
            <Button variant={variant} size={size} icon={Plus} loading>
              Loading
            </Button>
            <Button variant={variant} size={size} loading>
              Loading, no icon
            </Button>
          </Row>
        ))}
        <Row label="page actions (3:12705)">
          <Button icon={Plus}>Create project</Button>
          <Button variant="primary" icon={FolderPlus}>
            Add repositories
          </Button>
        </Row>
        <Row label="more examples">
          <Button variant="primary" icon={Play}>
            Run scan
          </Button>
          <Button href="https://github.com" external icon={ExternalLink}>
            Open in GitHub
          </Button>
          <Button icon={GithubIcon}>Manage GitHub connection</Button>
          <Button icon={Search}>Look up</Button>
          <Button to="/" icon={ArrowUpRight}>
            View running job
          </Button>
          <Button icon={Download}>Export comparison</Button>
          <Button variant="primary">Compare</Button>
          <Button icon={ChevronDown}>Load earlier reports</Button>
        </Row>
        <Row label="small (3:12922)">
          <Button size="sm" icon={RotateCw}>
            Retry
          </Button>
          <Button size="sm" icon={Maximize2}>
            Expand diagram
          </Button>
          <Button size="sm" icon={ThumbsUp}>
            Accurate
          </Button>
          <Button size="sm" icon={ThumbsDown}>
            Inaccurate
          </Button>
          <Button size="sm" icon={MessageSquare}>
            Missing context
          </Button>
        </Row>
      </Section>

      <Section title="IconButton">
        <Row label="utility bar">
          <IconButton icon={CircleHelp} label="Help" />
          <IconButton icon={Bell} label="Notifications" />
          <IconButton icon={Bell} label="Notifications (disabled)" disabled />
        </Row>
      </Section>

      <Section title="TextLink">
        <Row label="action">
          <TextLink to="/projects">View all projects</TextLink>
          <TextLink onClick={noop}>Refresh</TextLink>
          <TextLink to="/projects/commerce-platform">Commerce platform</TextLink>
        </Row>
        <Row label="inline / md">
          <TextLink variant="inline" to="/repositories" arrow>
            All 8 repositories
          </TextLink>
          <TextLink variant="inline" to="/history" arrow>
            View job
          </TextLink>
          <TextLink variant="inline" onClick={noop}>
            Source consent granted
          </TextLink>
        </Row>
        <Row label="inline / sm">
          <TextLink variant="inline" size="sm" to="/reports" arrow>
            Open report
          </TextLink>
          <span className={styles.body}>
            <TextLink variant="inline" size="sm" onClick={noop}>
              Select all available
            </TextLink>{' '}
            ·{' '}
            <TextLink variant="inline" size="sm" onClick={noop}>
              Clear
            </TextLink>
          </span>
        </Row>
        <Row label="mono">
          <TextLink variant="mono" href="https://github.com" external>
            checkout.module.ts:12–34
          </TextLink>
          <TextLink variant="mono" icon={FileCode} href="https://github.com" external>
            payments/service.ts:88–120
          </TextLink>
        </Row>
        <Row label="quiet (table actions)">
          <TextLink variant="quiet" to="/history" arrow>
            View job
          </TextLink>
          <TextLink variant="quiet" onClick={noop}>
            Cancel
          </TextLink>
        </Row>
        <Row label="in body copy">
          <p className={styles.body}>
            The scan finished with warnings.{' '}
            <TextLink variant="inline" to="/history" arrow>
              View job
            </TextLink>
          </p>
        </Row>
      </Section>

      <Section title="Checkbox">
        <Row label="with label (3:13047)">
          <Checkbox label="3 selected" defaultChecked />
          <Checkbox label="GitHub release" />
        </Row>
        <Row label="unchecked / checked / mixed">
          <Checkbox aria-label="Unchecked" />
          <Checkbox aria-label="Checked" defaultChecked />
          <Checkbox aria-label="Mixed" indeterminate readOnly />
        </Row>
        <Row label="disabled">
          <Checkbox aria-label="Disabled" disabled />
          <Checkbox aria-label="Disabled checked" disabled defaultChecked />
        </Row>
      </Section>

      <Section title="StatusPill">
        <Row label="scanStatusToPill()">
          {(Object.keys(SCAN_STATUS_PILLS) as RepoScanState[]).map((state) => {
            const { label, ...pill } = SCAN_STATUS_PILLS[state];
            return (
              <StatusPill key={state} {...pill}>
                {label}
              </StatusPill>
            );
          })}
        </Row>
        <Row label="accent">
          <StatusPill tone="accent" icon={Activity}>
            Monitoring active
          </StatusPill>
          <StatusPill tone="accent" icon={Check}>
            Evidence-backed
          </StatusPill>
          <StatusPill tone="accent">8 this week</StatusPill>
          <StatusPill tone="accent">+1 component</StatusPill>
          <StatusPill tone="accent" icon={Spinner}>
            Incremental scan running · 68%
          </StatusPill>
        </Row>
        <Row label="neutral">
          <StatusPill icon={Lock}>Private</StatusPill>
          <StatusPill icon={Clock}>Pending approval</StatusPill>
          <StatusPill icon={CircleAlert}>Failed</StatusPill>
          <StatusPill>Baseline</StatusPill>
          <StatusPill>6 entities</StatusPill>
        </Row>
        <Row label="KeyHint">
          <KeyHint>⌘ K</KeyHint>
          <KeyHint>Ctrl K</KeyHint>
        </Row>
      </Section>

      <Block title="StatTile">
        <Caption>Overview metrics (3:12712)</Caption>
        <StatGrid>
          <StatTile
            label="Monitored repositories"
            value="8"
            helper="Across 2 GitHub organizations"
          />
          <StatTile
            label="Architecture projects"
            value="3"
            helper="Commerce, identity & analytics"
          />
          <StatTile
            label="Changes this week"
            value="14"
            tone="accent"
            helper="9 dependencies · 3 topology · 2 stack"
          />
          <StatTile label="Analysis spend" value="$42.80" helper="October · $120 monthly budget" />
        </StatGrid>
        <Caption>Filled, History comparison (3:14320)</Caption>
        <div className={styles.tileRow}>
          <StatTile variant="filled" tone="accent" label="Components & integrations" value="+4" />
          <StatTile variant="filled" tone="accent" label="Communication boundary" value="1" />
          <StatTile variant="filled" tone="accent" label="Removed components" value="0" />
        </div>
      </Block>

      <Block title="Card">
        <Caption>Your architecture landscape (3:12730), shell</Caption>
        <Card
          className={styles.mainColumn}
          title="Your architecture landscape"
          description="3 projects · 8 repositories · main branches"
          action={<TextLink to="/projects">View all projects</TextLink>}
        >
          <div className={styles.placeholder}>Projects table (LIN-85)</div>
          <SubsectionHeading
            title="Recently monitored"
            action={
              <TextLink variant="inline" size="sm" to="/repositories" arrow>
                All 8 repositories
              </TextLink>
            }
          />
          <div className={styles.tileRow}>
            <PreviewTile icon={FolderGit2} title="checkout-api" meta="TypeScript · 42 modules" />
            <PreviewTile icon={FolderGit2} title="payments-worker" meta="Go · 8 modules" />
            <PreviewTile icon={FolderGit2} title="storefront" meta="TypeScript · 19 modules" />
          </div>
        </Card>
        <Caption>Small button action, footnote, divider</Caption>
        <Card
          title="Scan queue"
          description="2 running · 1 queued"
          headingLevel={3}
          action={
            <Button size="sm" icon={RotateCw}>
              Refresh
            </Button>
          }
        >
          <ProgressBar
            wrapperClassName={styles.tableProgress}
            label="Building architecture model · 68%"
            value={68}
          />
          <Divider />
          <CardFootnote>Estimates use the last 30 days of model usage.</CardFootnote>
        </Card>
      </Block>

      <Block title="OptionCard">
        <OptionCardDemo />
      </Block>

      <Block title="Notice">
        <Notice icon={ShieldCheck}>
          Connected as meridian-bot. Read-only access; source is discarded after analysis.
        </Notice>
        <Notice icon={CalendarClock}>
          Next run tomorrow at 08:00 Europe/London · Skip unchanged enabled · Secrets excluded ·
          Source discarded after analysis.
        </Notice>
        <Notice icon={GitCompareArrows}>
          Comparison uses stored architecture models. It does not run another source analysis or
          incur model usage.
        </Notice>
        <Notice icon={Info} live>
          Live notice (role=status).
        </Notice>
      </Block>

      <Block title="ProgressBar">
        <Caption>sm, scan progress (3:12864), 220px</Caption>
        <ProgressBar
          wrapperClassName={styles.tableProgress}
          label="Building architecture model · 68%"
          value={68}
        />
        <Caption>md, monthly budget (3:14799), full width</Caption>
        <ProgressBar
          size="md"
          aria-label="Monthly budget used"
          value={42.8}
          max={120}
          valueText="$42.80 of $120"
        />
        <ProgressBar size="sm" aria-label="Empty" value={0} />
        <ProgressBar size="sm" aria-label="Complete" value={100} />
      </Block>

      <Block title="Tabs">
        <TabsPreview />
      </Block>

      <Block title="Form controls">
        <FormsPreview />
      </Block>

      <Block title="DataTable">
        <DataTablePreview />
      </Block>

      <Block title="Empty, loading and error states">
        <StatesPreview />
      </Block>

      <Block title="AttributeList / AnchorList">
        <div className={styles.asideRow}>
          <Card title="Analysis provenance" description="Reproducible context for this report">
            <AttributeList>
              <AttributeListItem label="Repository / branch">
                meridian/checkout-api · main
              </AttributeListItem>
              <AttributeListItem label="Commit range">
                b79a120 → a8f2c91 · 26 commits
              </AttributeListItem>
              <AttributeListItem label="Scan mode">Incremental · Standard detail</AttributeListItem>
              <AttributeListItem label="Provider / model">OpenAI · GPT-4.1</AttributeListItem>
              <AttributeListItem label="Usage">24.6k tokens · $0.43 actual cost</AttributeListItem>
            </AttributeList>
            <div>
              <TextLink variant="inline" size="sm" to="/history" arrow>
                View scan log & full provenance
              </TextLink>
            </div>
          </Card>
          <Card title="System profile" description="Evidence-backed architectural model">
            <AttributeList density="compact">
              <AttributeListItem label="Application stack">
                Node.js 22 · NestJS 10 · TypeScript 5.6
              </AttributeListItem>
              <AttributeListItem label="Data stores">PostgreSQL 16 · Redis 7</AttributeListItem>
              <AttributeListItem label="Deployment topology">
                ECS Fargate · 3 tasks · AWS eu-west-1
              </AttributeListItem>
            </AttributeList>
          </Card>
          <Card title="In this report">
            <AnchorList
              aria-label="In this report"
              activeHref="#executive-summary"
              items={[
                { href: '#executive-summary', label: 'Executive summary' },
                { href: '#visual-diff', label: 'Architecture visual diff' },
                { href: '#change-01', label: '01 · New cache dependency' },
                { href: '#change-02', label: '02 · Idempotency boundary' },
                { href: '#evidence', label: 'Evidence & limitations' },
              ]}
            />
          </Card>
        </div>
      </Block>
    </main>
  );
}
