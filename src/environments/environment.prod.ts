export const environment = {
  production: true,
  // Live host is grafit.net (same values as environment.staging.ts, which the
  // grafit deploy scripts build with): the admin calls the API through its own
  // origin so its session stays separate from the webshop's. The former Vercel +
  // Cloudways hosting was retired in Nov 2026 and is not referenced anywhere anymore.
  apiBaseUrl: 'https://admin-webshop.grafit.net', // API + asset URLs
  apiPath: '/api/v1', // for API endpoints
  serverUrl: 'https://admin-webshop.grafit.net', // for server-side rendering
  useDummyAuth: false,
  useMocks: false
};
