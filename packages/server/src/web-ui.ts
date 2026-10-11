import { existsSync } from 'node:fs';
import { join } from 'node:path';
import fastifyStatic from '@fastify/static';
import type { FastifyInstance } from 'fastify';
import { sendNotFound } from './not-found.js';

const STATIC_FILE = /\.(js|css|map|png|jpg|svg|ico|webp|woff2?|ttf|json|txt|webmanifest)$/i;

/**
 * True for paths that can only be build assets: anything under /assets/ (Vite's
 * output dir) or a top-level file such as /favicon.ico. Nested paths with dots,
 * e.g. /repos/vercel/next.js, are client-side routes.
 */
function isAssetPath(path: string): boolean {
  if (path.startsWith('/assets/')) return true;
  const isTopLevel = path.lastIndexOf('/') === 0;
  return isTopLevel && STATIC_FILE.test(path);
}

/**
 * Serves the built web UI from `webDistDir`, falling back to index.html for
 * client-side routes (GET/HEAD that are not missing build assets). Returns
 * false (and registers nothing) when there is no web build.
 */
export async function registerWebUi(app: FastifyInstance, webDistDir: string): Promise<boolean> {
  if (!existsSync(join(webDistDir, 'index.html'))) return false;

  // wildcard: false registers a route per built file instead of a catch-all,
  // so unknown /api paths still reach the API plugin's scoped 404 handler.
  // Files are enumerated at startup: restart the server after rebuilding the web UI.
  await app.register(fastifyStatic, { root: webDistDir, wildcard: false });

  app.setNotFoundHandler((request, reply) => {
    const path = request.url.split('?')[0] ?? '';
    const isPageRequest = request.method === 'GET' || request.method === 'HEAD';
    if (!isPageRequest || isAssetPath(path)) return sendNotFound(request, reply);
    return reply.sendFile('index.html');
  });

  return true;
}
