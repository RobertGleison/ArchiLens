import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { ensureDataDir } from './data-dir.js';

const SHUTDOWN_TIMEOUT_MS = 5000;

async function main(): Promise<void> {
  const config = loadConfig();
  ensureDataDir(config.dataDir);

  const app = await buildApp({ config, logger: true });
  app.log.info(`Data dir: ${config.dataDir}`);

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

  await app.listen({ host: config.host, port: config.port });
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
