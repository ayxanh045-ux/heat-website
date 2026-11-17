import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { register } from "node:module";

// Mock cloudflare:workers for Node.js build-time rendering
const mockWorkersModule = `
export const env = {
  ADMIN_ACCESS_TOKEN: "heat2026",
  ADMIN_EMAILS: "admin@heatenergyanalytics.com"
};
export default { env };
`;

register(
  "data:text/javascript," +
    encodeURIComponent(`
export function resolve(specifier, context, nextResolve) {
  if (specifier === "cloudflare:workers") {
    return {
      format: "module",
      shortCircuit: true,
      url: "data:text/javascript," + encodeURIComponent(${JSON.stringify(mockWorkersModule)}),
    };
  }
  return nextResolve(specifier, context);
}
`)
);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const vercelOutputDir = path.join(root, ".vercel", "output");
const staticDir = path.join(vercelOutputDir, "static");
const distClientDir = path.join(root, "dist", "client");
const distServerIndex = path.join(root, "dist", "server", "index.js");

async function renderRoute(worker, routePath, headers = {}) {
  const response = await worker.fetch(
    new Request(`http://localhost${routePath}`, {
      headers: {
        accept: "text/html",
        "x-admin-token": "heat2026",
        ...headers,
      },
    }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} }
  );

  if (response.status !== 200) {
    throw new Error(`Failed to render ${routePath}: status ${response.status}`);
  }

  return response.text();
}

async function main() {
  console.log("Preparing Vercel Build Output API artifacts...");

  await fs.mkdir(staticDir, { recursive: true });

  // 1. Copy client assets to static folder
  await fs.cp(distClientDir, staticDir, { recursive: true });

  // 2. Also ensure public directory files are present in static
  const publicDir = path.join(root, "public");
  try {
    await fs.cp(publicDir, staticDir, { recursive: true });
  } catch {
    // If public doesn't exist, ignore
  }

  // 3. Render HTML for core routes
  const { default: worker } = await import(distServerIndex);

  const routesToRender = [
    { path: "/", file: "index.html" },
    { path: "/customer", file: "customer/index.html", alias: "customer.html" },
    { path: "/customer/dashboard", file: "customer/dashboard/index.html" },
    { path: "/admin", file: "admin/index.html", alias: "admin.html" },
    { path: "/admin/requests", file: "admin/requests/index.html" },
  ];

  for (const item of routesToRender) {
    console.log(`Rendering route: ${item.path}...`);
    const html = await renderRoute(worker, item.path);
    const targetFile = path.join(staticDir, item.file);
    await fs.mkdir(path.dirname(targetFile), { recursive: true });
    await fs.writeFile(targetFile, html, "utf-8");

    if (item.alias) {
      await fs.writeFile(path.join(staticDir, item.alias), html, "utf-8");
    }
  }

  // 4. Verify pricing text in rendered root HTML
  const rootHtml = await fs.readFile(path.join(staticDir, "index.html"), "utf-8");
  const has150 = rootHtml.includes("150 AZN");
  const has69 = rootHtml.includes("69 AZN");
  const has840 = rootHtml.includes("840 AZN");

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
      { src: "/customer/dashboard/?", dest: "/customer/dashboard/index.html" },
      { src: "/customer/?", dest: "/customer/index.html" },
      { src: "/admin/requests/?", dest: "/admin/requests/index.html" },
      { src: "/admin/?", dest: "/admin/index.html" },
      { src: "/(.*)", dest: "/index.html" },
    ],
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
