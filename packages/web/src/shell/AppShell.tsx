import { Outlet } from 'react-router-dom';
import { useShellData } from './shellData';
import { Sidebar } from './Sidebar';
import { UtilityBar } from './UtilityBar';
import styles from './AppShell.module.css';

export const MAIN_CONTENT_ID = 'main-content';

/**
 * Persistent layout around every screen: sidebar, utility bar and the routed page in `<main>`.
 *
 * Pages render straight into the content column, which lays its children out with the page
 * padding and a 24px vertical gap, so a page is typically `<PageHeading … />` followed by its
 * sections (see `ui/PageHeading` and `ui/layout`).
 */
export function AppShell() {
  const { connection, pinnedProject, lastSyncedAt } = useShellData();

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href={`#${MAIN_CONTENT_ID}`}>
        Skip to content
      </a>
      <div className={styles.sidebar}>
        <Sidebar connection={connection} pinnedProject={pinnedProject} />
      </div>
      <div className={styles.application}>
        <UtilityBar lastSyncedAt={lastSyncedAt} />
        <main id={MAIN_CONTENT_ID} tabIndex={-1} className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
