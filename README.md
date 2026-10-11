# ArchiLens

An app to give me the system design architecture of all repositories I want and the latest changes.

ArchiLens runs locally for a single user: a TypeScript (Fastify) server bound to `127.0.0.1` that serves a JSON API under `/api` and the React web UI.

## Requirements

- Node.js 18.19+ (see `.nvmrc`) and npm 10

## Repository layout

| Package             | Path              | Purpose                                                            |
| ------------------- | ----------------- | ------------------------------------------------------------------ |
| `@archilens/shared` | `packages/shared` | TypeScript types shared by server and UI (e.g. `HealthResponse`)   |
| `@archilens/server` | `packages/server` | Fastify server: `/api/*` routes, serves the built UI in production |
| `@archilens/web`    | `packages/web`    | Vite + React UI; calls relative `/api/...` paths only              |

## Getting started

```bash
npm install
npm run dev
```

`npm run dev` builds the shared types, then starts the API server (`tsx watch`, port 4317 by default) and the Vite dev server (http://127.0.0.1:5173) together. Vite proxies `/api` to the API server, so open http://127.0.0.1:5173 to see the placeholder UI calling `GET /api/health`.

## Production build

```bash
npm run build   # builds shared, server and web
npm start       # runs the built server; open http://127.0.0.1:4317
```

The built server serves `packages/web/dist` statically, falls back to `index.html` for client-side routes, and keeps returning JSON 404s for unknown `/api` routes.

## Scripts

| Command              | What it does                                         |
| -------------------- | ---------------------------------------------------- |
| `npm run dev`        | Server + UI in watch mode                            |
| `npm run build`      | Production build of all packages                     |
| `npm start`          | Start the built server                               |
| `npm test`           | Run all tests (Vitest, workspace-wide)               |
| `npm run test:watch` | Tests in watch mode                                  |
| `npm run lint`       | ESLint (flat config, typescript-eslint, react-hooks) |
| `npm run typecheck`  | `tsc --noEmit` for every package                     |
| `npm run format`     | Prettier write (`format:check` to verify only)       |

## Configuration

All configuration is via environment variables; there are no hard-coded paths.

| Variable             | Default        | Description                                                                                        |
| -------------------- | -------------- | -------------------------------------------------------------------------------------------------- |
| `ARCHILENS_PORT`     | `4317`         | Port the server listens on. In dev, Vite's `/api` proxy targets the same port.                     |
| `ARCHILENS_DATA_DIR` | `~/.archilens` | Directory for all app data. Created on startup if missing; it is the only place the app writes to. |

The server always binds to `127.0.0.1` (loopback only); the host is intentionally not configurable.

## API

- `GET /api/health` → `{ "status": "ok", "version": "0.1.0", "dataDir": "/abs/path" }`
