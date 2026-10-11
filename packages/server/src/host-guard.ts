import type { AddressInfo } from 'node:net';
import type { FastifyInstance } from 'fastify';

/**
 * DNS-rebinding protection: only accept requests whose Host header names the
 * loopback server itself (`127.0.0.1:<port>` or `localhost:<port>`).
 *
 * The port is the one actually bound (relevant when listening on port 0),
 * falling back to the configured port when not listening (e.g. `inject`).
 */
export function registerHostGuard(app: FastifyInstance, configuredPort: number): void {
  app.addHook('onRequest', async (request, reply) => {
    const address = app.server.address() as AddressInfo | string | null;
    const port = typeof address === 'object' && address ? address.port : configuredPort;
    const allowed = [`127.0.0.1:${port}`, `localhost:${port}`];

    const host = request.headers.host?.toLowerCase();
    if (!host || !allowed.includes(host)) {
      return reply.code(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Host not allowed',
      });
    }
  });
}
