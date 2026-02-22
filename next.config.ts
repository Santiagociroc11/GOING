import type { NextConfig } from "next";
import { spawnSync } from "node:child_process";
import withSerwistInit from "@serwist/next";

const revision =
    spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() || "dev";

const withSerwist = withSerwistInit({
    swSrc: "src/app/sw.ts",
    swDest: "public/sw.js",
    additionalPrecacheEntries: [{ url: "/~offline", revision }],
});

const nextConfig: NextConfig = {
    output: "standalone",
    serverExternalPackages: ["mongoose", "mongodb"],
};

export default withSerwist(nextConfig);
