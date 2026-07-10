import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
  // Prevent heavy server-only packages from being bundled into the
  // Next.js server runtime. @xenova/transformers pulls in onnxruntime-node
  // (~300 MB of native binaries + WASM) which would otherwise inflate every
  // serverless function cold-start significantly.
  serverExternalPackages: ["@xenova/transformers", "onnxruntime-node", "onnxruntime-web"],

  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
};

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default bundleAnalyzer(nextConfig);
