import { existsSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadConfig } from './config.js';
import { ensureDataDir } from './data-dir.js';

describe('ensureDataDir', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'archilens-test-'));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('creates the configured data dir (including parents) on first run', () => {
    const { dataDir } = loadConfig({ ARCHILENS_DATA_DIR: join(root, 'nested', 'data') });
    expect(existsSync(dataDir)).toBe(false);

    ensureDataDir(dataDir);

    expect(statSync(dataDir).isDirectory()).toBe(true);
  });

  it('is idempotent when the directory already exists', () => {
    const dataDir = join(root, 'data');
    ensureDataDir(dataDir);
    expect(() => ensureDataDir(dataDir)).not.toThrow();
  });
});
