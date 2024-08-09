import withSerwistInit from '@serwist/next'
import { ACTIONS_CORS_HEADERS } from '@solana/actions'

const withSerwist = withSerwistInit({
  cacheOnNavigation: true,
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
})

const corsHeaders = [
  { key: 'Access-Control-Allow-Credentials', value: 'true' },
  { key: 'Access-Control-Allow-Origin', value: '*' },
  { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
  { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
    instrumentationHook: true,
  },
  compiler: {
    styledComponents: {
      minify: true,
      transpileTemplateLiterals: true,
      pure: true,
    },
  },
  async headers() {
    return [
      {
        source: '/api/actions/:path*',
        headers: Object.entries(ACTIONS_CORS_HEADERS).map(([key, value]) => ({ key, value })),
      },
      {
        source: '/actions.json',
        headers: corsHeaders,
      },
    ]
  },
}

export default withSerwist(nextConfig)
