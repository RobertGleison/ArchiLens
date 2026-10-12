import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { NavLink, type NavLinkProps } from 'react-router-dom';
import { cx } from './cx';
import styles from './Tabs.module.css';

/*
 * Section tabs, Figma 3:12999 (Discover), 3:13304 (Repository detail), 3:14490 (Configuration).
 *
 * Two flavours with the same look:
 * - `Tabs` / `TabList` / `Tab` / `TabPanel`: WAI-ARIA tabs that switch panels on the same page
 *   (Discover sources, Configuration sections). Roving tabindex, Left/Right/Home/End with automatic
 *   activation (panels are local and cheap to show). Controlled (`value` + `onValueChange`, e.g.
 *   bound to a `?tab=` query param) or uncontrolled (`defaultValue`).
 * - `TabNav` / `TabNavLink`: route navigation styled as tabs (e.g. Repository detail sections if
 *   each one is its own URL). A `<nav>` of router links with `aria-current="page"`, not ARIA tabs:
 *   tab semantics promise in-page panels, and links keep open-in-new-tab and history working.
 */

interface TabsContextValue {
  baseId: string;
  value: string | null;
  select: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs(component: string): TabsContextValue {
  const context = useContext(TabsContext);
  if (!context) throw new Error(`${component} must be rendered inside <Tabs>`);
  return context;
}

/** DOM-safe id fragment for a tab value. */
const idPart = (value: string) => value.replace(/[^\w-]/g, '_');

export interface TabsProps extends Omit<ComponentPropsWithoutRef<'div'>, 'defaultValue'> {
  /** Selected tab (controlled). */
  value?: string;
  /** Initially selected tab (uncontrolled). */
  defaultValue?: string;
  /** Called when the user selects a tab. */
  onValueChange?: (value: string) => void;
  children: ReactNode;
}

/** Holds the selected tab; wraps one `TabList` and its `TabPanel`s. */
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  { value, defaultValue, onValueChange, children, ...rest },
  ref,
) {
  const baseId = useId();
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? null);
  const selected = value ?? uncontrolled;
  const select = useCallback(
    (next: string) => {
      if (value === undefined) setUncontrolled(next);
      if (next !== selected) onValueChange?.(next);
    },
    [value, selected, onValueChange],
  );
  return (
    <div ref={ref} {...rest}>
      <TabsContext.Provider value={{ baseId, value: selected, select }}>
        {children}
      </TabsContext.Provider>
    </div>
  );
});

/** The group must be named: by `aria-label` or by pointing `aria-labelledby` at a heading. */
type ListNameProps =
  | { 'aria-label': string; 'aria-labelledby'?: never }
  | { 'aria-label'?: never; 'aria-labelledby': string };

export type TabListProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'role' | 'aria-label' | 'aria-labelledby'
> &
  ListNameProps;

const TAB_SELECTOR = '[role="tab"]:not(:disabled)';

/** The tab row (`role="tablist"`): gap 28, 1px bottom border across the full width. */
export const TabList = forwardRef<HTMLDivElement, TabListProps>(function TabList(
  { className, onKeyDown, ...rest },
  ref,
) {
  // Subscribes to the selection, so the effect below re-runs when it changes.
  useTabs('TabList');
  const listRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => listRef.current as HTMLDivElement);

  // Keep exactly one tab in the Tab order: the selected one, else the first enabled tab (when
  // nothing, or a missing or disabled value, is selected).
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const tabs = [...list.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    const current = tabs.find(
      (tab) => tab.getAttribute('aria-selected') === 'true' && !tab.disabled,
    );
    const focusable = current ?? tabs.find((tab) => !tab.disabled);
    for (const tab of tabs) tab.tabIndex = tab === focusable ? 0 : -1;
  });

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    const list = listRef.current;
    if (event.defaultPrevented || !list) return;
    const tabs = [...list.querySelectorAll<HTMLButtonElement>(TAB_SELECTOR)];
    const index = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (index === -1 || tabs.length === 0) return;
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
        next = (index + 1) % tabs.length;
        break;
      case 'ArrowLeft':
        next = (index - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = tabs.length - 1;
        break;
      default:
        return;
    }
    const target = tabs[next];
    if (!target) return;
    event.preventDefault();
    target.focus();
    target.click(); // automatic activation
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-orientation="horizontal"
      {...rest}
      onKeyDown={handleKeyDown}
      className={cx(styles.list, className)}
    />
  );
});

export interface TabProps extends Omit<ComponentPropsWithoutRef<'button'>, 'value' | 'type'> {
  /** Identifies the tab and its `TabPanel`. */
  value: string;
  /** Label; counts go inline, e.g. "Reports (24)". */
  children: ReactNode;
}

/** One tab: padding 10/13, 2px bottom border; selected = accent 600 label and border. */
export const Tab = forwardRef<HTMLButtonElement, TabProps>(function Tab(
  { value, className, onClick, ...rest },
  ref,
) {
  const tabs = useTabs('Tab');
  const selected = tabs.value === value;
  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      id={`${tabs.baseId}-tab-${idPart(value)}`}
      aria-selected={selected}
      aria-controls={`${tabs.baseId}-panel-${idPart(value)}`}
      tabIndex={selected ? 0 : -1}
      {...rest}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) tabs.select(value);
      }}
      className={cx(styles.tab, className)}
    />
  );
});

export interface TabPanelProps extends ComponentPropsWithoutRef<'div'> {
  /** The `Tab` value this panel belongs to. */
  value: string;
}

/**
 * Content for one tab (`role="tabpanel"`, labelled by its tab). Hidden panels stay in the DOM
 * (so `aria-controls` resolves) but render no children. Focusable (tabindex 0) so keyboard users
 * can reach panels without interactive content.
 */
export const TabPanel = forwardRef<HTMLDivElement, TabPanelProps>(function TabPanel(
  { value, children, ...rest },
  ref,
) {
  const tabs = useTabs('TabPanel');
  const selected = tabs.value === value;
  return (
    <div
      ref={ref}
      role="tabpanel"
      id={`${tabs.baseId}-panel-${idPart(value)}`}
      aria-labelledby={`${tabs.baseId}-tab-${idPart(value)}`}
      tabIndex={0}
      hidden={!selected}
      {...rest}
    >
      {selected ? children : null}
    </div>
  );
});

/** Name the navigation landmark: by `aria-label` or by `aria-labelledby`. */
export type TabNavProps = Omit<ComponentPropsWithoutRef<'nav'>, 'aria-label' | 'aria-labelledby'> &
  ListNameProps;

/** Route tabs: a `<nav>` landmark laid out like `TabList`. Children are `TabNavLink`s. */
export const TabNav = forwardRef<HTMLElement, TabNavProps>(function TabNav(
  { className, ...rest },
  ref,
) {
  return <nav ref={ref} {...rest} className={cx(styles.list, className)} />;
});

export interface TabNavLinkProps extends Omit<NavLinkProps, 'className' | 'style' | 'children'> {
  children: ReactNode;
  className?: string;
}

/**
 * A route tab (router `NavLink`): active when its route matches, marked `aria-current="page"`.
 * Pass `end` when the link's path is a prefix of sibling tabs' paths (e.g. an index tab).
 */
export const TabNavLink = forwardRef<HTMLAnchorElement, TabNavLinkProps>(function TabNavLink(
  { className, ...rest },
  ref,
) {
  return <NavLink ref={ref} {...rest} className={cx(styles.tab, className)} />;
});
