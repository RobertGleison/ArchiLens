import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cx } from './cx';
import styles from './Divider.module.css';

/** 1px full-width rule in the border colour (`<hr>`, a separator). */
export const Divider = forwardRef<HTMLHRElement, ComponentPropsWithoutRef<'hr'>>(function Divider(
  { className, ...rest },
  ref,
) {
  return <hr ref={ref} {...rest} className={cx(styles.divider, className)} />;
});
