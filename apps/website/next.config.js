/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Don't bundle these browser-only packages on the server
      config.externals = [
        ...config.externals,
        "@browser-ai/web-llm",
        "@browser-ai/transformers-js",
        "@huggingface/transformers",
        "onnxruntime-node",
        "onnxruntime-web",
        "sharp",
      ];
    }

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    return config;
  },
  serverExternalPackages: [
    "@browser-ai/web-llm",
    "@browser-ai/transformers-js",
    "@huggingface/transformers",
  ],
  transpilePackages: [
    "@intentions/client",
    "@intentions/react",
  ],
};

module.exports = nextConfig;
