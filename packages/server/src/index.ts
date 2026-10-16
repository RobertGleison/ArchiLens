import type { FastifyInstance } from 'fastify';
import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { ensureDataDir } from './data-dir.js';
import { databasePath, openDatabase } from './db/connection.js';
import { runMigrations } from './db/migrate.js';

const SHUTDOWN_TIMEOUT_MS = 5000;

async function main(): Promise<void> {
  const config = loadConfig();
  ensureDataDir(config.dataDir);

  const db = openDatabase(databasePath(config.dataDir));
  let app: FastifyInstance | undefined;
  try {
    const applied = runMigrations(db);
    app = await buildApp({ config, db, logger: true });
    logStartup(app, config.dataDir, applied);
    registerShutdown(app);
    await app.listen({ host: config.host, port: config.port });
  } catch (err) {
    // The app owns the db once built (closes it in onClose); before that we do.
    if (app) await app.close().catch(() => undefined);
    if (db.open) db.close();
    throw err;
  }
}

function logStartup(app: FastifyInstance, dataDir: string, applied: number[]): void {
  app.log.info(`Data dir: ${dataDir}`);
  app.log.info(
    applied.length
      ? `Applied database migrations: ${applied.join(', ')}`
      : 'Database schema up to date',
  );
}

function registerShutdown(app: FastifyInstance): void {
  const shutdown = (): void => {
    // Don't hang forever if a connection refuses to close.
    setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS).unref();
    app.close().then(
      () => process.exit(0),
      () => process.exit(1),
    );
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
