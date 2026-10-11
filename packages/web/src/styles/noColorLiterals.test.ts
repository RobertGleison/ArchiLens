import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SRC = fileURLToPath(new URL('..', import.meta.url));
const ALLOWED = new Set(['styles/tokens.css']);
const COLOR_LITERAL = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(/;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(tsx?|css)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

describe('color literals', () => {
  it('only appear in styles/tokens.css', () => {
    const offenders = sourceFiles(SRC)
      .map((path) => relative(SRC, path).split('\\').join('/'))
      .filter((file) => !ALLOWED.has(file))
      .flatMap((file) =>
        readFileSync(join(SRC, file), 'utf8')
          .split('\n')
          .flatMap((line, i) =>
            COLOR_LITERAL.test(line) ? [`${file}:${i + 1}: ${line.trim()}`] : [],
          ),
      );
    expect(offenders).toEqual([]);
  });
});
