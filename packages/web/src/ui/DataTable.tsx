import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ForwardedRef,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { CardFootnote } from './Card';
import { Checkbox } from './Checkbox';
import { cx } from './cx';
import { LiveRegionContext } from './liveRegion';
import { SkeletonTableRows } from './Skeleton';
import { hasSlot } from './slot';
import { TextLink } from './TextLink';
import styles from './DataTable.module.css';
import a11y from './visuallyHidden.module.css';

interface DataTableColumnBase {
  /** Header label. Write it in sentence case; it is drawn uppercase (screen readers get it as is). */
  header: ReactNode;
  /**
   * Content width in px, as in Figma (the 12px column gap is added). Columns without a width share
   * the remaining space; when every column has one, the last column takes up any extra space.
   */
  width?: number;
  /**
   * Flexible columns only (no `width`): the smallest content width in px used for the table's
   * minimum width (it scrolls sideways below that). Defaults to 120.
   */
  minWidth?: number;
  /** Horizontal alignment of the header and cells. Defaults to `start`. */
  align?: 'start' | 'end';
}

/**
 * A table column. Without `render` the cell shows `row[key]` (a string or number), so `key` must be
 * a key of `Row`; with `render`, `key` is any stable string.
 */
export type DataTableColumn<Row> =
  | (DataTableColumnBase & { key: Extract<keyof Row, string>; render?: undefined })
  | (DataTableColumnBase & {
      key: string;
      /** Cell content, e.g. an `IdentityCell`, `StatusPill`, `ProgressCell` or row action. */
      render: (row: Row, rowIndex: number) => ReactNode;
    });

/** Content width a flexible column counts for in the table's minimum width. */
const DEFAULT_FLEX_MIN_WIDTH = 120;

/**
 * Controlled row selection. `selectedIds` may hold ids of rows not currently shown (e.g. filtered
 * out): the bulk count ("N selected") and Clear cover all of them, while the select-all checkbox
 * and "Select all available" only look at, add or remove the shown, selectable rows (deselecting
 * via select-all keeps the off-screen ids). Nothing is selectable while a placeholder (loading,
 * error, empty) replaces the rows.
 */
export interface DataTableSelection<Row> {
  /** Selected row ids (controlled). */
  selectedIds: ReadonlySet<string>;
  onSelectedIdsChange: (selectedIds: Set<string>) => void;
  /** Rows that cannot be selected (e.g. already monitored) show an unchecked, disabled box. */
  isRowSelectable?: (row: Row) => boolean;
  /** Accessible name of a row's checkbox, e.g. `(repo) => \`Select ${repo.name}\``. */
  getRowLabel: (row: Row) => string;
  /** Accessible name of the bulk select-all checkbox. Defaults to "Select all rows". */
  selectAllLabel?: string;
}

interface DataTableOwnProps<Row> {
  columns: readonly DataTableColumn<Row>[];
  rows: readonly Row[];
  getRowId: (row: Row) => string;
  /**
   * Row click (mouse convenience: adds the row hover). Clicks on interactive elements inside the
   * row (links, buttons, inputs, focusable widgets) and clicks that end a text selection are
   * ignored. Rows still need a focusable link or button for keyboard users.
   */
  onRowClick?: (row: Row) => void;
  /** Row selection: a checkbox before the first column's content and a bulk bar above the table. */
  selection?: DataTableSelection<Row>;
  /**
   * Shown instead of the rows when `rows` is empty (centred in the table area), e.g. an
   * `EmptyState` (full: give it `placeholderRows={4}` if it has an action) or a compact one.
   */
  emptyState?: ReactNode;
  /**
   * Replaces the rows with `loadingState` and marks the table busy. Without `loadingState` it
   * shows `SkeletonTableRows` (one per `placeholderRows`) lined up with the columns.
   */
  loading?: boolean;
  loadingState?: ReactNode;
  /** When set, replaces the rows: an `ErrorState` wired to a retry callback. */
  errorState?: ReactNode;
  /**
   * Height of the empty / loading / error area in rows (60px each), so switching between states
   * and data does not make the layout jump. Defaults to 3.
   */
  placeholderRows?: number;
  /** 10px muted note under the table, e.g. "Estimates use source size…". */
  footnote?: ReactNode;
  className?: string;
}

