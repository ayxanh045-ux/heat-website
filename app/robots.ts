import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
          "/customer",
          "/customer/*",
          "/app",
          "/app/*",
          "/api/*",
        ],
      },
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "PerplexityBot",
          "ClaudeBot",
          "anthropic-ai",
          "Google-Extended",
          "Applebot",
          "Applebot-Extended",
          "cohere-ai",
        ],
        allow: "/",
        disallow: [
          "/admin/*",
          "/customer/*",
          "/app/*",
          "/api/*",
        ],
      },
    ],
    sitemap: "https://heatenergyanalytics.com/sitemap.xml",
    host: "https://heatenergyanalytics.com",
  };
}
