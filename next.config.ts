import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
        config.watchOptions = {
            ...config.watchOptions,
            ignored: [
                ...((config.watchOptions.ignored as string[]) || []),
                '**/checked-in-data.json',
            ],
        };
    }
    return config;
  }
};

export default nextConfig;
