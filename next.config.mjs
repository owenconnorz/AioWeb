/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
    NEXT_PUBLIC_APP_VERSION: '2.3.0',
  },
  // Disable caching for HTML pages to ensure fresh content
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ]
  },
  images: {
    unoptimized: true,
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
