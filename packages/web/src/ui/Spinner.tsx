import { Loader } from 'lucide-react';
import { cx } from './cx';
import type { IconComponentProps } from './iconTypes';
import styles from './Spinner.module.css';

/**
 * Lucide `loader` that rotates (static under `prefers-reduced-motion`). It has the icon component
 * shape, so it can be passed as an `icon` (e.g. the "Running" status pill). Always decorative: the
 * busy state is announced by the owning control (`aria-busy`) or by the visible label next to it.
 */
export function Spinner({ size, className }: IconComponentProps) {
  return (
    <Loader size={size} aria-hidden data-spinner="" className={cx(styles.spinner, className)} />
  );
}
