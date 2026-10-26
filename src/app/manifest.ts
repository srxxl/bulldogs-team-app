import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Brentwood Booragoon Bulldogs",
    short_name: "Bulldogs",
    start_url: "/",
    display: "standalone",
    background_color: "#eef0f6",
    theme_color: "#28357c",
    icons: [{ src: "/brand/crest.png", sizes: "1000x975", type: "image/png" }],
  };
}
