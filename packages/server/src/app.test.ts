import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { HealthResponse } from '@archilens/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from './app.js';
import { SERVER_VERSION } from './version.js';

const config = { host: '127.0.0.1', port: 0, dataDir: '/tmp/archilens-data' };

describe('GET /api/health', () => {
  it('returns ok status, version and data dir', async () => {
    const app = await buildApp({ config });
    const res = await app.inject({ method: 'GET', url: '/api/health' });

    expect(res.statusCode).toBe(200);
    expect(res.json<HealthResponse>()).toEqual({
      status: 'ok',
      version: SERVER_VERSION,
      dataDir: config.dataDir,
    });
    await app.close();
  });
});

describe('serving the web UI', () => {
  let webDistDir: string;

  beforeAll(() => {
    webDistDir = mkdtempSync(join(tmpdir(), 'archilens-web-'));
    mkdirSync(join(webDistDir, 'assets'));
    writeFileSync(join(webDistDir, 'index.html'), '<!doctype html><div id="root"></div>');
    writeFileSync(join(webDistDir, 'assets', 'app.js'), 'console.log(1);');
  });

  afterAll(() => {
    rmSync(webDistDir, { recursive: true, force: true });
  });

  it('serves index.html at /', async () => {
    const app = await buildApp({ config, webDistDir });
    const res = await app.inject({ method: 'GET', url: '/' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.body).toContain('id="root"');
    await app.close();
  });

  it('serves static assets', async () => {
    const app = await buildApp({ config, webDistDir });
    const res = await app.inject({ method: 'GET', url: '/assets/app.js' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe('console.log(1);');
    await app.close();
  });

  it('falls back to index.html for unknown non-API routes (SPA)', async () => {
    const app = await buildApp({ config, webDistDir });
    const res = await app.inject({ method: 'GET', url: '/repos/some/deep/link' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('id="root"');
    await app.close();
  });

  it('returns a JSON 404 for unknown API routes instead of the SPA', async () => {
    const app = await buildApp({ config, webDistDir });
    const res = await app.inject({ method: 'GET', url: '/api/does-not-exist' });
    expect(res.statusCode).toBe(404);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    await app.close();
  });

  it('does not serve the UI when no web build is available', async () => {
    const app = await buildApp({ config, webDistDir: join(webDistDir, 'missing') });
    const res = await app.inject({ method: 'GET', url: '/' });
    expect(res.statusCode).toBe(404);
    await app.close();
  });
});
