/** Response body of `GET /api/health`. */
export interface HealthResponse {
  status: 'ok';
  /** Version of the running server package. */
  version: string;
  /** Absolute path of the directory the app writes to. Safe to expose: the server is loopback-only. */
  dataDir: string;
}
