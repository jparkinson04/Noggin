import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Noggin",
    short_name: "Noggin",
    description: "A personal-brand brain for LinkedIn.",
    start_url: "/",
    display: "standalone",
    background_color: "#1a1b1e",
    theme_color: "#1a1b1e",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
