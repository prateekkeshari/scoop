/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['framerusercontent.com', 'cdn.prod.website-files.com'],
  },
  async headers() {
    return [
      {
        source: '/api/qr',
        headers: [
          {
            key: 'Content-Type',
            value: 'image/png',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