type DataTableLabelProps =
  | {
      /** Table caption (visually hidden: the surrounding card title is the visible label). */
      caption: ReactNode;
      'aria-label'?: never;
      'aria-labelledby'?: never;
    }
  | { caption?: never; 'aria-label': string; 'aria-labelledby'?: never }
  | { caption?: never; 'aria-label'?: never; 'aria-labelledby': string };

/**
 * Props routing: `className`, `ref` and other div props go on the root wrapper (bulk bar, table,
 * footnote); `caption` / `aria-label` / `aria-labelledby` / `aria-describedby` go on the `<table>`.
 */
export type DataTableProps<Row> = DataTableOwnProps<Row> &
  DataTableLabelProps &
  Omit<
    ComponentPropsWithoutRef<'div'>,
    keyof DataTableOwnProps<Row> | 'aria-label' | 'aria-labelledby' | 'children'
  >;

const INTERACTIVE = [
  'a',
  'button',
  'input',
  'select',
  'textarea',
  'label',
  'summary',
  '[role="button"]',
  '[role="link"]',
  '[role="checkbox"]',
  '[role="menuitem"]',
  '[role="switch"]',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function cellContent<Row>(column: DataTableColumn<Row>, row: Row, rowIndex: number): ReactNode {
  if (column.render !== undefined) return column.render(row, rowIndex);
  const value: unknown = row[column.key];
  return typeof value === 'string' || typeof value === 'number' ? value : null;
}

/** Column width including its 12px leading gap (and the 12px row padding after the last one). */
function columnWidth(width: number, isLast: boolean): string {
  return `calc(${width}px + var(--space-12)${isLast ? ' + var(--space-12)' : ''})`;
}

function DataTableInner<Row>(props: DataTableProps<Row>, ref: ForwardedRef<HTMLDivElement>) {
  const {
    columns,
    rows,
    getRowId,
    onRowClick,
    selection,
    emptyState,
    loading = false,
    loadingState,
    errorState,
    placeholderRows = 3,
    footnote,
    caption,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    className,
    ...rest
  } = props;

  const lastIndex = columns.length - 1;
  const hasFlexColumn = columns.some((column) => column.width === undefined);
  const minWidth = columns.reduce(
    (sum, column) => sum + (column.width ?? column.minWidth ?? DEFAULT_FLEX_MIN_WIDTH),
    0,
  );

  const hasError = hasSlot(errorState);
  const showPlaceholder = loading || hasError || rows.length === 0;
  const skeleton = loading && loadingState === undefined;
  const placeholder = skeleton ? (
    <SkeletonTableRows
      rows={placeholderRows}
      columns={columns}
      selectable={selection !== undefined}
    />
  ) : loading ? (
    loadingState
  ) : hasError ? (
    errorState
  ) : (
    emptyState
  );

  const isSelectable = (row: Row) => selection?.isRowSelectable?.(row) ?? true;
  const selectableIds =
    selection && !showPlaceholder ? rows.filter(isSelectable).map(getRowId) : [];
  const selectedCount = selection?.selectedIds.size ?? 0;
  const selectedAvailable = selection
    ? selectableIds.filter((id) => selection.selectedIds.has(id)).length
    : 0;
  const allSelected = selectableIds.length > 0 && selectedAvailable === selectableIds.length;

  const setRowSelected = (id: string, selected: boolean) => {
    if (!selection) return;
    const next = new Set(selection.selectedIds);
    if (selected) next.add(id);
    else next.delete(id);
    selection.onSelectedIdsChange(next);
  };
  const selectAll = () => {
    if (!selection) return;
    selection.onSelectedIdsChange(new Set([...selection.selectedIds, ...selectableIds]));
  };
  const clear = () => selection?.onSelectedIdsChange(new Set());
  const toggleAll = () => {
    if (!selection) return;
    if (!allSelected) return selectAll();
    const next = new Set(selection.selectedIds);
    for (const id of selectableIds) next.delete(id);
    selection.onSelectedIdsChange(next);
  };

  const handleRowClick = (row: Row) => (event: MouseEvent<HTMLTableRowElement>) => {
    const target = event.target as Element;
    const interactive = target.closest(INTERACTIVE);
    if (interactive && event.currentTarget.contains(interactive)) return;
    // A drag that selects text in the row is not a click on the row.
    if (window.getSelection()?.toString()) return;
    onRowClick?.(row);
  };

  return (
    <div ref={ref} {...rest} className={cx(styles.root, className)}>
      {selection && (
        <div className={styles.bulkBar}>
          <div className={styles.bulkSelect}>
            <Checkbox
              checked={allSelected}
              indeterminate={selectedAvailable > 0 && !allSelected}
              disabled={selectableIds.length === 0}
              onChange={toggleAll}
              aria-label={selection.selectAllLabel ?? 'Select all rows'}
            />
            <span className={styles.bulkCount} aria-live="polite">
              {selectedCount} selected
            </span>
          </div>
          <div className={styles.bulkActions}>
            <TextLink
              variant="inline"
              size="sm"
              onClick={selectAll}
              disabled={selectableIds.length === 0 || allSelected}
            >
              Select all available
            </TextLink>
            <span aria-hidden> · </span>
            <TextLink
              variant="inline"
              size="sm"
              onClick={clear}
              disabled={loading || selectedCount === 0}
            >
              Clear
            </TextLink>
          </div>
        </div>
      )}

      <div className={styles.scroller}>
        <table
          className={styles.table}
          style={{ minWidth: `calc(${minWidth}px + ${columns.length + 1} * var(--space-12))` }}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          aria-busy={loading || undefined}
        >
          {hasSlot(caption) && <caption className={a11y.visuallyHidden}>{caption}</caption>}
          <colgroup>
            {columns.map((column, index) => {
              const flexes = column.width === undefined || (!hasFlexColumn && index === lastIndex);
              return (
                <col
                  key={column.key}
                  style={
                    flexes
                      ? undefined
                      : { width: columnWidth(column.width ?? 0, index === lastIndex) }
                  }
                />
              );
            })}
          </colgroup>
          <thead>
            <tr className={styles.headerRow}>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cx(styles.headerCell, column.align === 'end' && styles.end)}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {showPlaceholder ? (
              <tr className={cx(styles.row, skeleton && styles.flushRow)}>
                <td
                  colSpan={columns.length}
                  className={cx(styles.placeholderCell, skeleton && styles.flushCell)}
                  style={{ '--placeholder-rows': placeholderRows } as CSSProperties}
                >
                  {/* State components inside announce through this region, not their own. */}
                  <div role="status">
                    <LiveRegionContext.Provider value>{placeholder}</LiveRegionContext.Provider>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => {
                const id = getRowId(row);
                const selected = selection?.selectedIds.has(id) ?? false;
                return (
                  <tr
                    key={id}
                    className={styles.row}
                    data-selected={selected || undefined}
                    data-clickable={onRowClick ? true : undefined}
                    onClick={onRowClick ? handleRowClick(row) : undefined}
                  >
                    {columns.map((column, columnIndex) => {
                      const content = cellContent(column, row, rowIndex);
                      return (
                        <td
                          key={column.key}
                          className={cx(styles.cell, column.align === 'end' && styles.end)}
                        >
                          {selection && columnIndex === 0 ? (
                            <div className={styles.selectionCell}>
                              <Checkbox
                                checked={selected}
                                disabled={!isSelectable(row)}
                                onChange={(event) => setRowSelected(id, event.target.checked)}
                                aria-label={selection.getRowLabel(row)}
                              />
                              <div className={styles.selectionContent}>{content}</div>
                            </div>
                          ) : (
                            content
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {hasSlot(footnote) && <CardFootnote>{footnote}</CardFootnote>}
    </div>
  );
}

/**
 * Data table (Figma 3:12838 scan queue, 3:12736 landscape, 3:13052 repositories with selection,
 * 3:13484 modules & evidence). A semantic `<table>`: 36px header with uppercase 10px labels on a
 * subtle fill, 60px-min records with 12px padding and gap and a bottom border on every row. It
 * sits inside a `Card` (no border of its own) at full width; set `width` per column as in Figma.
 *
 * Cells: plain text by default (12px ink); compose `IdentityCell`, `StatusPill` (with
 * `scanStatusToPill`), `ProgressCell`, `TextLink variant="mono"` (evidence), a small `Button`
 * (e.g. Retry) or `TextLink variant="quiet"` (e.g. "View job →") in `render`.
 */
export const DataTable = forwardRef(DataTableInner) as <Row>(
  props: DataTableProps<Row> & { ref?: Ref<HTMLDivElement> },
) => ReactElement;
