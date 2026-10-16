import { readFileSync } from 'node:fs';

// Resolves to the package root from both src/ (dev) and dist/ (prod).
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
  version: string;
};

export const SERVER_VERSION: string = pkg.version;
