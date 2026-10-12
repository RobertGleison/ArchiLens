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
import { TextLink } from './TextLink';
import styles from './DataTable.module.css';
import a11y from './visuallyHidden.module.css';

export interface DataTableColumn<Row> {
  /** Stable column key. Without `render`, the cell shows `row[key]`. */
  key: string;
  /** Header label. Write it in sentence case; it is drawn uppercase (screen readers get it as is). */
  header: ReactNode;
  /**
   * Content width in px, as in Figma (the 12px column gap is added). Columns without a width share
   * the remaining space; when every column has one, the last column takes up any extra space.
   */
  width?: number;
  /** Horizontal alignment of the header and cells. Defaults to `start`. */
  align?: 'start' | 'end';
  /** Cell content, e.g. an `IdentityCell`, `StatusPill`, `ProgressCell` or row action. */
  render?: (row: Row, rowIndex: number) => ReactNode;
}

export interface DataTableSelection<Row> {
  /** Selected row ids (controlled). */
  selectedIds: ReadonlySet<string>;
  onSelectedIdsChange: (selectedIds: Set<string>) => void;
  /** Rows that cannot be selected (e.g. already monitored) show an unchecked, disabled box. */
  isRowSelectable?: (row: Row) => boolean;
  /** Accessible name of a row's checkbox, e.g. `(repo) => \`Select ${repo.name}\``. */
  getRowLabel: (row: Row) => string;
  /** Accessible name of the bulk select-all checkbox. Defaults to "Select all available". */
  selectAllLabel?: string;
}

interface DataTableOwnProps<Row> {
  columns: readonly DataTableColumn<Row>[];
  rows: readonly Row[];
  getRowId: (row: Row) => string;
  /**
   * Row click (mouse convenience: adds the row hover). Clicks on links, buttons and inputs inside
   * the row are ignored. Rows still need a focusable link or button for keyboard users.
   */
  onRowClick?: (row: Row) => void;
  /** Row selection: a checkbox before the first column's content and a bulk bar above the table. */
  selection?: DataTableSelection<Row>;
  /** Shown instead of the rows when `rows` is empty (centred in the table area). */
  emptyState?: ReactNode;
  /** Replaces the rows with `loadingState` and marks the table busy. */
  loading?: boolean;
  loadingState?: ReactNode;
  /** When set, replaces the rows (e.g. a load error with a retry action). */
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

export type DataTableProps<Row> = DataTableOwnProps<Row> &
  DataTableLabelProps &
  Omit<
    ComponentPropsWithoutRef<'div'>,
    keyof DataTableOwnProps<Row> | 'aria-label' | 'aria-labelledby' | 'children'
  >;

const INTERACTIVE = 'a, button, input, select, textarea, label, [role="button"], [role="link"]';

function defaultCell<Row>(row: Row, key: string): ReactNode {
  const value = (row as Record<string, unknown>)[key];
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
    className,
    ...rest
  } = props;

  const lastIndex = columns.length - 1;
  const hasFlexColumn = columns.some((column) => column.width === undefined);
  const minWidth = columns.reduce((sum, column) => sum + (column.width ?? 0), 0);

  const isSelectable = (row: Row) => selection?.isRowSelectable?.(row) ?? true;
  const selectableIds = selection ? rows.filter(isSelectable).map(getRowId) : [];
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
    onRowClick?.(row);
  };

  const hasError = errorState != null && errorState !== false;
  const placeholder = loading
    ? loadingState
    : hasError
      ? errorState
      : rows.length === 0
        ? emptyState
        : null;
  const showPlaceholder = loading || hasError || rows.length === 0;

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
              aria-label={selection.selectAllLabel ?? 'Select all available'}
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
            <TextLink variant="inline" size="sm" onClick={clear} disabled={selectedCount === 0}>
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
          aria-busy={loading || undefined}
        >
          {caption != null && caption !== false && (
            <caption className={a11y.visuallyHidden}>{caption}</caption>
          )}
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
              <tr className={styles.row}>
                <td
                  colSpan={columns.length}
                  className={styles.placeholderCell}
                  style={{ '--placeholder-rows': placeholderRows } as CSSProperties}
                >
                  {placeholder}
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
                      const content = column.render
                        ? column.render(row, rowIndex)
                        : defaultCell(row, column.key);
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

      {footnote != null && footnote !== false && <CardFootnote>{footnote}</CardFootnote>}
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
