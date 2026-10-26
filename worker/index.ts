/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
  WORKSPACE_AUTH_SECRET?: string;
  ADMIN_ACCESS_TOKEN?: string;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

function sanitizeIncomingRequest(request: Request, env: Env): Request {
  const untrustedPrefix = "oai-authenticated-user-";
  let hasUntrustedHeader = false;
  for (const [key] of request.headers) {
    if (key.toLowerCase().startsWith(untrustedPrefix)) {
      hasUntrustedHeader = true;
      break;
    }
  }

  const workspaceSecret = typeof env.WORKSPACE_AUTH_SECRET === "string" ? env.WORKSPACE_AUTH_SECRET.trim() : "";
  const callerSecret = request.headers.get("x-workspace-auth-secret")?.trim() ?? "";

  if (workspaceSecret && callerSecret && workspaceSecret === callerSecret) {
    const cleanHeaders = new Headers(request.headers);
    cleanHeaders.delete("x-workspace-auth-secret");
    return new Request(request, { headers: cleanHeaders });
  }

  if (!hasUntrustedHeader && !callerSecret) {
    return request;
  }

  const cleanHeaders = new Headers(request.headers);
  for (const [key] of request.headers) {
    if (key.toLowerCase().startsWith(untrustedPrefix)) {
      cleanHeaders.delete(key);
    }
  }
  cleanHeaders.delete("x-workspace-auth-secret");
  return new Request(request, { headers: cleanHeaders });
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const sanitizedRequest = sanitizeIncomingRequest(request, env);
    const url = new URL(sanitizedRequest.url);

    if (url.hostname.endsWith(".chatgpt.site") || url.hostname === "www.heatenergyanalytics.com") {
      const canonicalUrl = `https://heatenergyanalytics.com${url.pathname}${url.search}`;
      const baseRedirect = Response.redirect(canonicalUrl, 308);
      const redirect = new Response(baseRedirect.body, baseRedirect);
      redirect.headers.set("link", `<${canonicalUrl}>; rel="canonical"`);
      redirect.headers.set("x-robots-tag", "noindex, nofollow");
      redirect.headers.set("cache-control", "public, max-age=3600");
      return redirect;
    }

    if (url.pathname === "/robots.txt") {
      return new Response(
        [
          "User-agent: *",
          "Allow: /",
          "Disallow: /admin",
          "Disallow: /admin/*",
          "Disallow: /customer",
          "Disallow: /customer/*",
          "Disallow: /app",
          "Disallow: /app/*",
          "Disallow: /api/*",
          "",
          "User-agent: GPTBot",
          "User-agent: OAI-SearchBot",
          "User-agent: ChatGPT-User",
          "User-agent: PerplexityBot",
          "User-agent: ClaudeBot",
          "User-agent: anthropic-ai",
          "User-agent: Google-Extended",
          "User-agent: Applebot",
          "User-agent: Applebot-Extended",
          "User-agent: cohere-ai",
          "Allow: /",
          "Disallow: /admin/*",
          "Disallow: /customer/*",
          "Disallow: /app/*",
          "Disallow: /api/*",
          "",
          "Sitemap: https://heatenergyanalytics.com/sitemap.xml",
          "Host: https://heatenergyanalytics.com",
          "",
        ].join("\n"),
        { headers: { "content-type": "text/plain; charset=utf-8" } },
      );
    }

    if (url.pathname === "/sitemap.xml") {
      const now = new Date().toISOString().slice(0, 10);
      return new Response(
        [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
          "  <url>",
          "    <loc>https://heatenergyanalytics.com/</loc>",
          `    <lastmod>${now}</lastmod>`,
          "    <changefreq>weekly</changefreq>",
          "    <priority>1.0</priority>",
          '    <xhtml:link rel="alternate" hreflang="az" href="https://heatenergyanalytics.com/"/>',
          '    <xhtml:link rel="alternate" hreflang="en" href="https://heatenergyanalytics.com/"/>',
          '    <xhtml:link rel="alternate" hreflang="ru" href="https://heatenergyanalytics.com/"/>',
          "  </url>",
          "  <url>",
          "    <loc>https://heatenergyanalytics.com/#solutions</loc>",
          `    <lastmod>${now}</lastmod>`,
          "    <changefreq>monthly</changefreq>",
          "    <priority>0.8</priority>",
          "  </url>",
          "  <url>",
          "    <loc>https://heatenergyanalytics.com/#platform</loc>",
          `    <lastmod>${now}</lastmod>`,
          "    <changefreq>monthly</changefreq>",
          "    <priority>0.9</priority>",
          "  </url>",
          "  <url>",
          "    <loc>https://heatenergyanalytics.com/#pricing</loc>",
          `    <lastmod>${now}</lastmod>`,
          "    <changefreq>monthly</changefreq>",
          "    <priority>0.8</priority>",
          "  </url>",
          "  <url>",
          "    <loc>https://heatenergyanalytics.com/#faq</loc>",
          `    <lastmod>${now}</lastmod>`,
          "    <changefreq>weekly</changefreq>",
          "    <priority>0.8</priority>",
          "  </url>",
          "  <url>",
          "    <loc>https://heatenergyanalytics.com/#about</loc>",
          `    <lastmod>${now}</lastmod>`,
          "    <changefreq>monthly</changefreq>",
          "    <priority>0.7</priority>",
          "  </url>",
          "  <url>",
          "    <loc>https://heatenergyanalytics.com/#contact</loc>",
          `    <lastmod>${now}</lastmod>`,
          "    <changefreq>monthly</changefreq>",
          "    <priority>0.9</priority>",
          "  </url>",
          "</urlset>",
          "",
        ].join("\n"),
        { headers: { "content-type": "application/xml; charset=utf-8" } },
      );
    }

    if (url.pathname === "/googlea393718e45b86574.html") {
      return new Response(
        "google-site-verification: googlea393718e45b86574.html",
        { headers: { "content-type": "text/html; charset=utf-8" } },
      );
    }

    if (url.pathname === "/admin-manifest.webmanifest" || url.pathname === "/admin-sw.js") {
      const assetResponse = await env.ASSETS.fetch(request);
      const response = new Response(assetResponse.body, assetResponse);
      response.headers.set("cache-control", "public, max-age=300");
      response.headers.set("x-content-type-options", "nosniff");
      return response;
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    const response = await handler.fetch(sanitizedRequest, env, ctx);
    const nonceBytes = crypto.getRandomValues(new Uint8Array(18));
    const nonce = btoa(String.fromCharCode(...nonceBytes));
    const isHtml = response.headers.get("content-type")?.toLowerCase().startsWith("text/html");
    const body = isHtml
      ? (await response.text()).replace(/<script\b/g, `<script nonce="${nonce}"`)
      : response.body;
    const secured = new Response(body, response);
    secured.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    secured.headers.set("X-Content-Type-Options", "nosniff");
    secured.headers.set("X-Frame-Options", "DENY");
    secured.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    secured.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    secured.headers.set("Cross-Origin-Opener-Policy", "same-origin");
    secured.headers.set("Cross-Origin-Resource-Policy", "same-origin");
    secured.headers.set("Content-Security-Policy", `default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: https:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'nonce-${nonce}' 'strict-dynamic'; connect-src 'self'; upgrade-insecure-requests`);
    if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/customer") || url.pathname.startsWith("/api")) {
      secured.headers.set("Cache-Control", "no-store, private");
    }
    if (url.pathname === "/") secured.headers.set("Link", "<https://heatenergyanalytics.com/>; rel=\"canonical\"");
    return secured;
  },
};

export default worker;
