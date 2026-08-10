import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HEAT Energy Analytics", short_name: "HEAT",
    description: "Müştərilər üçün enerji monitorinqi və analitikası",
    start_url: "/customer", display: "standalone", background_color: "#07080a", theme_color: "#07080a",
    orientation: "portrait-primary",
    icons: [
      { src: "/app-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/app-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
