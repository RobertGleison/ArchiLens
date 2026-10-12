import type { ComponentPropsWithoutRef } from 'react';
import { cx } from './cx';
import styles from './KeyHint.module.css';

export type KeyHintProps = ComponentPropsWithoutRef<'kbd'>;

/** Keyboard shortcut chip (e.g. "⌘ K"): a neutral status pill rendered as `<kbd>`. */
export function KeyHint({ className, ...rest }: KeyHintProps) {
  return <kbd {...rest} className={cx(styles.keyHint, className)} />;
}
