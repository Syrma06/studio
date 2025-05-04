import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      { // Add freepik.es hostname
        protocol: 'https',
        hostname: 'www.freepik.es',
        port: '',
        pathname: '/**',
      },
      { // Add img.freepik.com hostname as it's often used for direct image links
        protocol: 'https',
        hostname: 'img.freepik.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
