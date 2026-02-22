import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        id: "/",
        name: "Going - B2B Delivery",
        short_name: "Going",
        description: "Plataforma de entregas B2B",
        start_url: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#ffffff",
        theme_color: "#ea580c",
        icons: [
            { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
            { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
            { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        categories: ["business", "productivity"],
    };
}
