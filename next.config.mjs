/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.dodostatic.net' },
      { protocol: 'https', hostname: 'github.githubassets.com' },
      { protocol: 'https', hostname: 'fonts.gstatic.com' },
    ],
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.md$/,
      use: 'ignore-loader',
    });
    return config;
  },
};

export default nextConfig;
