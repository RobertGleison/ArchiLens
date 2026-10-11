import { existsSync } from 'node:fs';
import { extname, join } from 'node:path';
import fastifyStatic from '@fastify/static';
import type { FastifyInstance } from 'fastify';
import { sendNotFound } from './not-found.js';

/**
 * Serves the built web UI from `webDistDir`, falling back to index.html for
 * client-side routes (GET/HEAD without a file extension). Returns false (and
 * registers nothing) when there is no web build.
 */
export async function registerWebUi(app: FastifyInstance, webDistDir: string): Promise<boolean> {
  if (!existsSync(join(webDistDir, 'index.html'))) return false;

  // wildcard: false registers a route per built file instead of a catch-all,
  // so unknown /api paths still reach the API plugin's scoped 404 handler.
  await app.register(fastifyStatic, { root: webDistDir, wildcard: false });

  app.setNotFoundHandler((request, reply) => {
    const path = request.url.split('?')[0] ?? '';
    const isPageRequest = request.method === 'GET' || request.method === 'HEAD';
    if (!isPageRequest || extname(path) !== '') return sendNotFound(request, reply);
    return reply.sendFile('index.html');
  });

  return true;
}
