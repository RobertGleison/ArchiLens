import {
  createContext,
  forwardRef,
  useContext,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { cx } from './cx';
import { LiveRegionContext, useLiveRole } from './liveRegion';
import { hasSlot } from './slot';
import styles from './Skeleton.module.css';
import a11y from './visuallyHidden.module.css';

/*
 * Loading skeletons (LIN-87, derived): `--color-skeleton` blocks, radius 4, a pulse that stops
 * under `prefers-reduced-motion`. Each skeleton copies the layout of the component it stands in
 * for, so content swaps in without a jump.
 *
 * Announcing: a skeleton is a polite `role="status"` region whose only readable text is its
 * visually hidden `label` (default "Loading"); the blocks are hidden from assistive tech. Inside
 * another live region (`LiveRegionContext`, e.g. DataTable's state area) it drops the role and
 * keeps the label; nested in another skeleton (e.g. `SkeletonText` in a `SkeletonCard`) it drops
 * both.
 */

const DEFAULT_LABEL = 'Loading';

type Width = number | string;
const cssWidth = (width: Width | undefined) => (typeof width === 'number' ? `${width}px` : width);

interface SkeletonRootProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  /** Visually hidden text read by assistive tech. Defaults to "Loading". */
  label?: ReactNode;
}

/** True inside a skeleton, so nested skeletons add no second role or label. */
const InSkeletonContext = createContext(false);

/** Root of a skeleton: live role (unless nested) and the hidden label; the blocks have no text. */
const SkeletonRoot = forwardRef<HTMLDivElement, SkeletonRootProps & { children: ReactNode }>(
  function SkeletonRoot({ label = DEFAULT_LABEL, className, children, ...rest }, ref) {
    const nested = useContext(InSkeletonContext);
    const role = useLiveRole('status');
    return (
      <div ref={ref} role={nested ? undefined : role} {...rest} className={className}>
        {!nested && hasSlot(label) && <span className={a11y.visuallyHidden}>{label}</span>}
        <InSkeletonContext.Provider value>
          <LiveRegionContext.Provider value>{children}</LiveRegionContext.Provider>
        </InSkeletonContext.Provider>
      </div>
    );
  },
);

/** Text sizes a skeleton line stands in for (bar height = the type token's font size). */
export type SkeletonTextSize = 'sm' | 'md' | 'lg';

function Lines({
  size,
  lines,
  width,
  lastLineWidth,
}: {
  size: SkeletonTextSize;
  lines: number;
  width?: Width;
  lastLineWidth?: Width;
}) {
  return (
    <>
      {Array.from({ length: Math.max(1, lines) }, (_, i) => {
        const last = i === lines - 1 && lines > 1;
        const w = last ? (lastLineWidth ?? '60%') : width;
        return (
          <span key={i} aria-hidden className={cx(styles.line, styles[size])}>
            <span className={styles.block} style={w !== undefined ? { width: cssWidth(w) } : {}} />
          </span>
        );
      })}
    </>
  );
}

export interface SkeletonTextProps extends SkeletonRootProps {
  /**
   * `sm` 12px body text, `md` 16px titles, `lg` 30px display figures. The bar is as tall as the
   * font size and sits in a line box of the real line height. Defaults to `sm`.
   */
  size?: SkeletonTextSize;
  /** Number of lines. Defaults to 1. */
  lines?: number;
  /** Bar width (px number or CSS length). Defaults to the full width. */
  width?: Width;
  /** Width of the last line when there are several. Defaults to 60%. */
  lastLineWidth?: Width;
}

/** Placeholder for one or more lines of text. */
export const SkeletonText = forwardRef<HTMLDivElement, SkeletonTextProps>(function SkeletonText(
  { size = 'sm', lines = 1, width, lastLineWidth, className, ...rest },
  ref,
) {
  return (
    <SkeletonRoot ref={ref} {...rest} className={cx(styles.text, className)}>
      <Lines size={size} lines={lines} width={width} lastLineWidth={lastLineWidth} />
    </SkeletonRoot>
  );
});

export interface SkeletonStatTileProps extends SkeletonRootProps {
  /** Include the helper line under the value. Defaults to true. */
  helper?: boolean;
}

/** Placeholder for an outlined `StatTile`: label, 30px value and helper lines in the tile frame. */
export const SkeletonStatTile = forwardRef<HTMLDivElement, SkeletonStatTileProps>(
  function SkeletonStatTile({ helper = true, className, ...rest }, ref) {
    return (
      <SkeletonRoot ref={ref} {...rest} className={cx(styles.statTile, className)}>
        <Lines size="sm" lines={1} width="55%" />
        <Lines size="lg" lines={1} width="35%" />
        {helper && <Lines size="sm" lines={1} width="70%" />}
      </SkeletonRoot>
    );
  },
);

export interface SkeletonCardProps extends SkeletonRootProps {
  /** Show the title + description heading. Defaults to true. */
  heading?: boolean;
  /** Lines of body text. Defaults to 3. Ignored when `children` is set. */
  lines?: number;
  /** Custom skeleton body (e.g. `SkeletonText` blocks laid out like the real card). */
  children?: ReactNode;
}

/** Placeholder for a `Card`: the card frame, an optional heading and body lines. */
export const SkeletonCard = forwardRef<HTMLDivElement, SkeletonCardProps>(function SkeletonCard(
  { heading = true, lines = 3, className, children, ...rest },
  ref,
) {
  return (
    <SkeletonRoot ref={ref} {...rest} className={cx(styles.card, className)}>
      {heading && (
        <div className={styles.cardHeading}>
          <Lines size="md" lines={1} width="40%" />
          <Lines size="sm" lines={1} width="60%" />
        </div>
      )}
      {hasSlot(children) ? children : <Lines size="sm" lines={lines} />}
    </SkeletonRoot>
  );
});

/** Widths the bars cycle through, so rows read as text rather than a solid grid. */
const CELL_WIDTHS = ['70%', '50%', '60%', '40%'];

export interface SkeletonTableRowsProps extends SkeletonRootProps {
  /** Number of 60px rows. Defaults to 3. */
  rows?: number;
  /**
   * Column count, or each column's content width in px as in `DataTableColumn.width` (`undefined`
   * for a flexible column) so the bars line up with the real header. Defaults to 4.
   */
  columns?: number | readonly (number | undefined)[];
}

/**
 * Placeholder rows for a table body: `rows` × 60px with the table's 12px padding / gap and bottom
 * borders. `DataTable` renders it under its real header while `loading` (no `loadingState`).
 */
export const SkeletonTableRows = forwardRef<HTMLDivElement, SkeletonTableRowsProps>(
  function SkeletonTableRows({ rows = 3, columns = 4, className, ...rest }, ref) {
    const widths =
      typeof columns === 'number' ? Array<undefined>(columns).fill(undefined) : columns;
    const allFixed = widths.every((w) => w !== undefined);
    const template = widths
      .map((w, i) =>
        w === undefined || (allFixed && i === widths.length - 1) ? 'minmax(0, 1fr)' : `${w}px`,
      )
      .join(' ');
    return (
      <SkeletonRoot
        ref={ref}
        {...rest}
        className={className}
        style={{ ...rest.style, '--skeleton-columns': template } as CSSProperties}
      >
        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className={styles.tableRow}>
            {widths.map((_, col) => (
              <Lines key={col} size="sm" lines={1} width={CELL_WIDTHS[(row + col) % 4]} />
            ))}
          </div>
        ))}
      </SkeletonRoot>
    );
  },
);
