import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cx } from './cx';
import styles from './StatTile.module.css';

export type StatTileVariant = 'outlined' | 'filled';
export type StatTileTone = 'ink' | 'accent';

export interface StatTileProps extends Omit<ComponentPropsWithoutRef<'dl'>, 'children'> {
  /** What is measured, e.g. "Monitored repositories". */
  label: ReactNode;
  /** The figure, e.g. `8` or "$42.80". */
  value: ReactNode;
  /** Optional muted helper line under the value (outlined), e.g. "Across 2 GitHub organizations". */
  helper?: ReactNode;
  /**
   * `outlined` (default): bordered metric tile, label above the value (Overview, 3:12713).
   * `filled`: borderless comparison tile, value above the label (History, 3:14321).
   */
  variant?: StatTileVariant;
  /** Value colour: `ink` (default) or `accent` for highlighted values / positive deltas. */
  tone?: StatTileTone;
}

/**
 * Metric / stat tile. A `<dl>` so the label (`<dt>`) names the value (`<dd>`) for assistive tech;
 * the filled variant shows the value first visually but keeps label-then-value reading order.
 * Lay several out with `StatGrid` (four per row, 16px gap).
 */
export const StatTile = forwardRef<HTMLDListElement, StatTileProps>(function StatTile(
  { label, value, helper, variant = 'outlined', tone = 'ink', className, ...rest },
  ref,
) {
  return (
    <dl
      ref={ref}
      {...rest}
      className={cx(styles.tile, styles[variant], className)}
      data-variant={variant}
      data-tone={tone}
    >
      <dt className={styles.label}>{label}</dt>
      <dd className={cx(styles.value, tone === 'accent' && styles.accent)}>{value}</dd>
      {helper != null && helper !== false && <dd className={styles.helper}>{helper}</dd>}
    </dl>
  );
});
