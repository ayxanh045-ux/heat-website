import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { extname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return [".ts", ".tsx"].includes(extname(path)) ? [path] : [];
  });
}

test("database access has no raw or interpolated SQL escape hatch", () => {
  const files = ["app/api", "lib", "db"].flatMap((path) => sourceFiles(join(root, path)));
  const forbidden = [
    /\bsql\.raw\s*\(/,
    /\bunsafe\s*\(/,
    /\$queryRaw(?:Unsafe)?\b/,
    /\$executeRaw(?:Unsafe)?\b/,
    /\.prepare\s*\(\s*`[^`]*\$\{/s,
  ];
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    for (const pattern of forbidden) {
      assert.doesNotMatch(source, pattern, `${file} contains a raw SQL construction`);
    }
  }
});

test("security boundary keeps scoped tokens and strict script CSP", () => {
  const provisioning = readFileSync(join(root, "lib/provisioning.ts"), "utf8");
  const worker = readFileSync(join(root, "worker/index.ts"), "utf8");
  assert.match(provisioning, /customerAgentTokens\.tokenHash/);
  assert.match(provisioning, /agentCanAccessSlug/);
  assert.match(worker, /script-src 'self' 'nonce-\$\{nonce\}' 'strict-dynamic'/);
  assert.doesNotMatch(worker, /script-src[^;]*'unsafe-inline'/);
});
