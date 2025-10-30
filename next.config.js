/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["localhost"], // If using image URLs from your local server
  },
};

module.exports = nextConfig;
