import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@farm-lease/ui", "@farm-lease/auth"],
};

export default nextConfig;
