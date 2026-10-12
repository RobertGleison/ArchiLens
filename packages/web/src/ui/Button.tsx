import { forwardRef, type ComponentPropsWithoutRef, type ReactNode, type Ref } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cx } from './cx';
import { ICON_SIZE } from './icon';
import { omit } from './omit';
import type { IconComponent } from './iconTypes';
import { Spinner } from './Spinner';
import styles from './Button.module.css';

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

/** A `<button>`. `loading` shows a spinner, sets `aria-busy` and disables the button. */
export type ButtonAsButtonProps = ButtonOwnProps &
  Omit<ComponentPropsWithoutRef<'button'>, keyof ButtonOwnProps> & {
    loading?: boolean;
    to?: never;
    href?: never;
  };

/** An in-app navigation rendered as a router `<Link>`. */
export type ButtonAsLinkProps = ButtonOwnProps &
  Omit<LinkProps, keyof ButtonOwnProps> & { loading?: never; disabled?: never; href?: never };

/** An external link rendered as a plain `<a>` (e.g. "Open in GitHub"). */
export type ButtonAsAnchorProps = ButtonOwnProps &
  Omit<ComponentPropsWithoutRef<'a'>, keyof ButtonOwnProps> & {
    href: string;
    loading?: never;
    disabled?: never;
    to?: never;
  };

export type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps | ButtonAsAnchorProps;

const OWN_PROPS = ['variant', 'size', 'icon', 'children', 'className'] as const;

/**
 * Action button (Figma 3:12705, 3:12922): `primary` or `secondary`, `md` or `sm`, with an optional
 * leading icon. Pass `to` to navigate in-app (router link) or `href` for an external link.
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
      return (
        <a
          ref={ref as Ref<HTMLAnchorElement>}
          {...omit(props, OWN_PROPS)}
          className={classes}
          {...data}
        >
          {content(false)}
        </a>
      );
    }

    const { loading = false, disabled, type = 'button', ...rest } = omit(props, OWN_PROPS);
    return (
      <button
        ref={ref as Ref<HTMLButtonElement>}
        type={type}
        {...rest}
        className={classes}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...data}
      >
        {content(loading)}
      </button>
    );
  },
);
