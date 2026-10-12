import { Info } from 'lucide-react';
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cx } from './cx';
import { ICON_SIZE } from './icon';
import type { IconComponent } from './iconTypes';
import styles from './Notice.module.css';

export interface NoticeProps extends ComponentPropsWithoutRef<'div'> {
  /** Leading 18px icon, e.g. `ShieldCheck`, `CalendarClock`, `GitCompareArrows`. Default `Info`. */
  icon?: IconComponent;
  /**
   * Announce changes politely (`role="status"`), for notices whose text updates while the page is
   * open. Default `false`: a static `role="note"`.
   */
  live?: boolean;
  children: ReactNode;
}

/**
 * Inline context notice (Figma 3:13527): accent tint, radius 6, padding 14, 18px icon + 12px ink
 * text. Informational only; there is no urgent/alert variant in the design.
 */
export const Notice = forwardRef<HTMLDivElement, NoticeProps>(function Notice(
  { icon: Icon = Info, live = false, className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      role={live ? 'status' : 'note'}
      {...rest}
      className={cx(styles.notice, className)}
    >
      <Icon size={ICON_SIZE.notice} aria-hidden className={styles.icon} />
      <div className={styles.text}>{children}</div>
    </div>
  );
});
