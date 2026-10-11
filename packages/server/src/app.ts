import { fileURLToPath } from 'node:url';
import Fastify, { type FastifyInstance } from 'fastify';
import type { ServerConfig } from './config.js';
import { registerHealthRoute } from './routes/health.js';
import { registerWebUi } from './web-ui.js';

/** Location of the web build relative to this module (works from src/ and dist/). */
export const DEFAULT_WEB_DIST_DIR = fileURLToPath(new URL('../../web/dist', import.meta.url));

export interface BuildAppOptions {
  config: ServerConfig;
  /** Directory containing the built web UI. Defaults to packages/web/dist. */
  webDistDir?: string;
  logger?: boolean;
}

export async function buildApp({
  config,
  webDistDir = DEFAULT_WEB_DIST_DIR,
  logger = false,
}: BuildAppOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger });

  registerHealthRoute(app, config.dataDir);
  const servingUi = await registerWebUi(app, webDistDir);
  if (!servingUi) {
    app.log.info(`No web build at ${webDistDir}; serving API only`);
  }

  return app;
}
