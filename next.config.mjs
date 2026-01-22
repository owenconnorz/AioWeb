/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
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
