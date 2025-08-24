/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
  async redirects() {
    return [
      { source: "/register", destination: "/signup", permanent: true },
      { source: "/regiter", destination: "/signup", permanent: true }, // typo guard
    ];
  },
};
module.exports = nextConfig;
