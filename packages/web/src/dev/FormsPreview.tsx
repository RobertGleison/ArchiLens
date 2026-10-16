import { Code, DollarSign, KeyRound, Link as LinkIcon, Search } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { Divider } from '../ui/Divider';
import { Field, FieldRow } from '../ui/Field';
import { Select, Textarea, TextInput } from '../ui/FormControls';
import { SegmentedControl } from '../ui/SegmentedControl';
import { PreferenceRow, Switch } from '../ui/Switch';
import { Tab, TabList, TabNav, TabNavLink, TabPanel, Tabs } from '../ui/Tabs';
import styles from './ComponentPreview.module.css';

function Caption({ children }: { children: ReactNode }) {
  return <p className={styles.caption}>{children}</p>;
}

/** Section tabs: Discover (ARIA tabs) and Repository detail (route tabs). */
export function TabsPreview() {
  const [source, setSource] = useState('orgs');
  return (
    <>
      <Caption>Discover (3:12999): ARIA tabs, arrow keys / Home / End select</Caption>
      <Tabs value={source} onValueChange={setSource} className={styles.discoverColumn}>
        <TabList aria-label="Repository sources">
          <Tab value="repos">Your repositories (4)</Tab>
          <Tab value="orgs">Organizations (2)</Tab>
          <Tab value="url">GitHub URL / owner-repo</Tab>
          <Tab value="public">Public search</Tab>
        </TabList>
        <TabPanel value="repos" className={styles.tabPanel}>
          Your repositories panel
        </TabPanel>
        <TabPanel value="orgs" className={styles.tabPanel}>
          Organizations panel
        </TabPanel>
        <TabPanel value="url" className={styles.tabPanel}>
          GitHub URL panel
        </TabPanel>
        <TabPanel value="public" className={styles.tabPanel}>
          Public search panel
        </TabPanel>
      </Tabs>
      <Caption>
        Repository detail (3:13304) as route tabs: nav + aria-current (links leave this page)
      </Caption>
      <TabNav aria-label="Repository sections" className={styles.fullColumn}>
        <TabNavLink to="/__components" end>
          Architecture snapshot
        </TabNavLink>
        <TabNavLink to="/reports">Reports (24)</TabNavLink>
        <TabNavLink to="/history">Scan activity</TabNavLink>
        <TabNavLink to="/configuration">Repository settings</TabNavLink>
      </TabNav>
    </>
  );
}

const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'annual', label: 'Annual' },
  { value: 'cron', label: 'Custom cron' },
];

