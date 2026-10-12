import { CircleAlert, RotateCw } from 'lucide-react';
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { Button } from './Button';
import { cx } from './cx';
import { EmptyState } from './EmptyState';
import { ICON_SIZE } from './icon';
import { useLiveRole } from './liveRegion';
import { omit } from './omit';
import { hasSlot } from './slot';
import styles from './ErrorState.module.css';

interface ErrorStateBaseProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title' | 'role'> {
  /** Retry callback (required: every error state offers a way to try again). */
  onRetry: () => void;
  /**
   * The retry is in progress: the Retry button shows its spinner and stays focusable. Pass it
   * (even `false`) to get the button's polite "Loading" announcement; omit it otherwise.
   */
  retrying?: boolean;
  /** Retry button label. Defaults to "Retry". */
  retryLabel?: string;
}

export interface CardErrorStateProps extends ErrorStateBaseProps {
  variant?: 'card';
  /** 12px ink message, e.g. "Couldn't load repositories. The local server did not respond." */
  message: ReactNode;
}

export interface PageErrorStateProps extends ErrorStateBaseProps {
  /** Page-level (route failed): the `EmptyState` layout with a `circle-alert` icon. */
  variant: 'page';
  title: ReactNode;
  description?: ReactNode;
  /** Technical detail under the description (muted mono), e.g. the error message. */
  detail?: ReactNode;
  /** Target of the "Back to Overview" button. Defaults to `/`. */
  backTo?: string;
  /** Label of the back button. Defaults to "Back to Overview". */
  backLabel?: string;
  /** Title heading level. Defaults to 1 (the state replaces the page). */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}

export type ErrorStateProps = CardErrorStateProps | PageErrorStateProps;

const BASE_PROPS = ['variant', 'onRetry', 'retrying', 'retryLabel', 'className'] as const;

/**
 * "Something failed" (LIN-87; Figma draws no error screen, so it is derived from the context
 * notice 3:13527, the neutral "Failed" pill with `circle-alert` and the scan-queue Retry button
 * 3:12906). Monochrome on purpose: there is no danger colour.
 *
 * - `card` (default), for a card or table area: a notice-style block on the neutral subtle fill
 *   (radius 6, padding 14, gap 10), 18px `circle-alert` ink icon, 12px ink message and a small
 *   secondary Retry button (`rotate-cw`).
 * - `page`, for a failed route: `EmptyState` with `circle-alert`, title, description, Retry and a
 *   secondary "Back to Overview" button.
 *
 * Announced with `role="alert"` when it appears, except inside a live region
 * (`LiveRegionContext`, e.g. DataTable's state area), which announces it instead.
 */
export const ErrorState = forwardRef<HTMLDivElement, ErrorStateProps>(
  function ErrorState(props, ref) {
    const role = useLiveRole('alert');
    const retry = (size: 'sm' | 'md') => (
      <Button size={size} icon={RotateCw} onClick={props.onRetry} loading={props.retrying}>
        {props.retryLabel ?? 'Retry'}
      </Button>
    );

    if (props.variant === 'page') {
      const {
        title,
        description,
        detail,
        backTo = '/',
        backLabel = 'Back to Overview',
        headingLevel = 1,
        className,
      } = props;
      const rest = omit(props, [
        ...BASE_PROPS,
        'title',
        'description',
        'detail',
        'backTo',
        'backLabel',
        'headingLevel',
      ]);
      return (
        <EmptyState
          ref={ref}
          role={role}
          {...rest}
          className={cx(styles.page, className)}
          icon={CircleAlert}
          title={title}
          description={description}
          headingLevel={headingLevel}
          action={
            <>
              {retry('md')}
              <Button to={backTo}>{backLabel}</Button>
            </>
          }
        >
          {hasSlot(detail) && <p className={styles.detail}>{detail}</p>}
        </EmptyState>
      );
    }

    const { message, className } = props;
    const rest = omit(props, [...BASE_PROPS, 'message']);
    return (
      <div ref={ref} role={role} {...rest} className={cx(styles.card, className)}>
        <CircleAlert size={ICON_SIZE.notice} aria-hidden className={styles.icon} />
        <div className={styles.message}>{message}</div>
        {retry('sm')}
      </div>
    );
  },
);
