import type { HealthResponse } from '@archilens/shared';
import type { FastifyInstance } from 'fastify';
import { SERVER_VERSION } from '../version.js';

export function registerHealthRoute(app: FastifyInstance, dataDir: string): void {
  app.get('/api/health', async (): Promise<HealthResponse> => {
    return { status: 'ok', version: SERVER_VERSION, dataDir };
  });
}