/** Form controls rebuilt from Figma frames, plus derived states. */
export function FormsPreview() {
  const [query, setQuery] = useState('');
  const [visibility, setVisibility] = useState('all');
  const [frequency, setFrequency] = useState('daily');
  const [skip, setSkip] = useState(true);
  const [poll, setPoll] = useState(true);
  const [push, setPush] = useState(true);
  const [release, setRelease] = useState(false);

  return (
    <>
      <Caption>Discover filter row (3:13035), 750px wide, gap 12</Caption>
      <FieldRow className={styles.discoverInner}>
        <Field label="Filter repositories">
          <TextInput
            icon={Search}
            placeholder="Search by name or description…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </Field>
        <Field label="Visibility" className={styles.w160}>
          <Select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
            <option value="all">All repositories</option>
            <option value="private">Private</option>
            <option value="public">Public</option>
          </Select>
        </Field>
      </FieldRow>

      <Caption>Direct discovery (3:13159): field + button, aligned to the bottom</Caption>
      <FieldRow align="end" className={styles.discoverInner}>
        <Field label="GitHub URL, owner/repo or public search">
          <TextInput
            icon={LinkIcon}
            defaultValue="https://github.com/open-telemetry/opentelemetry-collector"
          />
        </Field>
        <Button icon={Search}>Look up</Button>
      </FieldRow>

      <Caption>History filters (3:14206), 1160px wide, gap 16</Caption>
      <FieldRow spacing="form" className={styles.fullColumn}>
        <Field label="Search reports and changes">
          <TextInput icon={Search} defaultValue="Commerce platform" />
        </Field>
        <Field label="Scope" className={styles.w290}>
          <Select defaultValue="all">
            <option value="all">Commerce platform · all repositories</option>
          </Select>
        </Field>
        <Field label="Date range" className={styles.w234}>
          <Select defaultValue="range">
            <option value="range">Sep 1 – Oct 11, 2026</option>
          </Select>
        </Field>
        <Field label="Scan type" className={styles.w155}>
          <Select defaultValue="all">
            <option value="all">All modes</option>
          </Select>
        </Field>
      </FieldRow>

      <Caption>Configuration schedule (3:14505, 3:14518), 706px wide</Caption>
      <div className={`${styles.stack} ${styles.configInner}`}>
        <SegmentedControl
          name="frequency"
          aria-label="Scan frequency"
          options={FREQUENCIES}
          value={frequency}
          onValueChange={setFrequency}
        />
        <FieldRow spacing="form">
          <Field label="Run at" className={styles.w136}>
            <Select defaultValue="08:00">
              <option>08:00</option>
              <option>12:00</option>
            </Select>
          </Field>
          <Field label="Timezone">
            <Select defaultValue="london">
              <option value="london">Europe/London (UTC+1)</option>
            </Select>
          </Field>
          <Field label="Custom cron expression" className={styles.w200}>
            <TextInput icon={Code} defaultValue="0 8 * * *" disabled={frequency !== 'cron'} />
          </Field>
        </FieldRow>
        <PreferenceRow
          title="Skip unchanged runs"
          description="No new commits → no model call, no analysis spend."
          checked={skip}
          onCheckedChange={setSkip}
        />
        <Divider />
        <div className={styles.inlineRow}>
          <span className={styles.inlineLabel}>Also run on</span>
          <Checkbox
            label="Push to monitored branches"
            checked={push}
            onChange={(e) => setPush(e.target.checked)}
          />
          <Checkbox
            label="GitHub release"
            checked={release}
            onChange={(e) => setRelease(e.target.checked)}
          />
        </div>
      </div>

      <Caption>Discover preference (3:13168)</Caption>
      <div className={styles.discoverInner}>
        <PreferenceRow
          title="Poll public repositories for new changes"
          description="Use the project schedule to check repositories without a webhook."
          checked={poll}
          onCheckedChange={setPoll}
        />
      </div>

      <Caption>Report feedback textarea (3:14132), 306px wide</Caption>
      <div className={styles.asideInner}>
        <Textarea
          aria-label="Missing context"
          placeholder="What architectural context is missing?"
        />
      </div>

      <Caption>Derived states (not drawn in Figma)</Caption>
      <FieldRow spacing="form" className={styles.fullColumn}>
        <Field label="Placeholder" description="Help text: 11px muted.">
          <TextInput placeholder="Search by name or description…" />
        </Field>
        <Field label="Monthly spend cap" error="Enter an amount above $0.">
          <TextInput icon={DollarSign} defaultValue="$0.00" />
        </Field>
        <Field label="Credential" disabled>
          <TextInput icon={KeyRound} defaultValue="Workspace key · •••• 9b2f" />
        </Field>
        <Field label="Disabled select" disabled>
          <Select defaultValue="x">
            <option value="x">Pause scans & notify admins</option>
          </Select>
        </Field>
      </FieldRow>
      <div className={styles.items}>
        <Switch aria-label="On" defaultChecked />
        <Switch aria-label="Off" />
        <Switch aria-label="Disabled on" defaultChecked disabled />
        <Switch aria-label="Disabled off" disabled />
        <Checkbox label="3 selected" defaultChecked />
        <Checkbox label="Mixed" indeterminate readOnly />
        <Checkbox label="Disabled" disabled />
        <SegmentedControl
          name="disabled-frequency"
          aria-label="Disabled frequency"
          options={FREQUENCIES.slice(0, 3)}
          value="weekly"
          onValueChange={() => {}}
          disabled
        />
      </div>
      <Caption>
        Select opens the native options list. Focus (click or Tab into a field): accent border + 2px
        accent halo.
      </Caption>
    </>
  );
}
