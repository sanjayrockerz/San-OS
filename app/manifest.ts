import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SanOS — Personal Engineering OS",
    short_name: "SanOS",
    description: "Your personal DSA & engineering operating system.",
    start_url: "/overview",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#7c7dff",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    categories: ["education", "productivity"],
    shortcuts: [
      {
        name: "Overview",
        short_name: "Home",
        description: "Open your dashboard",
        url: "/overview",
      },
      {
        name: "Add Problem",
        short_name: "Add",
        description: "Log a new problem",
        url: "/problems/new",
      },
      {
        name: "Revision",
        short_name: "Revise",
        description: "Start revision session",
        url: "/revision",
      },
    ],
  };
}
