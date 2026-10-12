import { forwardRef, type ComponentPropsWithoutRef, type ReactNode, type Ref } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cx } from './cx';
import { ICON_SIZE } from './icon';
import type { IconComponent } from './iconTypes';
import { omit } from './omit';
import styles from './TextLink.module.css';

export type TextLinkVariant = 'action' | 'inline' | 'mono';

const TRAILING = { arrow: '→', external: '↗' } as const;

interface TextLinkOwnProps {
  /**
   * `action` (600 12px): section header actions and table identity links. `inline` (400): links in
   * body copy. `mono` (IBM Plex Mono 11px): evidence and file references. Defaults to `action`.
   */
  variant?: TextLinkVariant;
  /** `inline` only: `md` is 12px, `sm` 11px. Defaults to `md`. */
  size?: 'md' | 'sm';
  /** Optional leading icon at 12px, e.g. `FileCode` on file references. */
  icon?: IconComponent;
  /** Trailing glyph shown after the label (decorative): `arrow` → or `external` ↗. */
  trailing?: keyof typeof TRAILING;
  children: ReactNode;
  className?: string;
}

/** In-app navigation (router `<Link>`). */
export type TextLinkAsLinkProps = TextLinkOwnProps & Omit<LinkProps, keyof TextLinkOwnProps>;
/** External link (`<a href>`). */
export type TextLinkAsAnchorProps = TextLinkOwnProps &
  Omit<ComponentPropsWithoutRef<'a'>, keyof TextLinkOwnProps> & { href: string; to?: never };
/** Inline action that does not navigate, e.g. "Refresh" or "Clear" (`<button>`). */
export type TextLinkAsButtonProps = TextLinkOwnProps &
  Omit<ComponentPropsWithoutRef<'button'>, keyof TextLinkOwnProps> & { to?: never; href?: never };

export type TextLinkProps = TextLinkAsLinkProps | TextLinkAsAnchorProps | TextLinkAsButtonProps;

const OWN_PROPS = ['variant', 'size', 'icon', 'trailing', 'children', 'className'] as const;

/** Accent text link or inline action. Renders a router link (`to`), `<a>` (`href`) or `<button>`. */
export const TextLink = forwardRef<HTMLAnchorElement | HTMLButtonElement, TextLinkProps>(
  function TextLink(props, ref) {
    const { variant = 'action', size = 'md', icon: Icon, trailing, children, className } = props;
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
        {trailing && (
          <>
            {' '}
            <span aria-hidden>{TRAILING[trailing]}</span>
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
      return (
        <a
          ref={ref as Ref<HTMLAnchorElement>}
          {...omit(props, OWN_PROPS)}
          className={classes}
          {...data}
        >
          {content}
        </a>
      );
    }
    const { type = 'button', ...rest } = omit(props, OWN_PROPS);
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
