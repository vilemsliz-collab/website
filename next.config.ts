import type { NextConfig } from 'next'

const securityHeaders = [
  { key: 'X-Content-Type-Options',  value: 'nosniff' },
  { key: 'X-DNS-Prefetch-Control',  value: 'on' },
  { key: 'Referrer-Policy',         value: 'origin-when-cross-origin' },
  { key: 'X-Frame-Options',         value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy',      value: 'camera=(), microphone=(), geolocation=()' },
]

// SSG case routes never change without a redeploy → cacheable forever at the
// CDN. The browser revalidates (max-age=0) so a redeploy is picked up
// immediately, but s-maxage keeps repeat hits free for everyone behind the CDN.
const caseCacheHeaders = [
  { key: 'Cache-Control', value: 'public, max-age=0, s-maxage=31536000, must-revalidate' },
]

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    optimizePackageImports: ['framer-motion', 'lenis'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  async headers() {
    return [
      { source: '/(.*)',          headers: securityHeaders },
      { source: '/cases/:slug*',  headers: caseCacheHeaders },
    ]
  },
}

export default nextConfig
