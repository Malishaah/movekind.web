/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "movekindb.bovision.se",
        pathname: "/media/**",
      },
    ],
    // Om du vill slippa image-opt i dev:
    // unoptimized: true,
  },
};

export default nextConfig;
