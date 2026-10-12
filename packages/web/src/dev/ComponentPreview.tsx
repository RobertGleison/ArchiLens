import {
  Activity,
  ArrowUpRight,
  Bell,
  Check,
  ChevronDown,
  CircleAlert,
  CircleHelp,
  Clock,
  Download,
  ExternalLink,
  FileCode,
  FolderPlus,
  Lock,
  Maximize2,
  MessageSquare,
  Play,
  Plus,
  RotateCw,
  Search,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Button, type ButtonSize, type ButtonVariant } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { GithubIcon } from '../ui/icons/GithubIcon';
import { SCAN_STATUSES, scanStatusToPill } from '../ui/scanStatus';
import { Spinner } from '../ui/Spinner';
import { KeyHint, StatusPill } from '../ui/StatusPill';
import { TextLink } from '../ui/TextLink';
import styles from './ComponentPreview.module.css';

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
          <Button href="https://github.com" target="_blank" rel="noreferrer" icon={ExternalLink}>
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
          <TextLink variant="inline" to="/repositories" trailing="arrow">
            All 8 repositories
          </TextLink>
          <TextLink variant="inline" to="/history" trailing="arrow">
            View job
          </TextLink>
          <TextLink variant="inline" onClick={noop}>
            Source consent granted
          </TextLink>
        </Row>
        <Row label="inline / sm">
          <TextLink variant="inline" size="sm" to="/reports" trailing="arrow">
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
          <TextLink
            variant="mono"
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            trailing="external"
          >
            checkout.module.ts:12–34
          </TextLink>
          <TextLink variant="mono" icon={FileCode} href="https://github.com" trailing="external">
            payments/service.ts:88–120
          </TextLink>
        </Row>
        <Row label="in body copy">
          <p className={styles.body}>
            The scan finished with warnings.{' '}
            <TextLink variant="inline" to="/history" trailing="arrow">
              View job
            </TextLink>
          </p>
        </Row>
      </Section>

      <Section title="StatusPill">
        <Row label="scanStatusToPill()">
          {SCAN_STATUSES.map((status) => {
            const { label, ...pill } = scanStatusToPill(status);
            return (
              <StatusPill key={status} {...pill}>
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
    </main>
  );
}
