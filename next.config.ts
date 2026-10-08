import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The dev badge sits where the rail puts the avatar; keep it out of the way.
  devIndicators: { position: "bottom-right" },
};

export default nextConfig;
