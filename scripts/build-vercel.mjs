import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const vercelOutputDir = path.join(root, ".vercel", "output");
const staticDir = path.join(vercelOutputDir, "static");
const distClientDir = path.join(root, "dist", "client");
const distServerIndex = path.join(root, "dist", "server", "index.js");

async function main() {
  console.log("Preparing Vercel Build Output API artifacts...");

  await fs.mkdir(staticDir, { recursive: true });

  // 1. Copy client assets to static folder
  await fs.cp(distClientDir, staticDir, { recursive: true });

  // 2. Also ensure public directory files are present in static
  const publicDir = path.join(root, "public");
  try {
    await fs.cp(publicDir, staticDir, { recursive: true });
  } catch (err) {
    // If public doesn't exist, ignore
  }

  // 3. Render HTML for root route
  const { default: worker } = await import(distServerIndex);
  const response = await worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} }
  );

  if (response.status !== 200) {
    throw new Error(`Failed to render index.html: status ${response.status}`);
  }

  const html = await response.text();
  const indexPath = path.join(staticDir, "index.html");
  await fs.writeFile(indexPath, html, "utf-8");

  // 4. Verify pricing text in rendered HTML
  const has150 = html.includes("150 AZN");
  const has69 = html.includes("69 AZN");
  const has840 = html.includes("840 AZN");

  if (!has150 || !has69 || !has840) {
    console.warn("Warning: Expected pricing terms not found in generated index.html!");
  } else {
    console.log("Verified new pricing present in index.html (150 AZN, 69 AZN, 840 AZN)");
  }

  // 5. Clean up any previous functions directory
  await fs.rm(path.join(vercelOutputDir, "functions"), { recursive: true, force: true });

  // 6. Write Vercel Build Output API config.json
  const config = {
    version: 3,
    routes: [
      { handle: "filesystem" },
      { src: "/(.*)", dest: "/index.html" }
    ]
  };

  await fs.writeFile(
    path.join(vercelOutputDir, "config.json"),
    JSON.stringify(config, null, 2),
    "utf-8"
  );

  console.log("Vercel Build Output API generated successfully at .vercel/output");
}

main().catch((err) => {
  console.error("Error generating Vercel build output:", err);
  process.exit(1);
});
