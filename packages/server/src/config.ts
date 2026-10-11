import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

export const DEFAULT_PORT = 4317;

/** The server only ever binds to loopback: ArchiLens is a single-user local app. */
export const LOOPBACK_HOST = '127.0.0.1';

export interface ServerConfig {
  host: string;
  port: number;
  /** Absolute path of the only directory the app writes to at runtime. */
  dataDir: string;
}

type Env = Record<string, string | undefined>;

export function loadConfig(env: Env = process.env): ServerConfig {
  return {
    host: LOOPBACK_HOST,
    port: parsePort(env.ARCHILENS_PORT),
    dataDir: resolve(env.ARCHILENS_DATA_DIR || defaultDataDir()),
  };
}

function defaultDataDir(): string {
  return join(homedir(), '.archilens');
}

function parsePort(raw: string | undefined): number {
  if (raw === undefined) return DEFAULT_PORT;
  const port = Number(raw);
  if (raw.trim() === '' || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid ARCHILENS_PORT "${raw}": expected an integer between 1 and 65535`);
  }
  return port;
}
