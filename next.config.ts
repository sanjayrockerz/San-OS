import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent heavy server-only packages from being bundled into the
  // Next.js server runtime. @xenova/transformers pulls in onnxruntime-node
  // (~300 MB of native binaries + WASM) which would otherwise inflate every
  // serverless function cold-start significantly.
  serverExternalPackages: ["@xenova/transformers", "onnxruntime-node", "onnxruntime-web"],

  experimental: {
    // Tree-shake icon libraries and recharts so only used components end up
    // in the client bundle — cuts 30-60 kB from the JS payload.
    optimizePackageImports: ["lucide-react", "recharts"],
  },
};

export default nextConfig;
