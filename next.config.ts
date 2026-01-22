import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self';",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net;",
              "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;",
              "font-src 'self' data: https://cdn.jsdelivr.net;",
              "connect-src 'self' https://*.supabase.co https://sentry.io https://*.sentry.io wss://*.supabase.co https://cdn.jsdelivr.net https://*.jsdelivr.net;",
              "img-src 'self' data: https: blob:",
              "worker-src 'self' blob:",
            ].join(' ')
          },
        ],
      },
    ];
  },
};

export default nextConfig;
