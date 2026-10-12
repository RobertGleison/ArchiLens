import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cx } from './cx';
import styles from './AttributeList.module.css';

/**
 * Label / value list (System profile 3:13379, Analysis provenance 3:14078) as a `<dl>`: each item
 * is a 600 12px ink label over an 11px muted value (gap 3), with a 1px divider between items and
 * none after the last. Items are `AttributeListItem`s. Put an optional trailing link (e.g. "View
 * scan log & full provenance →") after the list.
 */
export const AttributeList = forwardRef<HTMLDListElement, ComponentPropsWithoutRef<'dl'>>(
  function AttributeList({ className, ...rest }, ref) {
    return <dl ref={ref} {...rest} className={cx(styles.list, className)} />;
  },
);

export interface AttributeListItemProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  label: ReactNode;
  children: ReactNode;
}

/** One label / value pair of an `AttributeList`. */
export const AttributeListItem = forwardRef<HTMLDivElement, AttributeListItemProps>(
  function AttributeListItem({ label, children, className, ...rest }, ref) {
    return (
      <div ref={ref} {...rest} className={cx(styles.item, className)}>
        <dt className={styles.label}>{label}</dt>
        <dd className={styles.value}>{children}</dd>
      </div>
    );
  },
);
