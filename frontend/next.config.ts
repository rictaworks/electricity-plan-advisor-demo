import type { NextConfig } from "next";

/**
 * 静的書き出し（out/）を Cloudflare Workers Assets で配信する。
 * 画面はすべて Client Component で、API Routes・SSR は使わない。
 * API は同一オリジンの /api/* を Worker が処理するため、rewrites は持たない。
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
};

export default nextConfig;
