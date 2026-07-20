export const environment = {
  production: true,
  // Direct cross-site API calls (no Vercel /api proxy — its datacenter egress IPs
  // tripped Imunify360 bot-protection on the host). Auth relies on the backend
  // issuing SameSite=None; Partitioned (CHIPS) cookies, which survive third-party
  // cookie blocking in Safari/Chrome-incognito.
  apiBaseUrl: 'https://phpstack-675879-6201972.cloudwaysapps.com', // API + asset URLs
  apiPath: '/api/v1', // for API endpoints
  serverUrl: 'https://starlinger-reco-admin-client.vercel.app', // for server-side rendering
  useDummyAuth: false,
  useMocks: false
};
