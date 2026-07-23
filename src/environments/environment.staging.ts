export const environment = {
  production: true,
  // grafit.net test server: all three apps share the parent domain, so API calls
  // are same-site and auth cookies are first-party.
  apiBaseUrl: 'https://api-webshop.grafit.net', // API + asset URLs
  apiPath: '/api/v1', // for API endpoints
  serverUrl: 'https://admin-webshop.grafit.net', // for server-side rendering
  useDummyAuth: false,
  useMocks: false
};
