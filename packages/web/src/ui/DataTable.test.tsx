import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';
import { DataTable, type DataTableColumn } from './DataTable';
import { IdentityCell, ProgressCell } from './DataTableCells';

interface Repo {
  id: string;
  name: string;
  language: string;
  monitored?: boolean;
}

const REPOS: Repo[] = [
  { id: 'a', name: 'inventory-api', language: 'TypeScript' },
  { id: 'b', name: 'catalog-api', language: 'Python' },
  { id: 'c', name: 'checkout-api', language: 'TypeScript', monitored: true },
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

function SelectableTable({ onChange }: { onChange?: (ids: Set<string>) => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set(['a']));
  return (
    <DataTable
      caption="Repositories in meridian"
      columns={COLUMNS}
      rows={REPOS}
      getRowId={(repo) => repo.id}
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
      <DataTable
        caption="Repositories"
        columns={COLUMNS}
        rows={REPOS}
        getRowId={(repo) => repo.id}
        footnote="Estimates use source size."
        className="x"
      />,
    );
    const table = screen.getByRole('table', { name: 'Repositories' });
    const headers = within(table).getAllByRole('columnheader');
    expect(headers.map((th) => th.textContent)).toEqual(['Repository', 'Language']);
    expect(headers[0]).toHaveAttribute('scope', 'col');
    expect(within(table).getAllByRole('row')).toHaveLength(4);
    expect(within(table).getByRole('cell', { name: 'Python' })).toBeInTheDocument();
    expect(screen.getByText('Estimates use source size.')).toBeInTheDocument();
    expect(table.closest('.x')).not.toBeNull();
  });

  it('sets column widths from the Figma width plus the 12px gap; the last column flexes', () => {
    const { container } = render(
      <DataTable aria-label="t" columns={COLUMNS} rows={REPOS} getRowId={(r) => r.id} />,
    );
    const cols = container.querySelectorAll('col');
    expect(cols[0]!.style.width).toBe('calc(242px + var(--space-12))');
    expect(cols[1]!.style.width).toBe('');
  });

  it('selects rows with checkboxes and keeps the bulk count in sync', () => {
    const onChange = vi.fn();
    render(<SelectableTable onChange={onChange} />);
    const inventory = screen.getByRole('checkbox', { name: 'Select inventory-api' });
    const catalog = screen.getByRole('checkbox', { name: 'Select catalog-api' });
    const checkout = screen.getByRole('checkbox', { name: 'Select checkout-api' });
    const all = screen.getByRole('checkbox', { name: 'Select all available' });

    expect(inventory).toBeChecked();
    expect(checkout).toBeDisabled();
    expect(checkout).not.toBeChecked();
    expect(all).toHaveProperty('indeterminate', true);
    expect(screen.getByText('1 selected')).toBeInTheDocument();
    expect(inventory.closest('tr')).toHaveAttribute('data-selected');

    fireEvent.click(catalog);
    expect(onChange).toHaveBeenLastCalledWith(new Set(['a', 'b']));
    expect(screen.getByText('2 selected')).toBeInTheDocument();
    expect(all).toBeChecked();
    expect(all).toHaveProperty('indeterminate', false);
    expect(screen.getByRole('button', { name: 'Select all available' })).toBeDisabled();

    fireEvent.click(all);
    expect(screen.getByText('0 selected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled();

    fireEvent.click(all);
    expect(onChange).toHaveBeenLastCalledWith(new Set(['a', 'b']));

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onChange).toHaveBeenLastCalledWith(new Set());

    fireEvent.click(screen.getByRole('button', { name: 'Select all available' }));
    expect(onChange).toHaveBeenLastCalledWith(new Set(['a', 'b']));
  });

  it('calls onRowClick for the row but not for controls inside it', () => {
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
        getRowId={(repo) => repo.id}
        onRowClick={onRowClick}
      />,
    );
    fireEvent.click(screen.getByRole('cell', { name: 'Python' }));
    expect(onRowClick).toHaveBeenCalledWith(REPOS[1]);
    expect(screen.getByRole('cell', { name: 'Python' }).closest('tr')).toHaveAttribute(
      'data-clickable',
    );

    onRowClick.mockClear();
    fireEvent.click(screen.getAllByRole('button', { name: 'Retry' })[0]!);
    expect(onRetry).toHaveBeenCalled();
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('renders the empty, loading and error slots across all columns', () => {
    const props = {
      'aria-label': 'Queue',
      columns: COLUMNS,
      getRowId: (repo: Repo) => repo.id,
      emptyState: 'No scans queued',
      loadingState: 'Loading scans',
    };
    const { rerender } = render(<DataTable {...props} rows={[]} />);
    const cell = screen.getByRole('cell', { name: 'No scans queued' });
    expect(cell).toHaveAttribute('colspan', '2');

    rerender(<DataTable {...props} rows={REPOS} loading />);
    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('cell', { name: 'Loading scans' })).toBeInTheDocument();
    expect(screen.queryByText('inventory-api')).toBeNull();

    rerender(<DataTable {...props} rows={REPOS} errorState="Could not load scans" />);
    expect(screen.getByRole('cell', { name: 'Could not load scans' })).toBeInTheDocument();
    expect(screen.getByRole('table')).not.toHaveAttribute('aria-busy');
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

  it('ProgressCell is a labelled progress bar', () => {
    render(<ProgressCell label="Building architecture model · 68%" value={68} />);
    expect(
      screen.getByRole('progressbar', { name: 'Building architecture model · 68%' }),
    ).toHaveAttribute('aria-valuenow', '68');
  });
});
