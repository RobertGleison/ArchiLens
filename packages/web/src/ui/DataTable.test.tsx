import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';
import { DataTable, type DataTableColumn, type DataTableProps } from './DataTable';
import { IdentityCell, ProgressCell } from './DataTableCells';
import styles from './DataTable.module.css';
import { ErrorState } from './ErrorState';

interface Repo {
  id: string;
  name: string;
  language: string;
  commits: number;
  monitored?: boolean;
}

const REPOS: Repo[] = [
  { id: 'a', name: 'inventory-api', language: 'TypeScript', commits: 1248 },
  { id: 'b', name: 'catalog-api', language: 'Python', commits: 864 },
  { id: 'c', name: 'checkout-api', language: 'TypeScript', commits: 2146, monitored: true },
];

const COLUMNS: DataTableColumn<Repo>[] = [
  {
    key: 'name',
    header: 'Repository',
    width: 242,
    render: (repo) => <IdentityCell primary={repo.name} secondary="Private" />,
  },
  { key: 'language', header: 'Language', width: 124 },
];

const getRowId = (repo: Repo) => repo.id;

function SelectableTable({
  rows = REPOS,
  initial = ['a'],
  onChange,
  onRowClick,
  loading,
}: {
  rows?: Repo[];
  initial?: string[];
  onChange?: (ids: Set<string>) => void;
  onRowClick?: (repo: Repo) => void;
  loading?: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initial));
  return (
    <DataTable
      caption="Repositories in meridian"
      columns={COLUMNS}
      rows={rows}
      getRowId={getRowId}
      onRowClick={onRowClick}
      loading={loading}
      loadingState="Loading repositories"
      selection={{
        selectedIds: selected,
        onSelectedIdsChange: (ids) => {
          setSelected(ids);
          onChange?.(ids);
        },
        isRowSelectable: (repo) => !repo.monitored,
        getRowLabel: (repo) => `Select ${repo.name}`,
      }}
    />
  );
}

