import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    // Two independently validated catalog images (5 MB each) plus form data.
    serverActions: {
      bodySizeLimit: "11mb",
    },
  },
  images: {
    qualities: [70, 75, 90, 92],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "s4.anilist.co",
        pathname: "/file/anilistcdn/**",
      },
      {
        protocol: "https",
        hostname: "wsmfxmwztmyzdthvehee.supabase.co",
        pathname: "/storage/v1/object/public/anime-media/**",
      },
    ],
  },
};

export default nextConfig;
