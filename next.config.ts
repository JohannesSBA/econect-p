import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Allow production builds to succeed even if there are ESLint errors
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_S3_BUCKET: process.env.NEXT_PUBLIC_S3_BUCKET || process.env.BUCKET_NAME || "",
    NEXT_PUBLIC_S3_REGION: process.env.NEXT_PUBLIC_S3_REGION || process.env.AWS_REGION || "us-east-1",
  },
  images: {
    remotePatterns: [
      // Allow S3 bucket images
      {
        protocol: 'https',
        hostname: `${process.env.NEXT_PUBLIC_S3_BUCKET || process.env.BUCKET_NAME || '*'}*.amazonaws.com`,
      },
      // Common patterns when full URLs are stored
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.s3.amazonaws.com' },
      { protocol: 'https', hostname: '**.s3.*.amazonaws.com' },
      { protocol: 'https', hostname: 'localhost' },
    ],
  },
};

export default nextConfig;
