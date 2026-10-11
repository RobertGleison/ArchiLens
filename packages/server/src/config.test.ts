import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_PORT, loadConfig } from './config.js';

describe('loadConfig', () => {
  it('uses loopback, the default port and ~/.archilens when no env is set', () => {
    expect(loadConfig({})).toEqual({
      host: '127.0.0.1',
      port: DEFAULT_PORT,
      dataDir: join(homedir(), '.archilens'),
    });
  });

  it('reads the port and data dir from env', () => {
    const config = loadConfig({ ARCHILENS_PORT: '5000', ARCHILENS_DATA_DIR: '/tmp/archilens-x' });
    expect(config.port).toBe(5000);
    expect(config.dataDir).toBe(resolve('/tmp/archilens-x'));
  });

  it('resolves a relative data dir to an absolute path', () => {
    expect(loadConfig({ ARCHILENS_DATA_DIR: 'some/dir' }).dataDir).toBe(resolve('some/dir'));
  });

  it('always binds to loopback, even if a host is provided', () => {
    expect(loadConfig({ ARCHILENS_HOST: '0.0.0.0' }).host).toBe('127.0.0.1');
  });

  it.each(['abc', '0', '70000', '12.5', ''])('rejects invalid port %j', (port) => {
    expect(() => loadConfig({ ARCHILENS_PORT: port })).toThrow(/ARCHILENS_PORT/);
  });
});
