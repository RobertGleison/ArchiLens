import { Bell, CircleHelp, Search } from 'lucide-react';
import { useRef } from 'react';
import { ICON_SIZE } from '../ui/icon';
import { formatRelativeTime } from './formatRelativeTime';
import { isApplePlatform } from './platform';
import styles from './UtilityBar.module.css';
import { useGlobalSearchShortcut } from './useGlobalSearchShortcut';

export interface UtilityBarProps {
  lastSyncedAt: Date | null;
  /** Opens global search (button click or ⌘K / Ctrl+K). The search UI itself is a follow-up. */
  onOpenSearch?: () => void;
}

const SEARCH_PLACEHOLDER = 'Search repositories, projects, reports…';

/**
 * Top utility bar (Figma `3:12688`): global search trigger on the left, sync status and help /
 * notification buttons on the right. The icon buttons are plain placeholders until the button
 * system lands.
 */
export function UtilityBar({ lastSyncedAt, onOpenSearch }: UtilityBarProps) {
  const searchTrigger = useRef<HTMLButtonElement>(null);
  const apple = isApplePlatform();

  useGlobalSearchShortcut(
    onOpenSearch &&
      (() => {
        searchTrigger.current?.focus();
        onOpenSearch();
      }),
  );

  return (
    <header className={styles.bar}>
      <button
        ref={searchTrigger}
        type="button"
        className={styles.search}
        aria-keyshortcuts={apple ? 'Meta+K' : 'Control+K'}
        onClick={onOpenSearch}
      >
        <Search size={ICON_SIZE.search} aria-hidden className={styles.searchIcon} />
        <span className={styles.placeholder}>{SEARCH_PLACEHOLDER}</span>
        <kbd className={styles.keyHint}>{apple ? '⌘ K' : 'Ctrl K'}</kbd>
      </button>

      <div className={styles.utilities}>
        {lastSyncedAt && (
          <p className={styles.sync}>
            Last synced{' '}
            <time dateTime={lastSyncedAt.toISOString()}>{formatRelativeTime(lastSyncedAt)}</time>
          </p>
        )}
        <button type="button" className={styles.iconButton} aria-label="Help">
          <CircleHelp size={ICON_SIZE.nav} aria-hidden />
        </button>
        <button type="button" className={styles.iconButton} aria-label="Notifications">
          <Bell size={ICON_SIZE.nav} aria-hidden />
        </button>
      </div>
    </header>
  );
}
