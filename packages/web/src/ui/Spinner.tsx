import { Loader } from 'lucide-react';
import type { ReactNode } from 'react';
import { cx } from './cx';
import { ICON_SIZE } from './icon';
import type { IconComponentProps } from './iconTypes';
import { useLiveRole } from './liveRegion';
import { hasSlot } from './slot';
import styles from './Spinner.module.css';
import a11y from './visuallyHidden.module.css';

export interface SpinnerProps extends IconComponentProps {
  /**
   * Stand-alone use: what is loading, e.g. "Loading repositories…". The spinner then defaults to
   * 18px in accent with the label after it, in a polite `role="status"` region (no role inside a
   * `LiveRegionContext`). Without a label the spinner is a decorative icon.
   */
  label?: ReactNode;
  /** Keep the label for assistive tech only. */
  hideLabel?: boolean;
}

/**
 * Lucide `loader` that rotates (static under `prefers-reduced-motion`). Without `label` it has the
 * icon component shape, so it can be passed as an `icon` (e.g. the "Running" status pill, 12px
 * there, 15px in buttons). Then it is decorative: the busy state is announced by the owning
 * control (`aria-busy`) or by the visible label next to it. Long-running work (scans) uses the
 * running pill + `ProgressBar` instead.
 */
export function Spinner({ size, className, label, hideLabel = false }: SpinnerProps) {
  const role = useLiveRole('status');
  if (!hasSlot(label)) {
    return (
      <Loader size={size} aria-hidden data-spinner="" className={cx(styles.spinner, className)} />
    );
  }
  return (
    <span role={role} className={cx(styles.standalone, className)}>
      <Loader
        size={size ?? ICON_SIZE.spinner}
        aria-hidden
        data-spinner=""
        className={cx(styles.spinner, styles.accent)}
      />
      <span className={hideLabel ? a11y.visuallyHidden : styles.label}>{label}</span>
    </span>
  );
}
