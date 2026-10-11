import { fileURLToPath } from 'node:url';
import Fastify, { type FastifyInstance } from 'fastify';
import type { ServerConfig } from './config.js';
import type { Db } from './db/connection.js';
import { registerHostGuard } from './host-guard.js';
import { apiRoutes } from './routes/api.js';
import { registerWebUi } from './web-ui.js';

/** Location of the web build relative to this module (works from src/ and dist/). */
export const DEFAULT_WEB_DIST_DIR = fileURLToPath(new URL('../../web/dist', import.meta.url));

export interface BuildAppOptions {
  config: ServerConfig;
  /** Open, migrated database. The app takes ownership and closes it on `app.close()`. */
  db: Db;
  /** Directory containing the built web UI. Defaults to packages/web/dist. */
  webDistDir?: string;
  logger?: boolean;
}

export async function buildApp({
  config,
  db,
  webDistDir = DEFAULT_WEB_DIST_DIR,
  logger = false,
}: BuildAppOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger });
  app.addHook('onClose', async () => {
    db.close();
  });

  registerHostGuard(app, config.port);
  await app.register(apiRoutes, { prefix: '/api', dataDir: config.dataDir });
  const servingUi = await registerWebUi(app, webDistDir);
  if (!servingUi) {
    app.log.info(`No web build at ${webDistDir}; serving API only`);
  }

  return app;
}
