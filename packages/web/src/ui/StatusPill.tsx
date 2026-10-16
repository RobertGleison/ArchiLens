import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cx } from './cx';
import { ICON_SIZE } from './icon';
import type { IconComponent } from './iconTypes';
import styles from './StatusPill.module.css';

export type StatusPillTone = 'accent' | 'neutral';

export interface StatusPillProps extends ComponentPropsWithoutRef<'span'> {
  /** `accent`: positive / active / counts. `neutral`: info / pending / problems. Default `neutral`. */
  tone?: StatusPillTone;
  /** Optional leading 12px icon; pass `Spinner` for an in-progress state. */
  icon?: IconComponent;
  children: ReactNode;
}

/**
 * Status pill / badge (Figma 3:12752, 3:12779). For scan states use `scanStatusToPill()` from
 * `scans/scanStatusPill`.
 */
export const StatusPill = forwardRef<HTMLSpanElement, StatusPillProps>(function StatusPill(
  { tone = 'neutral', icon: Icon, className, children, ...rest },
  ref,
) {
  return (
    <span ref={ref} {...rest} className={cx(styles.pill, styles[tone], className)} data-tone={tone}>
      {Icon && <Icon size={ICON_SIZE.pill} aria-hidden className={styles.icon} />}
      {children}
    </span>
  );
});
