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
    expect(screen.getByText('Repositories panel').closest('[role="tabpanel"]')).not.toBeVisible();
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1); // hidden panels are not exposed
  });

  it('keeps hidden panels mounted, so their state survives a switch', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="a">
        <TabList aria-label="Panels">
          <Tab value="a">A</Tab>
          <Tab value="b">B</Tab>
        </TabList>
        <TabPanel value="a">
          <input aria-label="Draft" />
        </TabPanel>
        <TabPanel value="b" keepMounted={false}>
          <input aria-label="Other" />
        </TabPanel>
      </Tabs>,
    );
    await user.type(screen.getByRole('textbox', { name: 'Draft' }), 'kept');
    expect(screen.queryByRole('textbox', { name: 'Other' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'B' }));
    expect(screen.getByRole('textbox', { name: 'Other' })).toBeVisible();
    await user.click(screen.getByRole('tab', { name: 'A' }));
    expect(screen.getByRole('textbox', { name: 'Draft' })).toHaveValue('kept');
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

  it('selects the first enabled tab when uncontrolled without defaultValue', () => {
    const onValueChange = vi.fn();
    render(
      <Tabs onValueChange={onValueChange}>
        <TabList aria-label="Default">
          <Tab value="a" disabled>
            A
          </Tab>
          <Tab value="b">B</Tab>
        </TabList>
        <TabPanel value="b">B panel</TabPanel>
      </Tabs>,
    );
    expect(screen.getByRole('tab', { name: 'B' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('B panel');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('keeps a tab stop on the first enabled tab when the selected tab is disabled', () => {
    render(
      <Tabs value="a">
        <TabList aria-label="Fallback">
          <Tab value="a" disabled>
            A
          </Tab>
          <Tab value="b">B</Tab>
          <Tab value="c">C</Tab>
        </TabList>
      </Tabs>,
    );
    expect(screen.getByRole('tab', { name: 'A' })).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('tab', { name: 'B' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: 'C' })).toHaveAttribute('tabindex', '-1');
  });

  it('gives values with special characters distinct, valid ids', () => {
    render(
      <Tabs defaultValue="a b">
        <TabList aria-label="Special">
          <Tab value="a b">Space</Tab>
          <Tab value="a_b">Underscore</Tab>
          <Tab value="a/b">Slash</Tab>
        </TabList>
        <TabPanel value="a b">Space panel</TabPanel>
        <TabPanel value="a_b">Underscore panel</TabPanel>
        <TabPanel value="a/b">Slash panel</TabPanel>
      </Tabs>,
    );
    const ids = screen.getAllByRole('tab').map((tab) => tab.id);
    expect(new Set(ids).size).toBe(3);
    for (const id of ids) expect(id).toMatch(/^[\w:-]+$/);
    expect(screen.getByRole('tabpanel', { name: 'Space' })).toHaveTextContent('Space panel');
  });

  it('stays put when a controlled parent refuses the change', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Tabs value="a" onValueChange={onValueChange}>
        <TabList aria-label="Locked">
          <Tab value="a">A</Tab>
          <Tab value="b">B</Tab>
        </TabList>
        <TabPanel value="a">A panel</TabPanel>
        <TabPanel value="b">B panel</TabPanel>
      </Tabs>,
    );
    await user.click(screen.getByRole('tab', { name: 'B' }));
    expect(onValueChange).toHaveBeenCalledWith('b');
    expect(screen.getByRole('tab', { name: 'A' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('A panel');
  });

  it('names tabs by their label only (the width-reserving copy is hidden)', () => {
    render(
      <Tabs>
        <TabList aria-label="Names">
          <Tab value="a">Reports (24)</Tab>
        </TabList>
      </Tabs>,
    );
    expect(screen.getByRole('tab', { name: 'Reports (24)' })).toBeInTheDocument();
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
