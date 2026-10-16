import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Not `new URL('..', import.meta.url)`: Vite rewrites that pattern as an asset URL.
const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');
const ALLOWED = new Set(['styles/tokens.css']);

const COLOR_FUNCTION_OR_HEX =
  /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color-mix)\(/i;
// Named colours as CSS values (`transparent`, `currentColor`, `inherit` are allowed).
const NAMED_COLOR_VALUE =
  /:[^;{}]*\b(?:white|black|red|green|blue|gr[ae]y|orange|yellow|purple|pink|brown|navy|teal|silver|maroon|olive|lime|aqua|cyan|magenta|fuchsia|gold|indigo|violet)\b/i;

/** Returns `line: text` for every colour literal in a source file (CSS comments ignored). */
export function findColorLiterals(fileName: string, content: string): string[] {
  const isCss = fileName.endsWith('.css');
  // Blank out comments but keep newlines so line numbers stay right.
  const source = isCss
    ? content.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '))
    : content;
  return source
    .split('\n')
    .flatMap((line, i) =>
      COLOR_FUNCTION_OR_HEX.test(line) || (isCss && NAMED_COLOR_VALUE.test(line))
        ? [`${i + 1}: ${line.trim()}`]
        : [],
    );
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(tsx?|css)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

describe('findColorLiterals', () => {
  it.each([
    ['a.css', '.x { color: #fff; }'],
    ['a.css', '.x { background: rgb(0 0 0); }'],
    ['a.css', '.x { color: oklch(70% 0.1 200); }'],
    ['a.css', '.x { color: color-mix(in srgb, var(--color-ink), var(--color-surface)); }'],
    ['a.css', '.x { border: 1px solid white; }'],
    ['a.css', '.x { color: Grey; }'],
    ['a.tsx', "const c = 'hsl(10 20% 30%)';"],
    ['a.tsx', "<div style={{ color: '#3c6e71' }} />"],
  ])('flags %s: %s', (file, content) => {
    expect(findColorLiterals(file, content)).toHaveLength(1);
  });

  it.each([
    ['a.css', '.x { color: var(--color-ink); background: transparent; fill: currentColor; }'],
    ['a.css', '.x { color: inherit; }'],
    ['a.css', '/* white text on the sidebar */\n.x { color: var(--color-on-dark); }'],
    ['a.css', '.label { composes: title from "./typography.module.css"; }'],
    ['a.tsx', "const label = 'white paper'; getElementById('root');"],
  ])('allows %s: %s', (file, content) => {
    expect(findColorLiterals(file, content)).toEqual([]);
  });
});

describe('color literals', () => {
  it('only appear in styles/tokens.css', () => {
    const offenders = sourceFiles(SRC)
      .map((path) => relative(SRC, path).split('\\').join('/'))
      .filter((file) => !ALLOWED.has(file))
      .flatMap((file) =>
        findColorLiterals(file, readFileSync(join(SRC, file), 'utf8')).map(
          (hit) => `${file}:${hit}`,
        ),
      );
    expect(offenders).toEqual([]);
  });
});
