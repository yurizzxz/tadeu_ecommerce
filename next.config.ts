import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { remotePatterns: ["placehold.co", "cdn.hstatic.net", "img.advice.co.th", "media.ldlc.com", "www.bestcell.com.ec", "cdn.awsli.com.br", "img.telemart.ua", "www.discoazul.com", "insumaxinformatica.com.ar", "pcbox.vtexassets.com", "www.levix.nl"].map((hostname) => ({ protocol: "https", hostname })) },
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
