import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cx } from './cx';
import { hasSlot } from './slot';
import styles from './StatTile.module.css';

export type StatTileVariant = 'outlined' | 'filled';
export type StatTileTone = 'ink' | 'accent';

interface StatTileBaseProps extends Omit<ComponentPropsWithoutRef<'dl'>, 'children'> {
  /** What is measured, e.g. "Monitored repositories". */
  label: ReactNode;
  /** The figure, e.g. `8` or "$42.80". */
  value: ReactNode;
  /**
   * Value colour: `ink` (default) or `accent` for highlighted values. Figma's History comparison
   * tiles all use `accent` (including zero deltas); the fill does not change with tone.
   */
  tone?: StatTileTone;
}

/** Bordered metric tile, label above a 30px value (Overview, 3:12713). */
export interface OutlinedStatTileProps extends StatTileBaseProps {
  variant?: 'outlined';
  /** Optional muted helper line under the value, e.g. "Across 2 GitHub organizations". */
  helper?: ReactNode;
}

/** Accent-tint comparison tile, 26px value above the label (History, 3:14321). No helper line. */
export interface FilledStatTileProps extends StatTileBaseProps {
  variant: 'filled';
  helper?: never;
}

export type StatTileProps = OutlinedStatTileProps | FilledStatTileProps;

/**
 * Metric / stat tile. A `<dl>` so the label (`<dt>`) names the value (`<dd>`) for assistive tech;
 * the filled variant shows the value first visually but keeps label-then-value reading order.
 * Lay several out with `StatGrid` (four per row, 16px gap).
 */
export const StatTile = forwardRef<HTMLDListElement, StatTileProps>(function StatTile(
  { label, value, helper, variant = 'outlined', tone = 'ink', className, ...rest },
  ref,
) {
  const filled = variant === 'filled';
  return (
    <dl
      ref={ref}
      {...rest}
      className={cx(styles.tile, styles[variant], className)}
      data-variant={variant}
      data-tone={tone}
    >
      <dt className={filled ? styles.filledLabel : styles.label}>{label}</dt>
      <dd
        className={cx(
          filled ? styles.filledValue : styles.value,
          tone === 'accent' && styles.accent,
        )}
      >
        {value}
      </dd>
      {!filled && hasSlot(helper) && <dd className={styles.helper}>{helper}</dd>}
    </dl>
  );
});
