import { Blocks, ShieldCheck, Workflow } from 'lucide-react';
import { useId } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ICON_SIZE } from '../ui/icon';
import { NAV_ITEMS } from './navItems';
import type { GithubConnection, PinnedProject } from './shellData';
import styles from './Sidebar.module.css';

export interface SidebarProps {
  connection: GithubConnection;
  pinnedProject: PinnedProject | null;
}

function connectionSummary({ organizationsConnected: count }: GithubConnection): string {
  if (count === null) return 'Not connected';
  return `${count} ${count === 1 ? 'organization' : 'organizations'} connected`;
}

/**
 * Dark workspace navigation (Figma `3:14413`). The Figma workspace selector and account block are
 * intentionally left out: ArchiLens is a single-user app.
 */
export function Sidebar({ connection, pinnedProject }: SidebarProps) {
  const pinnedLabelId = useId();

  return (
    <div className={styles.sidebar}>
      <div className={styles.top}>
        <div className={styles.identity}>
          <Blocks size={ICON_SIZE.logo} aria-hidden className={styles.logo} />
          <p className={styles.productName}>
            Repository
            <br />
            Architecture Monitor
          </p>
        </div>

        <nav aria-label="Main">
          <ul className={styles.navList}>
            {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem
                  }
                >
                  <Icon size={ICON_SIZE.nav} aria-hidden className={styles.navIcon} />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {pinnedProject && (
          <nav className={styles.pinned} aria-labelledby={pinnedLabelId}>
            <p id={pinnedLabelId} className={styles.overline}>
              Pinned project
            </p>
            <Link
              to={`/projects/${encodeURIComponent(pinnedProject.id)}`}
              className={styles.pinnedLink}
            >
              <Workflow size={ICON_SIZE.card} aria-hidden className={styles.pinnedIcon} />
              {pinnedProject.name}
            </Link>
          </nav>
        )}
      </div>

      <div className={styles.connection}>
        <p className={styles.connectionLabel}>
          <ShieldCheck size={ICON_SIZE.card} aria-hidden className={styles.connectionIcon} />
          GitHub · read-only
        </p>
        <p className={styles.connectionDetail}>{connectionSummary(connection)}</p>
      </div>
    </div>
  );
}
