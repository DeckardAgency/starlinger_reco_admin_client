export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8000', // Backend API base URL
  apiPath: '/api/v1', // for API endpoints (matches inquiry_tool pattern)
  serverUrl: 'http://localhost:8000', // for server-side rendering
  useDummyAuth: false, // Disable dummy auth - use real backend
  useMocks: false // Disable mock interceptor - use real backend
};
