import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["exceljs", "bcryptjs"],
  experimental: {
    serverActions: { bodySizeLimit: "8mb" }, // envoi des photos d'articles
  },
};

export default nextConfig;
