/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
    NEXT_PUBLIC_APP_VERSION: '2.4.0',
  },
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/:path*.html',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, must-revalidate',
          },
        ],
      },
    ]
  },
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.redgifs.com',
      },
      {
        protocol: 'https',
        hostname: 'thumbs.redgifs.com',
      },
      {
        protocol: 'https',
        hostname: 'cdni.pornpics.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pornpics.com',
      },
      {
        protocol: 'https',
        hostname: 'www.pornpics.com',
      },
    ],
  },
}

export default nextConfig
