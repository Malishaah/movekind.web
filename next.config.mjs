/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'localhost', port: '44367', pathname: '/media/**' },
      // lägg bara till http-raden om du faktiskt servar media över http också
      // { protocol: 'http', hostname: 'localhost', port: '44367', pathname: '/media/**' }
    ],
    // DEV-workaround om cert strular (slår av optimering):
    // unoptimized: true,
  },
};

export default nextConfig;
