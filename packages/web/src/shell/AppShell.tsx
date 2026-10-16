import { Outlet, useLocation } from 'react-router-dom';
import { RouteErrorBoundary } from './RouteErrorBoundary';
import { useShellData } from './shellData';
import { Sidebar } from './Sidebar';
import { UtilityBar } from './UtilityBar';
import styles from './AppShell.module.css';

export const MAIN_CONTENT_ID = 'main-content';

// TODO: open the global search dialog once it exists. Until then the trigger and ⌘K / Ctrl+K only
// move focus to the search trigger.
function openSearch() {}

/**
 * Persistent layout around every screen: sidebar, utility bar and the routed page in `<main>`.
 *
 * Pages render straight into the content column, which lays its children out with the page
 * padding and a 24px vertical gap, so a page is typically `<PageHeading … />` followed by its
 * sections (see `ui/PageHeading` and `ui/layout`).
 */
export function AppShell() {
  const { connection, pinnedProject, lastSyncedAt } = useShellData();
  const { pathname } = useLocation();

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href={`#${MAIN_CONTENT_ID}`}>
        Skip to content
      </a>
      <div className={styles.sidebar}>
        <Sidebar connection={connection} pinnedProject={pinnedProject} />
      </div>
      <div className={styles.application}>
        <UtilityBar lastSyncedAt={lastSyncedAt} onOpenSearch={openSearch} />
        <main id={MAIN_CONTENT_ID} tabIndex={-1} className={styles.content}>
          <RouteErrorBoundary resetKey={pathname}>
            <Outlet />
          </RouteErrorBoundary>
        </main>
      </div>
    </div>
  );
}
