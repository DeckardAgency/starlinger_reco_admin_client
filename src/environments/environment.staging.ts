export const environment = {
  production: true,
  // grafit.net test server. The admin calls the API through ITS OWN origin
  // (nginx serves /api and /uploads from the backend on this vhost): the BEARER
  // cookie is host-only, so this keeps the admin session in a separate cookie
  // jar from the webshop's (which uses api-webshop.grafit.net). On a non-PSL
  // parent domain both apps are the same "site", so sharing one API host would
  // share one session — logging into one app would switch the user in the other.
  apiBaseUrl: 'https://admin-webshop.grafit.net', // API + asset URLs
  apiPath: '/api/v1', // for API endpoints
  serverUrl: 'https://admin-webshop.grafit.net', // for server-side rendering
  useDummyAuth: false,
  useMocks: false
};
