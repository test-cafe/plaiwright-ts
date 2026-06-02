/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://cdn.dodostatic.net https://media.dodostatic.net https://github.githubassets.com https://fonts.gstatic.com",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  },
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.dodostatic.net' },
      { protocol: 'https', hostname: 'media.dodostatic.net' },
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
