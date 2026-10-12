import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { ROUTER_FUTURE } from '../routerFuture';
import { describe, expect, it, vi } from 'vitest';
import { Tab, TabList, TabNav, TabNavLink, TabPanel, Tabs } from './Tabs';

function Discover({ onValueChange }: { onValueChange?: (v: string) => void }) {
  return (
    <Tabs defaultValue="orgs" onValueChange={onValueChange}>
      <TabList aria-label="Sources">
        <Tab value="repos">Your repositories (4)</Tab>
        <Tab value="orgs">Organizations (2)</Tab>
        <Tab value="url" disabled>
          GitHub URL / owner-repo
        </Tab>
        <Tab value="public">Public search</Tab>
      </TabList>
      <TabPanel value="repos">Repositories panel</TabPanel>
      <TabPanel value="orgs">Organizations panel</TabPanel>
      <TabPanel value="url">URL panel</TabPanel>
      <TabPanel value="public">Public panel</TabPanel>
    </Tabs>
  );
}

describe('Tabs', () => {
  it('wires tabs to panels and shows only the selected panel', () => {
    render(<Discover />);
    expect(screen.getByRole('tablist', { name: 'Sources' })).toBeInTheDocument();
    const orgs = screen.getByRole('tab', { name: 'Organizations (2)' });
    expect(orgs).toHaveAttribute('aria-selected', 'true');
    const panel = screen.getByRole('tabpanel', { name: 'Organizations (2)' });
    expect(panel).toHaveTextContent('Organizations panel');
    expect(orgs).toHaveAttribute('aria-controls', panel.id);
    expect(screen.queryByText('Repositories panel')).not.toBeInTheDocument();
  });

  it('has one tab stop: the selected tab', async () => {
    const user = userEvent.setup();
    render(<Discover />);
    await user.tab();
    expect(screen.getByRole('tab', { name: 'Organizations (2)' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('tabpanel')).toHaveFocus();
  });

  it('moves and activates with arrows, Home and End, skipping disabled tabs', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Discover onValueChange={onValueChange} />);
    await user.tab();
    await user.keyboard('{ArrowRight}');
    const publicTab = screen.getByRole('tab', { name: 'Public search' });
    expect(publicTab).toHaveFocus();
    expect(publicTab).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Your repositories (4)' })).toHaveFocus();
    await user.keyboard('{End}');
    expect(publicTab).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Repositories panel');
    await user.keyboard('{ArrowLeft}');
    expect(publicTab).toHaveFocus();
    expect(onValueChange.mock.calls.map(([v]) => v)).toEqual([
      'public',
      'repos',
      'public',
      'repos',
      'public',
    ]);
  });

  it('works controlled', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [tab, setTab] = useState('a');
      return (
        <Tabs value={tab} onValueChange={setTab}>
          <TabList aria-label="Config">
            <Tab value="a">Schedule &amp; analysis</Tab>
            <Tab value="b">Delivery</Tab>
          </TabList>
          <TabPanel value="a">A</TabPanel>
          <TabPanel value="b">B</TabPanel>
          <output>{tab}</output>
        </Tabs>
      );
    }
    render(<Controlled />);
    await user.click(screen.getByRole('tab', { name: 'Delivery' }));
    expect(screen.getByRole('status')).toHaveTextContent('b');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('B');
  });

  it('keeps a tab stop when nothing is selected', () => {
    render(
      <Tabs>
        <TabList aria-label="Empty">
          <Tab value="a">A</Tab>
          <Tab value="b">B</Tab>
        </TabList>
      </Tabs>,
    );
    expect(screen.getByRole('tab', { name: 'A' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: 'B' })).toHaveAttribute('tabindex', '-1');
  });
});

describe('TabNav', () => {
  it('renders route tabs as a nav with aria-current on the active link', () => {
    render(
      <MemoryRouter initialEntries={['/repos/1/reports']} future={ROUTER_FUTURE}>
        <TabNav aria-label="Repository sections">
          <TabNavLink to="/repos/1" end>
            Architecture snapshot
          </TabNavLink>
          <TabNavLink to="/repos/1/reports">Reports (24)</TabNavLink>
        </TabNav>
      </MemoryRouter>,
    );
    expect(screen.getByRole('navigation', { name: 'Repository sections' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Reports (24)' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Architecture snapshot' })).not.toHaveAttribute(
      'aria-current',
    );
  });
});
