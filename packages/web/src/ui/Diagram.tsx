import { forwardRef, useId, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cx } from './cx';
import { hasSlot } from './slot';
import { StatusPill, type StatusPillTone } from './StatusPill';
import styles from './Diagram.module.css';
import a11y from './visuallyHidden.module.css';

/** A relationship described in text (the drawn edges are decorative). */
export interface DiagramRelationship {
  /** Stable list key; defaults to the description text. `layoutDiagram` sets the edge id. */
  id?: string;
  from: string;
  to: string;
  /** e.g. "HTTPS". */
  protocol?: string;
  change?: 'added' | 'removed';
}

/** "API gateway to checkout-api, HTTPS, added". */
export function describeRelationship({ from, to, protocol, change }: DiagramRelationship): string {
  return [`${from} to ${to}`, protocol, change].filter(Boolean).join(', ');
}

export interface DiagramCanvasProps extends Omit<ComponentPropsWithoutRef<'figure'>, 'children'> {
  /** Stage size in px (e.g. `diagramGrid().width` / `.height`). Nodes and edges use its pixels. */
  width: number;
  height: number;
  /**
   * Boundary label, top-left; shown uppercase in IBM Plex Mono 10px, e.g. "Checkout service /
   * production". It is drawn over the top band of the stage, not above it: keep the first row of
   * nodes below it with the grid's `origin.y` (the default 54 matches Figma). Also names the
   * figure.
   */
  boundary?: ReactNode;
  /** Hosting line under the stage (IBM Plex Mono 10px muted), e.g. "DEPLOYMENT · AWS ECS Fargate". */
  hosting?: ReactNode;
  /** Legend line (Inter 10px teal), e.g. "Teal: added relationship or component · Grey: unchanged". */
  note?: ReactNode;
  /**
   * Relationships as text for assistive technology (a visually hidden list), since the SVG edges
   * are `aria-hidden`. Omit only when the screen lists relationships visibly elsewhere.
   */
  relationships?: readonly DiagramRelationship[];
  /** Label of the hidden relationship list. Default "Relationships". */
  relationshipsLabel?: string;
  /**
   * Accessible name of the stage's scroll container (it is focusable so keyboard users can scroll
   * a diagram wider than the canvas). Default "Diagram".
   */
  scrollLabel?: string;
  /** Stage contents: `Edge`s first, then positioned `EntityNode`s (in reading order). */
  children: ReactNode;
}

/**
 * Architecture map canvas (Figma 3:13320): subtle grey fill, radius 6, no border, clipped. The
 * stage is a fixed-size, relatively positioned box; screens place nodes and edges in it with the
 * helpers in `./diagramLayout`. A `<figure>` captioned by the boundary label.
 */
export const DiagramCanvas = forwardRef<HTMLElement, DiagramCanvasProps>(function DiagramCanvas(
  {
    width,
    height,
    boundary,
    hosting,
    note,
    relationships,
    relationshipsLabel = 'Relationships',
    scrollLabel = 'Diagram',
    className,
    children,
    ...rest
  },
  ref,
) {
  const captionId = useId();
  const hasCaption = hasSlot(boundary);
  const hasFooter = hasSlot(hosting) || hasSlot(note);
  return (
    <figure
      ref={ref}
      // Explicit, as not every accessibility API names a figure from its figcaption.
      aria-labelledby={hasCaption && !rest['aria-label'] ? captionId : undefined}
      {...rest}
      className={cx(styles.canvas, className)}
    >
      {hasCaption && (
        <figcaption id={captionId} className={styles.boundary}>
          {boundary}
        </figcaption>
      )}
      {/* Scrolls when the stage is wider than the canvas; the canvas keeps the rounded clip. */}
      <div className={styles.scroller} tabIndex={0} role="group" aria-label={scrollLabel}>
        <div className={styles.stage} style={{ width, height }}>
          {children}
        </div>
      </div>
      {hasFooter && (
        <div className={styles.footer}>
          {hasSlot(hosting) && <p className={styles.hosting}>{hosting}</p>}
          {hasSlot(note) && <p className={styles.note}>{note}</p>}
        </div>
      )}
      {relationships && relationships.length > 0 && (
        <ul className={a11y.visuallyHidden} aria-label={relationshipsLabel}>
          {relationships.map((r) => {
            const text = describeRelationship(r);
            return <li key={r.id ?? text}>{text}</li>;
          })}
        </ul>
      )}
    </figure>
  );
});

export interface DiagramLegendItem {
  /** Stable list key; defaults to `label` when it is a string. */
  id?: string;
  label: ReactNode;
  /** Default `neutral`. Counts that matter (evidence links, additions) use `accent`. */
  tone?: StatusPillTone;
}

export interface DiagramLegendProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  /** Summary chips, e.g. "6 entities", "7 relationships", "23 evidence links". */
  items: readonly DiagramLegendItem[];
  /** Optional right-aligned action, e.g. a small secondary "Expand diagram" button. */
  action?: ReactNode;
  /** Label of the chip list. Default "Diagram summary". */
  listLabel?: string;
}

/** Row of summary chips under a diagram (Figma 3:13986): `StatusPill`s 10px apart. */
export const DiagramLegend = forwardRef<HTMLDivElement, DiagramLegendProps>(function DiagramLegend(
  { items, action, listLabel = 'Diagram summary', className, ...rest },
  ref,
) {
  return (
    <div ref={ref} {...rest} className={cx(styles.legend, className)}>
      <ul className={styles.items} aria-label={listLabel}>
        {items.map((item, i) => (
          <li
            key={item.id ?? (typeof item.label === 'string' ? item.label : i)}
            className={styles.item}
          >
            <StatusPill tone={item.tone}>{item.label}</StatusPill>
          </li>
        ))}
      </ul>
      {hasSlot(action) && <div className={styles.action}>{action}</div>}
    </div>
  );
});
