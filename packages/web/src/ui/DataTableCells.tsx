import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import type { LinkProps } from 'react-router-dom';
import { cx } from './cx';
import { ProgressBar, type ProgressBarProps } from './ProgressBar';
import { TextLink } from './TextLink';
import styles from './DataTable.module.css';

export interface IdentityCellProps extends ComponentPropsWithoutRef<'div'> {
  /** Name, 600 12px (e.g. "meridian/checkout-api"). Turns accent when it links or the row is selected. */
  primary: ReactNode;
  /** Muted 11px line under the name (e.g. "main · 38 new commits"). */
  secondary?: ReactNode;
  /** Makes the name an in-app link (`TextLink`), e.g. to the project. */
  to?: LinkProps['to'];
  /** Makes the name a plain link. */
  href?: string;
}

/** Two-line identity cell (Figma 3:12854, 3:12748): name over a muted secondary line, gap 3. */
export const IdentityCell = forwardRef<HTMLDivElement, IdentityCellProps>(function IdentityCell(
  { primary, secondary, to, href, className, ...rest },
  ref,
) {
  const name =
    to !== undefined ? (
      <TextLink to={to}>{primary}</TextLink>
    ) : href !== undefined ? (
      <TextLink href={href}>{primary}</TextLink>
    ) : (
      primary
    );
  return (
    <div ref={ref} {...rest} className={cx(styles.identity, className)}>
      <span className={styles.identityPrimary}>{name}</span>
      {secondary != null && secondary !== false && (
        <span className={styles.identitySecondary}>{secondary}</span>
      )}
    </div>
  );
});

/**
 * Scan progress in a table cell (Figma 3:12864): an 11px label 6px above a 4px bar, label and bar
 * within 220px. Takes the `ProgressBar` props (always the `sm` size).
 */
export const ProgressCell = forwardRef<HTMLDivElement, ProgressBarProps>(
  function ProgressCell(props, ref) {
    if (props.label !== undefined) {
      return (
        <ProgressBar
          ref={ref}
          {...props}
          size="sm"
          wrapperClassName={cx(styles.progress, props.wrapperClassName)}
        />
      );
    }
    return (
      <ProgressBar
        ref={ref}
        {...props}
        size="sm"
        className={cx(styles.progress, props.className)}
      />
    );
  },
);
