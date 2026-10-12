import { forwardRef, useId, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cx } from './cx';
import { hasSlot } from './slot';
import styles from './Card.module.css';

export type HeadingLevel = 2 | 3 | 4 | 5 | 6;

export interface SectionHeadingProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
  title: ReactNode;
  /** Muted 11px line under the title, e.g. "3 projects · 8 repositories · main branches". */
  description?: ReactNode;
  /** Right-aligned action: a `TextLink` (e.g. "View all projects") or a small `Button`. */
  action?: ReactNode;
  /** Heading element level. Defaults to 2 (cards sit directly under the page's `<h1>`). */
  level?: HeadingLevel;
  /** Id for the heading element, e.g. to label the surrounding section. */
  headingId?: string;
}

/** Card / section header row: 16px title, optional subtitle and right-aligned action. */
export const SectionHeading = forwardRef<HTMLDivElement, SectionHeadingProps>(
  function SectionHeading(
    { title, description, action, level = 2, headingId, className, ...rest },
    ref,
  ) {
    const Heading = `h${level}` as const;
    return (
      <div ref={ref} {...rest} className={cx(styles.heading, className)}>
        <div className={styles.headingText}>
          <Heading id={headingId} className={styles.title}>
            {title}
          </Heading>
          {hasSlot(description) && <p className={styles.description}>{description}</p>}
        </div>
        {hasSlot(action) && <div className={styles.action}>{action}</div>}
      </div>
    );
  },
);

export interface CardProps extends Omit<ComponentPropsWithoutRef<'section'>, 'title'> {
  /**
   * Card title. When set, the card renders a `<section>` named by this heading; without it the
   * card is a plain `<div>` (pass `as` to override).
   */
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  /** Heading element level for `title`. Defaults to 2. */
  headingLevel?: HeadingLevel;
  /** Root element. Defaults to `section` with a title, `div` without. */
  as?: 'section' | 'div' | 'article';
  children?: ReactNode;
}

/**
 * Bordered section card (Figma 3:12730): white, 1px border, radius 8, padding 20, 16px column
 * gap, no shadow. Pass `title` / `description` / `action` to render its `SectionHeading`.
 */
export const Card = forwardRef<HTMLElement, CardProps>(function Card(
  { title, description, action, headingLevel = 2, as, className, children, ...rest },
  ref,
) {
  const headingId = useId();
  const hasTitle = hasSlot(title);
  const Root = as ?? (hasTitle ? 'section' : 'div');
  // Only sectioning roots are landmarks/named regions; a `div` gets no name from its heading.
  const labelled = hasTitle && Root !== 'div' && !rest['aria-label'];
  return (
    <Root
      // A single ref type across the root options; all are HTMLElements.
      ref={ref as never}
      aria-labelledby={labelled ? headingId : undefined}
      {...rest}
      className={cx(styles.card, className)}
    >
      {hasTitle && (
        <SectionHeading
          title={title}
          description={description}
          action={action}
          level={headingLevel}
          headingId={headingId}
        />
      )}
      {children}
    </Root>
  );
});

export interface SubsectionHeadingProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
  title: ReactNode;
  /** Optional right-side inline link, e.g. `<TextLink variant="inline" size="sm" arrow>`. */
  action?: ReactNode;
  /** Heading element level. Defaults to 3. */
  level?: HeadingLevel;
  /** Id for the heading element, e.g. so an `OptionCardGroup` can use it as `aria-labelledby`. */
  headingId?: string;
}

/** Sub-section label inside a card (600 12px ink), e.g. "Recently monitored". */
export const SubsectionHeading = forwardRef<HTMLDivElement, SubsectionHeadingProps>(
  function SubsectionHeading({ title, action, level = 3, headingId, className, ...rest }, ref) {
    const Heading = `h${level}` as const;
    return (
      <div ref={ref} {...rest} className={cx(styles.subheading, className)}>
        <Heading id={headingId} className={styles.subtitle}>
          {title}
        </Heading>
        {hasSlot(action) && <div className={styles.action}>{action}</div>}
      </div>
    );
  },
);

/** Footnote text in a card (10px muted). */
export const CardFootnote = forwardRef<HTMLParagraphElement, ComponentPropsWithoutRef<'p'>>(
  function CardFootnote({ className, ...rest }, ref) {
    return <p ref={ref} {...rest} className={cx(styles.footnote, className)} />;
  },
);
