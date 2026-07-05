export const environment = {
  production: true,
  // Same-origin: /api and /uploads are proxied to the Cloudways backend via
  // vercel.json rewrites, so the auth cookies are first-party (third-party
  // cookie blocking in Safari/Chrome would otherwise drop them).
  apiBaseUrl: 'https://starlinger-reco-admin-client.vercel.app', // for asset URLs
  apiPath: '/api/v1', // for API endpoints
  serverUrl: 'https://starlinger-reco-admin-client.vercel.app', // for server-side rendering
  useDummyAuth: false,
  useMocks: false
};
