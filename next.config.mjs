/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
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
