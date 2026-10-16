import { mkdirSync } from 'node:fs';

/** Creates the data dir (and any missing parents) if it does not exist yet. */
export function ensureDataDir(dataDir: string): void {
  mkdirSync(dataDir, { recursive: true });
}
