/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '1mb'
    }
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com'
      },
      {
        protocol: 'https',
        hostname: 'i.scdn.co'
      },
      {
        protocol: 'https',
        hostname: 'mosaic.scdn.co'
      },
      {
        protocol: 'https',
        hostname: 'image-cdn-fa.spotifycdn.com'
      },
      {
        protocol: 'https',
        hostname: 'image-cdn-ak.spotifycdn.com'
      }
    ]
  }
};

export default nextConfig;
