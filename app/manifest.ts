import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Godišnji odmori — Baseline",
    short_name: "Odmori",
    description: "Upravljanje godišnjim odmorima i odsustvima tima.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#4f46e5",
    lang: "sr",
    icons: [
      { src: "/icon-512.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-512.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
