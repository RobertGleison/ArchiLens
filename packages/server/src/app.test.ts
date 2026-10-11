import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { HealthResponse } from '@archilens/shared';
import type { FastifyInstance, InjectOptions } from 'fastify';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { buildApp, type BuildAppOptions } from './app.js';
import type { ServerConfig } from './config.js';
import { SERVER_VERSION } from './version.js';

const config: ServerConfig = { host: '127.0.0.1', port: 4317, dataDir: '/tmp/archilens-data' };
const LOCAL_HOST = `127.0.0.1:${config.port}`;

let app: FastifyInstance | undefined;

async function start(options: Partial<BuildAppOptions> = {}): Promise<FastifyInstance> {
  app = await buildApp({ config, webDistDir: join(tmpdir(), 'archilens-no-web'), ...options });
  return app;
}

function get(instance: FastifyInstance, url: string, extra: Partial<InjectOptions> = {}) {
  return instance.inject({ method: 'GET', url, headers: { host: LOCAL_HOST }, ...extra });
}

afterEach(async () => {
  await app?.close();
  app = undefined;
});

describe('GET /api/health', () => {
  it('returns ok status, version and data dir', async () => {
    const res = await get(await start(), '/api/health');

    expect(res.statusCode).toBe(200);
    expect(res.json<HealthResponse>()).toEqual({
      status: 'ok',
      version: SERVER_VERSION,
      dataDir: config.dataDir,
    });
  });

  it('returns a JSON 404 for unknown API routes', async () => {
    const res = await get(await start(), '/api/does-not-exist');
    expect(res.statusCode).toBe(404);
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});

describe('Host header guard (DNS rebinding)', () => {
  it.each([`127.0.0.1:${config.port}`, `localhost:${config.port}`, `LOCALHOST:${config.port}`])(
    'allows %s',
    async (host) => {
      const res = await get(await start(), '/api/health', { headers: { host } });
      expect(res.statusCode).toBe(200);
    },
  );

  it.each([`evil.example:${config.port}`, 'localhost:9999', 'localhost', '127.0.0.1'])(
    'rejects %s with 403',
    async (host) => {
      const res = await get(await start(), '/api/health', { headers: { host } });
      expect(res.statusCode).toBe(403);
      expect(res.json()).toMatchObject({ statusCode: 403, error: 'Forbidden' });
    },
  );

  it('uses the actually bound port when listening on port 0', async () => {
    const instance = await start({ config: { ...config, port: 0 } });
    await instance.listen({ host: '127.0.0.1', port: 0 });
    const { port } = instance.server.address() as { port: number };

    const ok = await fetch(`http://127.0.0.1:${port}/api/health`);
    expect(ok.status).toBe(200);

    const res = await get(instance, '/api/health', { headers: { host: 'evil.example' } });
    expect(res.statusCode).toBe(403);
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
    const res = await get(await start({ webDistDir }), '/');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.body).toContain('id="root"');
  });

  it('serves static assets', async () => {
    const res = await get(await start({ webDistDir }), '/assets/app.js');
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe('console.log(1);');
  });

  it('falls back to index.html for unknown client-side routes (SPA)', async () => {
    const res = await get(await start({ webDistDir }), '/repos/some/deep/link?tab=1');
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('id="root"');
  });

  it('falls back to index.html for HEAD requests too', async () => {
    const res = await get(await start({ webDistDir }), '/repos/x', { method: 'HEAD' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
  });

  it('returns 404 for missing files instead of index.html', async () => {
    const res = await get(await start({ webDistDir }), '/assets/missing.js');
    expect(res.statusCode).toBe(404);
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('does not fall back for non-GET requests', async () => {
    const res = await get(await start({ webDistDir }), '/repos/x', { method: 'POST' });
    expect(res.statusCode).toBe(404);
  });

  it('keeps unknown API routes as a JSON 404 instead of the SPA', async () => {
    const res = await get(await start({ webDistDir }), '/api/does-not-exist');
    expect(res.statusCode).toBe(404);
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('does not serve the UI when no web build is available', async () => {
    const res = await get(await start(), '/');
    expect(res.statusCode).toBe(404);
  });
});
