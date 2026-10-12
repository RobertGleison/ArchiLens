import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Search } from 'lucide-react';
import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Checkbox } from './Checkbox';
import { Field, FieldRow } from './Field';
import { Select, Textarea, TextInput } from './FormControls';
import { SegmentedControl } from './SegmentedControl';
import { PreferenceRow, Switch } from './Switch';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Field', () => {
  it('labels its control and links help text', () => {
    render(
      <Field label="Filter repositories" description="Matches name and description">
        <TextInput placeholder="Search by name or description…" icon={Search} />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Filter repositories' });
    expect(input).toHaveAccessibleDescription('Matches name and description');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('marks the control invalid and describes it with the error first', () => {
    render(
      <Field label="Spend cap" description="Per month" error="Enter a positive amount">
        <TextInput aria-describedby="extra" />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Spend cap' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const ids = input.getAttribute('aria-describedby')?.split(' ') ?? [];
    expect(ids).toHaveLength(3);
    expect(document.getElementById(ids[0] ?? '')).toHaveTextContent('Enter a positive amount');
    expect(ids[2]).toBe('extra');
  });

  it('passes required and disabled, and lets the control override them', () => {
    render(
      <>
        <Field label="Name" required>
          <TextInput />
        </Field>
        <Field label="Notes" disabled>
          <Textarea disabled={false} />
        </Field>
      </>,
    );
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeRequired();
    expect(screen.getByRole('textbox', { name: 'Notes' })).toBeEnabled();
  });

  it("always uses the Field's control id and warns when the control has another", () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Field label="Branch" controlId="branch">
        <TextInput id="other" />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Branch' });
    expect(input).toHaveAttribute('id', 'branch');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"other" is ignored'));
  });

  it('passes disabled to a Select', () => {
    render(
      <Field label="When a cap is reached" disabled>
        <Select>
          <option>Pause scans & notify admins</option>
        </Select>
      </Field>,
    );
    expect(screen.getByRole('combobox', { name: 'When a cap is reached' })).toBeDisabled();
  });

  it('labels a SegmentedControl group with aria-labelledby (no dangling htmlFor)', async () => {
    const user = userEvent.setup();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    function Demo() {
      const [value, setValue] = useState('daily');
      return (
        <Field label="Frequency" description="Runs at the time below">
          <SegmentedControl
            options={[
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
            ]}
            value={value}
            onValueChange={setValue}
          />
        </Field>
      );
    }
    render(<Demo />);
    const group = screen.getByRole('radiogroup', { name: 'Frequency' });
    expect(group).toHaveAccessibleDescription('Runs at the time below');
    expect(screen.getByText('Frequency').tagName).toBe('SPAN');
    await user.click(screen.getByText('Weekly'));
    expect(screen.getByRole('radio', { name: 'Weekly' })).toBeChecked();
    expect(warn).not.toHaveBeenCalled();
  });

  it('labels a Switch and a Checkbox through htmlFor and passes disabled and help text', () => {
    render(
      <>
        <Field label="Notify admins" description="By email" disabled>
          <Switch />
        </Field>
        <Field label="Monitored" error="Pick at least one">
          <Checkbox />
        </Field>
      </>,
    );
    const toggle = screen.getByRole('switch', { name: 'Notify admins' });
    expect(toggle).toBeDisabled();
    expect(toggle).toHaveAccessibleDescription('By email');
    const box = screen.getByRole('checkbox', { name: 'Monitored' });
    expect(box).toHaveAttribute('aria-invalid', 'true');
    expect(box).toHaveAccessibleDescription('Pick at least one');
  });

  it('lets a PreferenceRow inside a Field keep its own label', () => {
    render(
      <Field label="Preferences">
        <PreferenceRow title="Skip unchanged runs" aria-describedby="extra" />
      </Field>,
    );
    const toggle = screen.getByRole('switch', { name: 'Skip unchanged runs' });
    expect(toggle.getAttribute('aria-describedby')).toBe('extra');
  });

  it('uses a given control id', () => {
    render(
      <Field label="Run at" controlId="run-at">
        <TextInput />
      </Field>,
    );
    expect(screen.getByRole('textbox', { name: 'Run at' })).toHaveAttribute('id', 'run-at');
  });

  it('lays fields out in a row', () => {
    render(
      <FieldRow data-testid="row" spacing="form" align="end">
        <Field label="A">
          <TextInput />
        </Field>
      </FieldRow>,
    );
    expect(screen.getByTestId('row')).toContainElement(screen.getByRole('textbox'));
  });
});

describe('TextInput / Select / Textarea', () => {
  it('works as controlled inputs and forwards refs to the native elements', async () => {
    const user = userEvent.setup();
    const inputRef = createRef<HTMLInputElement>();
    const selectRef = createRef<HTMLSelectElement>();
    const textareaRef = createRef<HTMLTextAreaElement>();
    function Form() {
      const [query, setQuery] = useState('');
      const [visibility, setVisibility] = useState('all');
      const [note, setNote] = useState('');
      return (
        <>
          <TextInput
            ref={inputRef}
            aria-label="Query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Select
            ref={selectRef}
            aria-label="Visibility"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
          >
            <option value="all">All repositories</option>
            <option value="private">Private</option>
          </Select>
          <Textarea
            ref={textareaRef}
            aria-label="Note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <output>{`${query}|${visibility}|${note}`}</output>
        </>
      );
    }
    render(<Form />);
    await user.type(screen.getByRole('textbox', { name: 'Query' }), 'api');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Visibility' }), 'private');
    await user.type(screen.getByRole('textbox', { name: 'Note' }), 'cache');
    expect(screen.getByRole('status')).toHaveTextContent('api|private|cache');
    expect(inputRef.current).toBeInstanceOf(HTMLInputElement);
    expect(selectRef.current).toBeInstanceOf(HTMLSelectElement);
    expect(textareaRef.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('puts className on the wrapper and hides the icons from assistive tech', () => {
    const { container } = render(
      <>
        <TextInput aria-label="Search" icon={Search} className="wide" />
        <Select aria-label="Scope" />
      </>,
    );
    expect(screen.getByRole('textbox').parentElement).toHaveClass('wide');
    expect(screen.getByRole('textbox')).not.toHaveClass('wide');
    for (const svg of container.querySelectorAll('svg')) {
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('respects an explicit aria-invalid outside a Field', () => {
    render(<TextInput aria-label="Cron" aria-invalid="false" />);
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
  });
});
