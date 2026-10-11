import { render, screen, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ROUTER_FUTURE } from '../routerFuture';
import { PageHeading } from './PageHeading';

function renderHeading(ui: ReactElement) {
  return render(<MemoryRouter future={ROUTER_FUTURE}>{ui}</MemoryRouter>);
}

describe('PageHeading', () => {
  it('renders title, description, breadcrumb, actions and meta', () => {
    renderHeading(
      <PageHeading
        title="checkout-api"
        description="Repository architecture."
        breadcrumb={[
          { label: 'Workspace', to: '/' },
          { label: 'Repositories', to: '/repositories' },
          { label: 'checkout-api', to: '/ignored-for-current' },
        ]}
        actions={<button type="button">Rescan</button>}
        meta={<span>main · TypeScript</span>}
      />,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'checkout-api' })).toBeInTheDocument();
    expect(screen.getByText('Repository architecture.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rescan' })).toBeInTheDocument();
    expect(screen.getByText('main · TypeScript')).toBeInTheDocument();

    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' });
    const items = within(breadcrumb).getAllByRole('listitem');
    expect(items.map((li) => li.textContent)).toEqual([
      'Workspace',
      'Repositories',
      'checkout-api',
    ]);
    expect(within(breadcrumb).getByRole('link', { name: 'Repositories' })).toHaveAttribute(
      'href',
      '/repositories',
    );
    // The current page is not a link.
    expect(within(breadcrumb).queryByRole('link', { name: 'checkout-api' })).toBeNull();
    expect(within(breadcrumb).getByText('checkout-api')).toHaveAttribute('aria-current', 'page');
  });

  it('omits optional parts', () => {
    renderHeading(<PageHeading title="Reports" />);

    expect(screen.getByRole('heading', { level: 1, name: 'Reports' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });
});
