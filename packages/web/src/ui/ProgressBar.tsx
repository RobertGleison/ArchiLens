import { forwardRef, useId, type ComponentPropsWithoutRef, type ReactElement } from 'react';
import { cx } from './cx';
import { hasSlot } from './slot';
import styles from './ProgressBar.module.css';

/** Renderable label content (never empty: no null, undefined or booleans). */
type LabelContent = string | number | ReactElement;

interface ProgressBarOwnProps {
  /** Current value, clamped to `min`..`max`; a non-finite value (NaN, ±Infinity) counts as `min`. */
  value: number;
  min?: number;
  max?: number;
  /** `sm` 4px (scan progress, default), `md` 5px (monthly budget). */
  size?: 'sm' | 'md';
  /** Human-readable value for assistive tech, e.g. "$42.80 of $120". Defaults to the percentage. */
  valueText?: string;
  /** Class for the progressbar element (the track), e.g. to set a width. */
  className?: string;
}

type ProgressBarLabelProps =
  | {
      /** Visible 11px label above the bar; also names the progressbar. */
      label: LabelContent;
      /** Class for the wrapper holding the label and the bar (labelled mode only). */
      wrapperClassName?: string;
      'aria-label'?: never;
      'aria-labelledby'?: never;
    }
  | { label?: never; wrapperClassName?: never; 'aria-label': string; 'aria-labelledby'?: never }
  | { label?: never; wrapperClassName?: never; 'aria-label'?: never; 'aria-labelledby': string };

export type ProgressBarProps = ProgressBarOwnProps &
  ProgressBarLabelProps &
  Omit<
    ComponentPropsWithoutRef<'div'>,
    keyof ProgressBarOwnProps | 'aria-label' | 'aria-labelledby' | 'children'
  >;

/**
 * Progress / budget bar (scan progress 3:12864, budget 3:14799): border-grey track, accent fill.
 * `role="progressbar"` with `aria-valuenow/min/max`; name it with `label`, `aria-label` or
 * `aria-labelledby`. The ref, `className` and all other props (id, aria-*, data-*) go on the
 * progressbar element; with `label`, a wrapper (`wrapperClassName`) holds the label and the bar.
 * Full width by default; set a width on `className` / `wrapperClassName` (e.g. 220px in tables).
 */
export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(function ProgressBar(
  {
    value,
    min = 0,
    max = 100,
    size = 'sm',
    valueText,
    label,
    wrapperClassName,
    className,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    ...rest
  },
  ref,
) {
  const labelId = useId();
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) && max > safeMin ? max : safeMin;
  const safeValue = Number.isFinite(value) ? value : safeMin;
  const clamped = Math.min(safeMax, Math.max(safeMin, safeValue));
  const range = safeMax - safeMin;
  const percent = range > 0 ? ((clamped - safeMin) / range) * 100 : 0;
  const hasLabel = hasSlot(label);

  const bar = (
    <div
      ref={ref}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={safeMin}
      aria-valuemax={safeMax}
      aria-valuetext={valueText ?? `${Math.round(percent)}%`}
      aria-label={ariaLabel}
      aria-labelledby={hasLabel ? labelId : ariaLabelledBy}
      {...rest}
      className={cx(styles.track, styles[size], className)}
      data-size={size}
    >
      <div className={styles.fill} style={{ width: `${percent}%` }} />
    </div>
  );

  if (!hasLabel) return bar;
  return (
    <div className={cx(styles.labelled, wrapperClassName)}>
      <span id={labelId} className={styles.label}>
        {label}
      </span>
      {bar}
    </div>
  );
});
