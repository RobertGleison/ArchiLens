import { existsSync } from 'node:fs';
import { join } from 'node:path';
import fastifyStatic from '@fastify/static';
import type { FastifyInstance } from 'fastify';

/**
 * Serves the built web UI from `webDistDir`, falling back to index.html for
 * client-side routes. Unknown `/api` routes keep returning a JSON 404.
 * Returns false (and registers nothing) when there is no web build.
 */
export async function registerWebUi(app: FastifyInstance, webDistDir: string): Promise<boolean> {
  if (!existsSync(join(webDistDir, 'index.html'))) return false;

  await app.register(fastifyStatic, { root: webDistDir });

  app.setNotFoundHandler((request, reply) => {
    const path = request.url.split('?')[0] ?? '';
    const isApi = path === '/api' || path.startsWith('/api/');
    if (request.method !== 'GET' || isApi) {
      return reply.code(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: `Route ${request.method}:${request.url} not found`,
      });
    }
    return reply.sendFile('index.html');
  });

  return true;
}
