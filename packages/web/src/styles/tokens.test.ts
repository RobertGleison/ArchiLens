import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ICON_SIZE } from '../ui/icon';
import { parseTokens } from './parseTokens';
import tokensCss from './tokens.css?raw';

// Values from the Figma spec. If one changes, change it here and in tokens.css together.
const EXPECTED: Record<string, string> = {
  '--color-ink': '#353535',
  '--color-ink-muted': 'rgba(53, 53, 53, 0.7)',
  '--color-surface-subtle': 'rgba(53, 53, 53, 0.02)',
  '--color-accent': '#3c6e71',
  '--color-accent-hover': '#376568',
  '--color-accent-tint': 'rgba(60, 110, 113, 0.05)',
  '--color-border': '#d9d9d9',
  '--color-surface': '#ffffff',
  '--color-surface-inverse': 'var(--color-ink)',
  '--color-on-dark': '#ffffff',
  '--color-on-dark-muted': '#d9d9d9',
  '--color-on-dark-border': 'rgba(255, 255, 255, 0.15)',
  '--color-on-dark-hover': 'rgba(255, 255, 255, 0.06)',

  '--font-weight-regular': '400',
  '--font-weight-medium': '500',
  '--font-weight-semibold': '600',
  '--line-height-default': '1.5',
  '--line-height-tight': '1.4',
  '--line-height-normal': 'normal',

  '--font-size-display': '30px',
  '--font-size-display-sm': '28px',
  '--font-size-title': '16px',
  '--font-size-body-lg': '14px',
  '--font-size-body': '13px',
  '--font-size-body-sm': '12px',
  '--font-size-caption': '11px',
  '--font-size-overline': '10px',

  ...Object.fromEntries(
    [2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 34].map((n) => [
      `--space-${n}`,
      `${n}px`,
    ]),
  ),
  '--space-page': 'var(--space-32)',
  '--space-card': 'var(--space-20)',
  '--space-card-sm': 'var(--space-16)',
  '--space-row': 'var(--space-12)',

  '--radius-2xs': '2px',
  '--radius-xs': '3px',
  '--radius-sm': '4px',
  '--radius-md': '6px',
  '--radius-lg': '8px',
  '--radius-switch': '20px',
  '--radius-full': '50%',

  '--border-width': '1px',
  '--border-default': 'var(--border-width) solid var(--color-border)',
  '--focus-ring': '2px solid var(--color-accent)',
  '--focus-ring-offset': '2px',

  '--opacity-disabled': '0.5',

  '--size-control': '38px',
  '--size-control-sm': '30px',
  '--size-nav-item': '42px',
  '--size-table-header': '36px',
  '--size-table-row-min': '60px',
  '--size-progress-sm': '4px',
  '--size-progress-md': '5px',
  '--size-utility-bar': '68px',
  '--size-sidebar': '216px',
  '--size-aside': '346px',
  '--size-aside-wide': '390px',
};

describe('design tokens', () => {
  const tokens = parseTokens(tokensCss);
  const byName = new Map(tokens.map((t) => [t.name, t.value]));

  it.each(Object.entries(EXPECTED))('%s is %s', (name, value) => {
    expect(byName.get(name)).toBe(value);
  });

  it('declares each token once and nothing outside the spec', () => {
    expect(tokens.map((t) => t.name).sort()).toEqual(
      [...Object.keys(EXPECTED), '--font-sans', '--font-mono'].sort(),
    );
  });

  it('uses Inter and IBM Plex Mono as the primary font families', () => {
    expect(byName.get('--font-sans')).toMatch(/^'Inter',/);
    expect(byName.get('--font-mono')).toMatch(/^'IBM Plex Mono',/);
  });

  it('has no shadows', () => {
    expect(tokens.filter((t) => /shadow/i.test(`${t.name} ${t.value}`))).toEqual([]);
  });

  it('defines the documented icon sizes', () => {
    expect(ICON_SIZE).toEqual({
      pill: 12,
      input: 14,
      button: 15,
      card: 16,
      search: 17,
      nav: 18,
      notice: 18,
      logo: 28,
    });
  });

  it('has a typography class for every type-scale token', () => {
    const typography = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'typography.module.css'),
      'utf8',
    );
    const classes = [...typography.matchAll(/^:where\(\.(\w+)\)\s*\{/gm)].map((m) => m[1]);
    const camel = (s: string) => s.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());
    const expected = tokens
      .filter((t) => t.name.startsWith('--font-size-'))
      .map((t) => camel(t.name.slice('--font-size-'.length)));

    expect(classes).toEqual(expected);
    for (const name of expected) {
      const kebab = name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
      expect(typography).toContain(`font-size: var(--font-size-${kebab});`);
    }
  });
});
