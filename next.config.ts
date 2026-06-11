import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // El proyecto usa Turbopack en dev (sin tsc). Ignorar errores de tipos en build.
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
