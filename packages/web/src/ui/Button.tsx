import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cx } from './cx';
import { ICON_SIZE } from './icon';
import type { IconComponent } from './iconTypes';
import { omit } from './omit';
import { Spinner } from './Spinner';
import styles from './Button.module.css';
import a11y from './visuallyHidden.module.css';

export type ButtonVariant = 'primary' | 'secondary';
export type ButtonSize = 'md' | 'sm';

interface ButtonOwnProps {
  /** Defaults to `secondary`. */
  variant?: ButtonVariant;
  /** `md` is 38px tall, `sm` 30px. Defaults to `md`. */
  size?: ButtonSize;
  /** Optional leading icon (15px), e.g. `icon={Plus}`. */
  icon?: IconComponent;
  children: ReactNode;
  className?: string;
}

/**
 * A `<button>`. `loading` shows a spinner and makes the button inert without disabling it (so it
 * keeps focus): `aria-disabled`, `aria-busy`, clicks swallowed. Pass `loading={false}` up front on
 * buttons that can load, so the polite "Loading" announcement region exists before it is needed.
 */
export type ButtonAsButtonProps = ButtonOwnProps &
  Omit<ComponentPropsWithoutRef<'button'>, keyof ButtonOwnProps> & {
    loading?: boolean;
    to?: never;
    href?: never;
    external?: never;
  };

/** An in-app navigation rendered as a router `<Link>`. */
export type ButtonAsLinkProps = ButtonOwnProps &
  Omit<LinkProps, keyof ButtonOwnProps> & {
    loading?: never;
    disabled?: never;
    href?: never;
    external?: never;
  };

/** A plain `<a>` (e.g. "Open in GitHub"). */
export type ButtonAsAnchorProps = ButtonOwnProps &
  Omit<ComponentPropsWithoutRef<'a'>, keyof ButtonOwnProps> & {
    href: string;
    /** Opens in a new tab (`target="_blank"`, `rel="noopener noreferrer"`) and says so to AT. */
    external?: boolean;
    loading?: never;
    disabled?: never;
    to?: never;
  };

export type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps | ButtonAsAnchorProps;

const OWN_PROPS = ['variant', 'size', 'icon', 'children', 'className'] as const;

/**
 * Action button (Figma 3:12705, 3:12922): `primary` or `secondary`, `md` or `sm`, with an optional
 * leading icon. Pass `to` to navigate in-app (router link) or `href` for a plain link.
 */
export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button(props, ref) {
    const { variant = 'secondary', size = 'md', icon: Icon, children, className } = props;
    const classes = cx(styles.button, styles[variant], size === 'sm' && styles.sm, className);
    const data = { 'data-variant': variant, 'data-size': size };

    const content = (loading: boolean) => (
      <>
        {loading && Icon && <Spinner size={ICON_SIZE.button} className={styles.icon} />}
        {!loading && Icon && <Icon size={ICON_SIZE.button} aria-hidden className={styles.icon} />}
        {loading && !Icon ? (
          <>
            <span className={styles.hiddenLabel}>{children}</span>
            <Spinner size={ICON_SIZE.button} className={styles.overlaySpinner} />
          </>
        ) : (
          children
        )}
      </>
    );

    if (props.to !== undefined) {
      return (
        <Link
          ref={ref as Ref<HTMLAnchorElement>}
          {...omit(props, OWN_PROPS)}
          className={classes}
          {...data}
        >
          {content(false)}
        </Link>
      );
    }

    if (props.href !== undefined) {
      const { external = false, ...rest } = omit(props, OWN_PROPS);
      return (
        <a
          ref={ref as Ref<HTMLAnchorElement>}
          {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
          {...rest}
          className={classes}
          {...data}
        >
          {content(false)}
          {external && <span className={a11y.visuallyHidden}> (opens in new tab)</span>}
        </a>
      );
    }

    const {
      loading,
      disabled,
      type = 'button',
      onClick,
      ...rest
    } = omit(props as ButtonAsButtonProps, OWN_PROPS);
    const busy = loading === true;
    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      if (busy) {
        // Inert while loading (also stops form submission) without losing focus.
        event.preventDefault();
        return;
      }
      onClick?.(event);
    };
    return (
      <>
        <button
          ref={ref as Ref<HTMLButtonElement>}
          type={type}
          {...rest}
          className={classes}
          disabled={disabled}
          aria-disabled={(!disabled && busy) || undefined}
          aria-busy={busy || undefined}
          onClick={handleClick}
          {...data}
        >
          {content(busy)}
        </button>
        {loading !== undefined && (
          <span role="status" className={a11y.visuallyHidden}>
            {busy ? 'Loading' : ''}
          </span>
        )}
      </>
    );
  },
);
