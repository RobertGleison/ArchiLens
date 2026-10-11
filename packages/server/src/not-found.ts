import type { FastifyReply, FastifyRequest } from 'fastify';

/** Sends Fastify's standard JSON 404 body. */
export function sendNotFound(request: FastifyRequest, reply: FastifyReply): FastifyReply {
  return reply.code(404).send({
    statusCode: 404,
    error: 'Not Found',
    message: `Route ${request.method}:${request.url} not found`,
  });
}
