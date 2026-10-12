import { Bell, CircleHelp, Search } from 'lucide-react';
import { useRef } from 'react';
import { ICON_SIZE } from '../ui/icon';
import { IconButton } from '../ui/IconButton';
import { KeyHint } from '../ui/StatusPill';
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
 * notification buttons on the right. The search trigger is a bespoke borderless field-like button
 * (no Button variant matches it).
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
        <KeyHint>{apple ? '⌘ K' : 'Ctrl K'}</KeyHint>
      </button>

      <div className={styles.utilities}>
        {lastSyncedAt && (
          <p className={styles.sync}>
            Last synced{' '}
            <time dateTime={lastSyncedAt.toISOString()}>{formatRelativeTime(lastSyncedAt)}</time>
          </p>
        )}
        <IconButton icon={CircleHelp} label="Help" />
        <IconButton icon={Bell} label="Notifications" />
      </div>
    </header>
  );
}
