import { forwardRef, useId, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cx } from './cx';
import styles from './ProgressBar.module.css';

interface ProgressBarOwnProps {
  /** Current value, clamped to `min`..`max`. */
  value: number;
  min?: number;
  max?: number;
  /** `sm` 4px (scan progress, default), `md` 5px (monthly budget). */
  size?: 'sm' | 'md';
  /** Human-readable value for assistive tech, e.g. "$42.80 of $120". Defaults to the percentage. */
  valueText?: string;
  className?: string;
}

type ProgressBarLabelProps =
  | {
      /** Visible 11px label above the bar; also names the progressbar. */
      label: ReactNode;
      'aria-label'?: never;
      'aria-labelledby'?: never;
    }
  | { label?: never; 'aria-label': string; 'aria-labelledby'?: never }
  | { label?: never; 'aria-label'?: never; 'aria-labelledby': string };

export type ProgressBarProps = ProgressBarOwnProps &
  ProgressBarLabelProps &
  Omit<
    ComponentPropsWithoutRef<'div'>,
    keyof ProgressBarOwnProps | 'aria-label' | 'aria-labelledby'
  >;

/**
 * Progress / budget bar (scan progress 3:12864, budget 3:14799): border-grey track, accent fill.
 * `role="progressbar"` with `aria-valuenow/min/max`; name it with `label`, `aria-label` or
 * `aria-labelledby`. Full width by default; set a width on `className` (e.g. 220px in tables).
 */
export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(function ProgressBar(
  {
    value,
    min = 0,
    max = 100,
    size = 'sm',
    valueText,
    label,
    className,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    ...rest
  },
  ref,
) {
  const labelId = useId();
  const clamped = Math.min(max, Math.max(min, value));
  const range = max - min;
  const percent = range > 0 ? ((clamped - min) / range) * 100 : 0;
  const hasLabel = label != null && label !== false;

  const bar = (
    <div
      ref={hasLabel ? undefined : ref}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuetext={valueText ?? `${Math.round(percent)}%`}
      aria-label={ariaLabel}
      aria-labelledby={hasLabel ? labelId : ariaLabelledBy}
      {...(hasLabel ? {} : rest)}
      className={cx(styles.track, styles[size], !hasLabel && className)}
      data-size={size}
    >
      <div className={styles.fill} style={{ width: `${percent}%` }} />
    </div>
  );

  if (!hasLabel) return bar;
  return (
    <div ref={ref} {...rest} className={cx(styles.labelled, className)}>
      <span id={labelId} className={styles.label}>
        {label}
      </span>
      {bar}
    </div>
  );
});
