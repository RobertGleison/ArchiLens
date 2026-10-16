import { FileText, FolderGit2, FolderPlus, History, Network } from 'lucide-react';
import { useState } from 'react';
import { AsyncBoundary, type AsyncStatus } from '../ui/AsyncBoundary';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { StatGrid } from '../ui/layout';
import { SkeletonCard, SkeletonStatTile, SkeletonTableRows, SkeletonText } from '../ui/Skeleton';
import { Spinner } from '../ui/Spinner';
import { StatTile } from '../ui/StatTile';
import styles from './ComponentPreview.module.css';

const ORDER: AsyncStatus[] = ['loading', 'ready', 'empty', 'error'];

function Caption({ children }: { children: string }) {
  return <p className={styles.caption}>{children}</p>;
}

/** Retry that "takes" a second, to show the Retry button's loading state. */
function useFakeRetry() {
  const [retrying, setRetrying] = useState(false);
  const retry = () => {
    setRetrying(true);
    window.setTimeout(() => setRetrying(false), 1000);
  };
  return { retrying, retry };
}

function AsyncDemo() {
  const [state, setState] = useState<AsyncStatus>('loading');
  const { retrying, retry } = useFakeRetry();
  const next = () => setState((s) => ORDER[(ORDER.indexOf(s) + 1) % ORDER.length] ?? 'loading');
  return (
    <div className={styles.mainColumn}>
      <Card
        title="Monitored repositories"
        description={`AsyncBoundary in a Card (${state})`}
        action={
          <Button size="sm" onClick={next}>
            Next state
          </Button>
        }
      >
        <AsyncBoundary
          state={state}
          loading={<SkeletonText lines={3} label="Loading repositories" />}
          error={
            <ErrorState
              message="Couldn't load repositories. The local server did not respond."
              onRetry={retry}
              retrying={retrying}
            />
          }
          empty={
            <EmptyState
              icon={FolderGit2}
              title="No repositories monitored yet"
              description="Add repositories from a connected GitHub organization to start scanning."
              action={
                <Button variant="primary" icon={FolderPlus}>
                  Add repositories
                </Button>
              }
            />
          }
        >
          <p className={styles.body}>
            meridian/checkout-api · meridian/storefront · meridian-cloud/platform-infra
          </p>
        </AsyncBoundary>
      </Card>
    </div>
  );
}

/** Empty, loading and error state examples (LIN-87). */
export function StatesPreview() {
  const { retrying, retry } = useFakeRetry();
  return (
    <>
      <Caption>EmptyState, full (in a card or table area)</Caption>
      <div className={styles.tileRow}>
        <Card>
          <EmptyState
            icon={FolderGit2}
            title="No repositories monitored yet"
            description="Add repositories to start building architecture reports."
            action={
              <Button variant="primary" icon={FolderPlus}>
                Add repositories
              </Button>
            }
          />
        </Card>
        <Card>
          <EmptyState
            icon={Network}
            title="No projects yet"
            description="Group repositories into a project to compare them."
          />
        </Card>
      </div>
      <div className={styles.tileRow}>
        <Card>
          <EmptyState
            icon={FileText}
            title="No reports yet"
            description="Reports appear after the first scan."
          />
        </Card>
        <Card>
          <EmptyState
            icon={History}
            title="No history yet"
            description="Each scan adds a checkpoint here."
          />
        </Card>
      </div>

      <Caption>EmptyState, compact (small cards)</Caption>
      <div className={styles.asideRow}>
        <Card title="Recent changes">
          <EmptyState variant="compact">No architectural changes this week</EmptyState>
        </Card>
      </div>

      <Caption>Skeletons: SkeletonStatTile × 4 next to the real tile</Caption>
      <StatGrid>
        <StatTile label="Monitored repositories" value="8" helper="Across 2 GitHub organizations" />
        <SkeletonStatTile />
        <SkeletonStatTile />
        <SkeletonStatTile />
      </StatGrid>

      <Caption>SkeletonText (sm 12 / md 16 / lg 30) and SkeletonCard</Caption>
      <div className={styles.asideRow}>
        <div className={styles.stack}>
          <SkeletonText size="lg" width="50%" />
          <SkeletonText size="md" width="70%" />
          <SkeletonText lines={3} />
        </div>
        <SkeletonCard />
      </div>

      <Caption>
        SkeletonTableRows (stand-alone, with selection and an end-aligned column; DataTable uses it
        under its header)
      </Caption>
      <div className={styles.mainColumn}>
        <SkeletonTableRows
          rows={2}
          selectable
          columns={[{ width: 246 }, { width: 132 }, { width: 124 }, { width: 100, align: 'end' }]}
        />
      </div>

      <Caption>Spinner: 12px in pills / buttons (see StatusPill, Button); 18px stand-alone</Caption>
      <div className={styles.items}>
        <Spinner label="Loading repositories…" />
      </div>

      <Caption>ErrorState, card</Caption>
      <div className={styles.mainColumn}>
        <ErrorState
          message="Couldn't load repositories. The local server did not respond."
          onRetry={retry}
          retrying={retrying}
        />
      </div>

      <Caption>ErrorState, page (route failed)</Caption>
      <Card>
        <ErrorState
          variant="page"
          headingLevel={3}
          title="Something went wrong"
          description="This page failed to load. Try again, or go back to Overview."
          detail="TypeError: Cannot read properties of undefined (reading 'modules')"
          onRetry={retry}
          retrying={retrying}
        />
      </Card>

      <Caption>AsyncBoundary: loading → ready → empty → error</Caption>
      <AsyncDemo />
    </>
  );
}
