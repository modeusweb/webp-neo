/** @type {import('next').NextConfig} */
// For a GitHub Pages project site: https://<user>.github.io/<repo>
// Set NEXT_PUBLIC_BASE_PATH in CI (e.g. /webp-neo); leave empty for a custom domain.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const nextConfig = {
  output: 'export',
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;