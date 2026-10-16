import { forwardRef, type ComponentPropsWithoutRef, type ReactNode, type Ref } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cx } from './cx';
import { ICON_SIZE } from './icon';
import type { IconComponent } from './iconTypes';
import { omit } from './omit';
import styles from './TextLink.module.css';
import a11y from './visuallyHidden.module.css';

export type TextLinkVariant = 'action' | 'inline' | 'mono' | 'quiet';

/**
 * `action` (600 12px, the default): section header actions and table identity links.
 * `inline` (400): links in body copy, `size` `md` 12px (default) or `sm` 11px.
 * `mono` (IBM Plex Mono 11px): evidence and file references.
 * `quiet` (400 12px ink): row actions in tables, e.g. "View job →", "Cancel" (3:12871).
 */
type TextLinkVariantProps =
  | { variant?: 'action' | 'mono' | 'quiet'; size?: never }
  | { variant: 'inline'; size?: 'md' | 'sm' };

type TextLinkOwnProps = TextLinkVariantProps & {
  /** Optional leading icon at 12px, e.g. `FileCode` on file references. */
  icon?: IconComponent;
  /** Trailing → after the label (decorative). */
  arrow?: boolean;
  children: ReactNode;
  className?: string;
};

type OwnKeys = 'variant' | 'size' | 'icon' | 'arrow' | 'children' | 'className';

/** In-app navigation (router `<Link>`). */
export type TextLinkAsLinkProps = TextLinkOwnProps &
  Omit<LinkProps, OwnKeys> & { href?: never; external?: never; disabled?: never };
/** Plain link (`<a href>`). */
export type TextLinkAsAnchorProps = TextLinkOwnProps &
  Omit<ComponentPropsWithoutRef<'a'>, OwnKeys> & {
    href: string;
    /** Opens in a new tab (`target="_blank"`, `rel="noopener noreferrer"`), adds ↗ and tells AT. */
    external?: boolean;
    to?: never;
    disabled?: never;
  };
/** Inline action that does not navigate, e.g. "Refresh" or "Clear" (`<button>`). */
export type TextLinkAsButtonProps = TextLinkOwnProps &
  Omit<ComponentPropsWithoutRef<'button'>, OwnKeys> & {
    to?: never;
    href?: never;
    external?: never;
  };

export type TextLinkProps = TextLinkAsLinkProps | TextLinkAsAnchorProps | TextLinkAsButtonProps;

const OWN_PROPS = ['variant', 'size', 'icon', 'arrow', 'children', 'className'] as const;

/** Accent text link or inline action. Renders a router link (`to`), `<a>` (`href`) or `<button>`. */
export const TextLink = forwardRef<HTMLAnchorElement | HTMLButtonElement, TextLinkProps>(
  function TextLink(props, ref) {
    const { variant = 'action', size = 'md', icon: Icon, arrow, children, className } = props;
    const external = props.href !== undefined && props.external === true;
    const classes = cx(
      styles.link,
      styles[variant],
      variant === 'inline' && size === 'sm' && styles.sm,
      className,
    );
    const data = { 'data-variant': variant };
    const content = (
      <>
        {Icon && <Icon size={ICON_SIZE.pill} aria-hidden className={styles.icon} />}
        {children}
        {arrow && <span aria-hidden> →</span>}
        {external && (
          <>
            <span aria-hidden> ↗</span>
            <span className={a11y.visuallyHidden}> (opens in new tab)</span>
          </>
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
          {content}
        </Link>
      );
    }
    if (props.href !== undefined) {
      const rest = omit(props as TextLinkAsAnchorProps, [...OWN_PROPS, 'external'] as const);
      return (
        <a
          ref={ref as Ref<HTMLAnchorElement>}
          {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
          {...rest}
          className={classes}
          {...data}
        >
          {content}
        </a>
      );
    }
    const { type = 'button', ...rest } = omit(props as TextLinkAsButtonProps, OWN_PROPS);
    return (
      <button
        ref={ref as Ref<HTMLButtonElement>}
        type={type}
        {...rest}
        className={classes}
        {...data}
      >
        {content}
      </button>
    );
  },
);
