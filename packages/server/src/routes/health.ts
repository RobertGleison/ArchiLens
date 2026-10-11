import type { HealthResponse } from '@archilens/shared';
import type { FastifyInstance } from 'fastify';
import { SERVER_VERSION } from '../version.js';

export function registerHealthRoute(api: FastifyInstance, dataDir: string): void {
  api.get('/health', async (): Promise<HealthResponse> => {
    return { status: 'ok', version: SERVER_VERSION, dataDir };
  });
}
