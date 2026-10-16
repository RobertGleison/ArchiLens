import { forwardRef, type ComponentPropsWithoutRef, type ReactNode, type Ref } from 'react';
import { cx } from './cx';
import { ICON_SIZE } from './icon';
import type { IconComponent } from './iconTypes';
import { omit } from './omit';
import { hasSlot } from './slot';
import styles from './EmptyState.module.css';

export interface FullEmptyStateProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
  variant?: 'full';
  /**
   * 28px muted icon for the context: `FolderGit2` (no repositories), `Network` (no projects),
   * `FileText` (no reports), `History` (no history), `CircleAlert` (page-level error / not found).
   */
  icon: IconComponent;
  /** 600 13px ink line, e.g. "No repositories monitored yet". */
  title: ReactNode;
  /** One muted 12px sentence. */
  description?: ReactNode;
  /** Optional `Button`(s), e.g. primary "Add repositories" with `FolderPlus`. */
  action?: ReactNode;
  /**
   * Renders the title as a heading of this level. Default: a paragraph (in a card or table the
   * card title is the heading). Page-level states pass 1, as they replace the page.
   */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Extra content between the description and the action (e.g. an error detail). */
  children?: ReactNode;
  /**
   * Props for the wrapper around the title and description, e.g. `role="alert"` so only the
   * message (not the actions) is announced.
   */
  messageProps?: ComponentPropsWithoutRef<'div'>;
  /** Ref and `tabIndex` for the title, e.g. to move focus to it (`tabIndex={-1}`). */
  titleProps?: { ref?: Ref<HTMLElement>; tabIndex?: number };
}

export interface CompactEmptyStateProps extends ComponentPropsWithoutRef<'p'> {
  /** A single 12px muted line for small cards, e.g. "No architectural changes this week". */
  variant: 'compact';
  children: ReactNode;
}

export type EmptyStateProps = FullEmptyStateProps | CompactEmptyStateProps;

/**
 * "No data yet" (LIN-87; not drawn in Figma, derived from the muted caption text and the card
 * type scale). `full`: a centred column (padding 32, gap 8) of a 28px muted icon, a 600 13px title,
 * a 12px muted description and an optional action, for a card, table area or page. `compact`: one
 * 12px muted line. Not a live region: loading / error changes are what get announced.
 */
export const EmptyState = forwardRef<HTMLDivElement | HTMLParagraphElement, EmptyStateProps>(
  function EmptyState(props, ref) {
    if (props.variant === 'compact') {
      return (
        <p
          ref={ref as Ref<HTMLParagraphElement>}
          {...omit(props, ['variant'])}
          className={cx(styles.compact, props.className)}
        />
      );
    }
    const {
      icon: Icon,
      title,
      description,
      action,
      headingLevel,
      className,
      children,
      messageProps,
      titleProps,
    } = props;
    const rest = omit(props, [
      'variant',
      'icon',
      'title',
      'description',
      'action',
      'headingLevel',
      'className',
      'children',
      'messageProps',
      'titleProps',
    ]);
    const Title = headingLevel ? (`h${headingLevel}` as const) : 'p';
    return (
      <div ref={ref as Ref<HTMLDivElement>} {...rest} className={cx(styles.full, className)}>
        <Icon size={ICON_SIZE.empty} aria-hidden className={styles.icon} />
        <div {...messageProps} className={cx(styles.message, messageProps?.className)}>
          <Title
            ref={titleProps?.ref as Ref<HTMLHeadingElement>}
            tabIndex={titleProps?.tabIndex}
            className={styles.title}
          >
            {title}
          </Title>
          {hasSlot(description) && <p className={styles.description}>{description}</p>}
        </div>
        {children}
        {hasSlot(action) && <div className={styles.action}>{action}</div>}
      </div>
    );
  },
);
