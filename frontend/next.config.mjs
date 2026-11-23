/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/images/campus-nexus-3d-logo.svg",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