describe('DataTable', () => {
  it('renders a semantic table with column headers, a caption and default text cells', () => {
    render(
      <>
        <p id="note">Counts are informational.</p>
        <DataTable
          caption="Repositories"
          aria-describedby="note"
          columns={[...COLUMNS, { key: 'commits', header: 'Commits', width: 72 }]}
          rows={REPOS}
          getRowId={getRowId}
          footnote="Estimates use source size."
          className="x"
        />
      </>,
    );
    const table = screen.getByRole('table', { name: 'Repositories' });
    expect(table).toHaveAccessibleDescription('Counts are informational.');
    const headers = within(table).getAllByRole('columnheader');
    expect(headers.map((th) => th.textContent)).toEqual(['Repository', 'Language', 'Commits']);
    expect(headers[0]).toHaveAttribute('scope', 'col');
    expect(within(table).getAllByRole('row')).toHaveLength(4);
    expect(within(table).getByRole('cell', { name: 'Python' })).toBeInTheDocument();
    expect(within(table).getByRole('cell', { name: '864' })).toBeInTheDocument();
    expect(screen.getByText('Estimates use source size.')).toBeInTheDocument();
    expect(table.closest('.x')).not.toBeNull();
  });

  it('sets column widths from the Figma width plus the 12px gap; the last column flexes', () => {
    const { container } = render(
      <DataTable aria-label="t" columns={COLUMNS} rows={REPOS} getRowId={getRowId} />,
    );
    const cols = container.querySelectorAll('col');
    expect(cols[0]!.style.width).toBe('calc(242px + var(--space-12))');
    expect(cols[1]!.style.width).toBe('');
    expect(screen.getByRole('table').style.minWidth).toBe('calc(366px + 3 * var(--space-12))');
  });

  it('counts flexible columns at minWidth (default 120) in the minimum table width', () => {
    const { rerender } = render(
      <DataTable
        aria-label="t"
        columns={[COLUMNS[0]!, { key: 'language', header: 'Language' }]}
        rows={REPOS}
        getRowId={getRowId}
      />,
    );
    expect(screen.getByRole('table').style.minWidth).toBe('calc(362px + 3 * var(--space-12))');
    rerender(
      <DataTable
        aria-label="t"
        columns={[COLUMNS[0]!, { key: 'language', header: 'Language', minWidth: 200 }]}
        rows={REPOS}
        getRowId={getRowId}
      />,
    );
    expect(screen.getByRole('table').style.minWidth).toBe('calc(442px + 3 * var(--space-12))');
  });

  it('types columns and labels strictly', () => {
    const typed: DataTableColumn<Repo>[] = [
      // @ts-expect-error without `render`, `key` must be a key of the row
      { key: 'action', header: 'Action' },
      { key: 'action', header: 'Action', render: () => null },
    ];
    const base = { columns: COLUMNS, rows: REPOS, getRowId };
    // @ts-expect-error a caption, aria-label or aria-labelledby is required
    const unlabelled: DataTableProps<Repo> = base;
    // @ts-expect-error only one of caption / aria-label / aria-labelledby
    const twice: DataTableProps<Repo> = { ...base, caption: 'a', 'aria-label': 'b' };
    expect([typed, unlabelled, twice]).toHaveLength(3);
  });

  it('selects rows with checkboxes and keeps the bulk count in sync', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SelectableTable onChange={onChange} />);
    const inventory = screen.getByRole('checkbox', { name: 'Select inventory-api' });
    const catalog = screen.getByRole('checkbox', { name: 'Select catalog-api' });
    const checkout = screen.getByRole('checkbox', { name: 'Select checkout-api' });
    const all = screen.getByRole('checkbox', { name: 'Select all rows' });

    expect(inventory).toBeChecked();
    expect(checkout).toBeDisabled();
    expect(checkout).not.toBeChecked();
    expect(all).toHaveProperty('indeterminate', true);
    expect(screen.getByText('1 selected')).toBeInTheDocument();
    expect(inventory.closest('tr')).toHaveAttribute('data-selected');

    await user.click(catalog);
    expect(onChange).toHaveBeenLastCalledWith(new Set(['a', 'b']));
    expect(screen.getByText('2 selected')).toBeInTheDocument();
    expect(all).toBeChecked();
    expect(all).toHaveProperty('indeterminate', false);
    expect(screen.getByRole('button', { name: 'Select all available' })).toBeDisabled();

    await user.click(all);
    expect(screen.getByText('0 selected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled();

    // Keyboard: Space on the focused select-all checkbox.
    all.focus();
    await user.keyboard(' ');
    expect(onChange).toHaveBeenLastCalledWith(new Set(['a', 'b']));

    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onChange).toHaveBeenLastCalledWith(new Set());

    await user.click(screen.getByRole('button', { name: 'Select all available' }));
    expect(onChange).toHaveBeenLastCalledWith(new Set(['a', 'b']));
  });

  it('keeps off-screen selected ids when deselecting via select-all', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SelectableTable initial={['a', 'b', 'hidden']} onChange={onChange} />);
    expect(screen.getByText('3 selected')).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: 'Select all rows' }));
    expect(onChange).toHaveBeenLastCalledWith(new Set(['hidden']));
    expect(screen.getByText('1 selected')).toBeInTheDocument();
  });

  it('has nothing selectable and disables the bulk controls while loading', () => {
    render(<SelectableTable loading />);
    expect(screen.getByRole('checkbox', { name: 'Select all rows' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'Select all rows' })).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Select all available' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled();
    expect(screen.getByText('1 selected')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Select inventory-api' })).toBeNull();
  });

  it('calls onRowClick for the row but not for controls inside it', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    const onRetry = vi.fn();
    render(
      <DataTable
        aria-label="Scan queue"
        columns={[
          ...COLUMNS,
          {
            key: 'action',
            header: 'Action',
            render: () => <Button onClick={onRetry}>Retry</Button>,
          },
        ]}
        rows={REPOS}
        getRowId={getRowId}
        onRowClick={onRowClick}
      />,
    );
    await user.click(screen.getByRole('cell', { name: 'Python' }));
    expect(onRowClick).toHaveBeenCalledWith(REPOS[1]);
    expect(screen.getByRole('cell', { name: 'Python' }).closest('tr')).toHaveAttribute(
      'data-clickable',
    );

    onRowClick.mockClear();
    await user.click(screen.getAllByRole('button', { name: 'Retry' })[0]!);
    expect(onRetry).toHaveBeenCalled();
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('does not fire onRowClick when a row checkbox is clicked', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    const onChange = vi.fn();
    render(<SelectableTable onRowClick={onRowClick} onChange={onChange} />);
    await user.click(screen.getByRole('checkbox', { name: 'Select catalog-api' }));
    expect(onChange).toHaveBeenCalled();
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('renders the empty, loading and error slots across all columns as a status', () => {
    const props = {
      'aria-label': 'Queue',
      columns: COLUMNS,
      getRowId,
      emptyState: 'No scans queued',
      loadingState: 'Loading scans',
    };
    const { rerender } = render(<DataTable {...props} rows={[]} />);
    const cell = screen.getByRole('cell', { name: 'No scans queued' });
    expect(cell).toHaveAttribute('colspan', '2');
    expect(screen.getByRole('status')).toHaveTextContent('No scans queued');

    rerender(<DataTable {...props} rows={REPOS} loading />);
    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Loading scans');
    expect(screen.queryByText('inventory-api')).toBeNull();

    rerender(<DataTable {...props} rows={REPOS} errorState="Could not load scans" />);
    expect(screen.getByRole('status')).toHaveTextContent('Could not load scans');
    expect(screen.getByRole('table')).not.toHaveAttribute('aria-busy');
  });

  it('shows skeleton rows lined up with the columns while loading without a loadingState', () => {
    render(
      <DataTable
        aria-label="Queue"
        columns={COLUMNS}
        rows={REPOS}
        getRowId={getRowId}
        loading
        placeholderRows={4}
      />,
    );
    // One status (the table's state area) reading the skeleton's label.
    const statuses = screen.getAllByRole('status');
    expect(statuses).toHaveLength(1);
    expect(statuses[0]).toHaveTextContent(/^Loading$/);
    expect(statuses[0]?.querySelectorAll('[aria-hidden="true"]')).toHaveLength(4 * COLUMNS.length);
  });

  it('lets an ErrorState in the error slot announce through the state area', async () => {
    const onRetry = vi.fn();
    render(
      <DataTable
        aria-label="Queue"
        columns={COLUMNS}
        rows={[]}
        getRowId={getRowId}
        errorState={<ErrorState message="Could not load scans" onRetry={onRetry} />}
      />,
    );
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('Could not load scans');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe('table cells', () => {
  it('IdentityCell renders the name as a link when given `to`', () => {
    render(
      <MemoryRouter>
        <IdentityCell primary="Commerce platform" secondary="4 repositories" to="/projects/1" />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Commerce platform' })).toHaveAttribute(
      'href',
      '/projects/1',
    );
    expect(screen.getByText('4 repositories')).toBeInTheDocument();
  });

  it('ProgressCell keeps label and bar within the 220px wrapper', () => {
    render(<ProgressCell label="Building architecture model · 68%" value={68} />);
    const bar = screen.getByRole('progressbar', { name: 'Building architecture model · 68%' });
    expect(bar).toHaveAttribute('aria-valuenow', '68');
    expect(bar.parentElement).toHaveClass(styles.progress!);
    expect(bar).not.toHaveClass(styles.progress!);
  });

  it('ProgressCell without a label sizes the bar itself', () => {
    render(<ProgressCell aria-label="Progress" value={10} />);
    expect(screen.getByRole('progressbar', { name: 'Progress' })).toHaveClass(styles.progress!);
  });
});
