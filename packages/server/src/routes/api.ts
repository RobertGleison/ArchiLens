import type { FastifyPluginAsync } from 'fastify';
import { sendNotFound } from '../not-found.js';
import { registerHealthRoute } from './health.js';

export interface ApiOptions {
  dataDir: string;
}

/**
 * All JSON API routes. Register with `{ prefix: '/api' }`; dependencies for
 * later routes are passed in through the plugin options.
 */
export const apiRoutes: FastifyPluginAsync<ApiOptions> = async (api, { dataDir }) => {
  registerHealthRoute(api, dataDir);
  api.setNotFoundHandler(sendNotFound);
};
