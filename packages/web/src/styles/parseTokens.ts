export interface Token {
  name: string;
  value: string;
}

/** Extracts `--name: value;` declarations (comments stripped) in source order; values are raw (var() unresolved). */
export function parseTokens(css: string): Token[] {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const tokens: Token[] = [];
  for (const match of source.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    tokens.push({ name: match[1] as string, value: (match[2] as string).trim() });
  }
  return tokens;
}
