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
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

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
          "Sitemap: https://heatenergyanalytics.com/sitemap.xml",
          "",
        ].join("\n"),
        { headers: { "content-type": "text/plain; charset=utf-8" } },
      );
    }

    if (url.pathname === "/sitemap.xml") {
      return new Response(
        [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          "  <url>",
          "    <loc>https://heatenergyanalytics.com/</loc>",
          "    <lastmod>2026-08-11</lastmod>",
          "    <changefreq>weekly</changefreq>",
          "    <priority>1.0</priority>",
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

    const response = await handler.fetch(request, env, ctx);
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
    if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/customer")) {
      secured.headers.set("Cache-Control", "no-store, private");
    }
    if (url.pathname === "/") secured.headers.set("Link", "<https://heatenergyanalytics.com/>; rel=\"canonical\"");
    return secured;
  },
};

export default worker;
