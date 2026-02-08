import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse
} from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import {
  mockUsers,
  mockClients,
  mockProducts,
  mockOrders,
  mockPerformanceData,
  mockDashboardPerformance,
  mockOrderStatusDistribution,
  mockContacts,
  mockDiscounts,
  mockUserList,
  mockCountries,
  mockTaxTypes,
  mockPaymentTypes,
  mockDeliveryTypes,
  mockWarehouses,
  mockDeliveryPrices,
  mockFuelSurcharges
} from './mock-data';

@Injectable()
export class MockInterceptor implements HttpInterceptor {
  
  // Simulate network delay (ms)
  private mockDelay = 300;

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const { url, method, body, params } = request;

    // Extract path from URL and append query params
    let path = this.extractPath(url);

    // Append query params from HttpParams object (Angular passes them separately)
    if (params && params.keys().length > 0) {
      const queryString = params.toString();
      path = path.includes('?') ? `${path}&${queryString}` : `${path}?${queryString}`;
    }

    // console.log(`[MockInterceptor] ${method} ${path}`);

    // Route to appropriate mock handler
    const mockResponse = this.handleRequest(method, path, body);

    if (mockResponse !== null) {
      return of(new HttpResponse({
        status: 200,
        body: mockResponse
      })).pipe(delay(this.mockDelay));
    }

    // If no mock found, pass through (will likely fail without backend)
    console.warn(`[MockInterceptor] No mock for: ${method} ${path}`);
    return next.handle(request);
  }

  private extractPath(url: string): string {
    // Remove base URL and keep just the path including query params
    // This regex captures /api/v1/... including any query string
    try {
      const urlObj = new URL(url);
      return urlObj.pathname + urlObj.search;
    } catch {
      // Fallback for relative URLs
      const match = url.match(/\/api\/v1\/[^?]*(\?.*)?/);
    return match ? match[0] : url;
    }
  }

  private handleRequest(method: string, path: string, body: any): any {
    // ==========================================================================
    // AUTHENTICATION
    // ==========================================================================
    if (path.includes('/login_check') && method === 'POST') {
      return this.handleLogin(body);
    }

    if (path.includes('/token/refresh') && method === 'POST') {
      return this.handleTokenRefresh();
    }

    // ==========================================================================
    // USERS / ME
    // ==========================================================================
    if (path.match(/\/users\/me$/) && method === 'GET') {
      return this.getCurrentUser();
    }

    if (path.match(/\/users/) && method === 'GET') {
      // Check for email query parameter
      const emailMatch = path.match(/email=([^&]+)/);
      if (emailMatch) {
        return this.getUserByEmail(decodeURIComponent(emailMatch[1]));
      }
      return this.getUsers();
    }

    // ==========================================================================
    // DASHBOARD
    // ==========================================================================
    if (path.includes('/dashboard/performance') && method === 'GET') {
      return mockDashboardPerformance;
    }

    if (path.includes('/dashboard/order-status-distribution') && method === 'GET') {
      return mockOrderStatusDistribution;
    }

    // ==========================================================================
    // ORDERS
    // ==========================================================================
    if (path.match(/\/orders$/) && method === 'GET') {
      return this.paginatedResponse(mockOrders, '/api/v1/orders');
    }

    if (path.match(/\/orders\/[^\/]+$/) && method === 'GET') {
      const id = path.split('/').pop();
      return mockOrders.find(o => o.id === id) || mockOrders[0];
    }

    // ==========================================================================
    // PRODUCTS
    // ==========================================================================
    if (path.match(/\/products$/) && method === 'GET') {
      return this.paginatedResponse(mockProducts, '/api/v1/products');
    }

    if (path.match(/\/products\/[^\/]+$/) && method === 'GET') {
      const id = path.split('/').pop();
      return mockProducts.find(p => p.id === id) || mockProducts[0];
    }

    // ==========================================================================
    // CLIENTS / ACCOUNTS
    // ==========================================================================
    if (path.match(/\/clients$/) && method === 'GET') {
      return this.paginatedResponse(mockClients, '/api/v1/clients');
    }

    if (path.match(/\/clients\/[^\/]+$/) && method === 'GET') {
      const id = path.split('/').pop();
      return mockClients.find(c => c.id === id) || mockClients[0];
    }

    // ==========================================================================
    // CONTACTS
    // ==========================================================================
    if (path.match(/\/contacts$/) && method === 'GET') {
      return this.paginatedResponse(mockContacts, '/api/v1/contacts');
    }

    // ==========================================================================
    // DISCOUNTS
    // ==========================================================================
    if (path.match(/\/discounts$/) && method === 'GET') {
      return this.paginatedResponse(mockDiscounts, '/api/v1/discounts');
    }

    // ==========================================================================
    // COUNTRIES
    // ==========================================================================
    if (path.match(/\/countries$/) && method === 'GET') {
      return this.paginatedResponse(mockCountries, '/api/v1/countries');
    }

    if (path.match(/\/countries\/[^\/]+$/) && method === 'GET') {
      const id = path.split('/').pop();
      return mockCountries.find(c => c.id === id) || mockCountries[0];
    }

    // ==========================================================================
    // TAX TYPES
    // ==========================================================================
    if (path.match(/\/tax-types$/) && method === 'GET') {
      return this.paginatedResponse(mockTaxTypes, '/api/v1/tax-types');
    }

    if (path.match(/\/tax-types\/[^\/]+$/) && method === 'GET') {
      const id = path.split('/').pop();
      return mockTaxTypes.find(t => t.id === id) || mockTaxTypes[0];
    }

    // ==========================================================================
    // PAYMENT TYPES
    // ==========================================================================
    if (path.match(/\/payment-types$/) && method === 'GET') {
      return this.paginatedResponse(mockPaymentTypes, '/api/v1/payment-types');
    }

    if (path.match(/\/payment-types\/[^\/]+$/) && method === 'GET') {
      const id = path.split('/').pop();
      return mockPaymentTypes.find(p => p.id === id) || mockPaymentTypes[0];
    }

    // ==========================================================================
    // DELIVERY TYPES
    // ==========================================================================
    if (path.match(/\/delivery-types$/) && method === 'GET') {
      return this.paginatedResponse(mockDeliveryTypes, '/api/v1/delivery-types');
    }

    if (path.match(/\/delivery-types\/[^\/]+$/) && method === 'GET') {
      const id = path.split('/').pop();
      return mockDeliveryTypes.find(d => d.id === id) || mockDeliveryTypes[0];
    }

    // ==========================================================================
    // WAREHOUSES
    // ==========================================================================
    if (path.match(/\/warehouses$/) && method === 'GET') {
      return this.paginatedResponse(mockWarehouses, '/api/v1/warehouses');
    }

    if (path.match(/\/warehouses\/[^\/]+$/) && method === 'GET') {
      const id = path.split('/').pop();
      return mockWarehouses.find(w => w.id === id) || mockWarehouses[0];
    }

    // ==========================================================================
    // DELIVERY PRICES
    // ==========================================================================
    if (path.match(/\/delivery-prices$/) && method === 'GET') {
      return this.paginatedResponse(mockDeliveryPrices, '/api/v1/delivery-prices');
    }

    if (path.match(/\/delivery-prices\/[^\/]+$/) && method === 'GET') {
      const id = path.split('/').pop();
      return mockDeliveryPrices.find(dp => dp.id === id) || mockDeliveryPrices[0];
    }

    // ==========================================================================
    // FUEL SURCHARGES
    // ==========================================================================
    if (path.match(/\/fuel-surcharges$/) && method === 'GET') {
      return this.paginatedResponse(mockFuelSurcharges, '/api/v1/fuel-surcharges');
    }

    if (path.match(/\/fuel-surcharges\/[^\/]+$/) && method === 'GET') {
      const id = path.split('/').pop();
      return mockFuelSurcharges.find(fs => fs.id === id) || mockFuelSurcharges[0];
    }

    // No mock found
    return null;
  }

  // ===========================================================================
  // AUTH HANDLERS
  // ===========================================================================

  private handleLogin(body: any): any {
    const { username, password } = body;

    let user;

    // Standard test password for all RECO test users
    if (password === 'recouser123!') {
      switch (username) {
        case 'super@starlinger.com':
          user = mockUsers.superAdmin;
          break;
        case 'admin@starlinger.com':
          user = { ...mockUsers.superAdmin, email: 'admin@starlinger.com', roles: ['ROLE_ADMIN'] };
          break;
        case 'clientadmin@starlinger.com':
          user = mockUsers.customerAdmin;
          break;
        case 'recouser@starlinger.com':
          user = mockUsers.customer;
          break;
        case 'viewer@starlinger.com':
          user = { ...mockUsers.customer, email: 'viewer@starlinger.com', roles: ['ROLE_VIEWER'] };
          break;
        default:
          return { error: 'Invalid credentials', code: 401 };
      }
    }
    // Legacy test credentials (password is 'password123')
    else if (password === 'password123') {
      switch (username) {
        case 'super@test.com':
          user = mockUsers.superAdmin;
          break;
        case 'admin@test.com':
          user = mockUsers.customerAdmin;
          break;
        case 'user@test.com':
          user = mockUsers.customer;
          break;
        default:
          return { error: 'Invalid credentials', code: 401 };
      }
    } else {
      return { error: 'Invalid credentials', code: 401 };
    }

    // Generate mock JWT token
    const token = this.generateMockToken(user);

    return {
      token: token,
      refresh_token: 'mock-refresh-token-' + Date.now()
    };
  }

  private handleTokenRefresh(): any {
    // Just return a new token
    const user = this.getStoredUser();
    if (user) {
      return {
        token: this.generateMockToken(user),
        refresh_token: 'mock-refresh-token-' + Date.now()
      };
    }
    return { error: 'No user session', code: 401 };
  }

  private generateMockToken(user: any): string {
    // Create a mock JWT-like token (not a real JWT, just for testing)
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      username: user.email,
      email: user.email,
      roles: user.roles,
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      iat: Math.floor(Date.now() / 1000)
    }));
    const signature = btoa('mock-signature');
    
    return `${header}.${payload}.${signature}`;
  }

  // ===========================================================================
  // USER HANDLERS
  // ===========================================================================

  private getCurrentUser(): any {
    // Try to get user from stored token
    const user = this.getStoredUser();
    return user || mockUsers.customer;
  }

  private getStoredUser(): any {
    // This is a simplified approach - in real app, decode from token
    // Auth service uses 'auth_token' as the key
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          // Find matching user - new test users
          if (payload.email === 'super@starlinger.com') return mockUsers.superAdmin;
          if (payload.email === 'admin@starlinger.com') return { ...mockUsers.superAdmin, email: 'admin@starlinger.com', roles: ['ROLE_ADMIN'] };
          if (payload.email === 'clientadmin@starlinger.com') return mockUsers.customerAdmin;
          if (payload.email === 'recouser@starlinger.com') return mockUsers.customer;
          if (payload.email === 'viewer@starlinger.com') return { ...mockUsers.customer, email: 'viewer@starlinger.com', roles: ['ROLE_VIEWER'] };
          // Legacy test users
          if (payload.email === 'super@test.com') return mockUsers.superAdmin;
          if (payload.email === 'admin@test.com') return mockUsers.customerAdmin;
          if (payload.email === 'user@test.com') return mockUsers.customer;
        }
      } catch (e) {
        // Token parsing failed
      }
    }
    return null;
  }

  private getUsers(): any {
    return this.paginatedResponse(mockUserList, '/api/v1/users');
  }

  private getUserByEmail(email: string): any {
    // Find user by email
    let user;
    switch (email) {
      // New test users
      case 'super@starlinger.com':
        user = mockUsers.superAdmin;
        break;
      case 'admin@starlinger.com':
        user = { ...mockUsers.superAdmin, email: 'admin@starlinger.com', roles: ['ROLE_ADMIN'] };
        break;
      case 'clientadmin@starlinger.com':
        user = mockUsers.customerAdmin;
        break;
      case 'recouser@starlinger.com':
        user = mockUsers.customer;
        break;
      case 'viewer@starlinger.com':
        user = { ...mockUsers.customer, email: 'viewer@starlinger.com', roles: ['ROLE_VIEWER'] };
        break;
      // Legacy test users
      case 'super@test.com':
        user = mockUsers.superAdmin;
        break;
      case 'admin@test.com':
        user = mockUsers.customerAdmin;
        break;
      case 'user@test.com':
        user = mockUsers.customer;
        break;
      default:
        // Try to find in user list
        user = mockUserList.find(u => u.email === email);
    }

    if (user) {
      return this.paginatedResponse([user], '/api/v1/users');
    }
    
    // Return empty collection if not found
    return this.paginatedResponse([], '/api/v1/users');
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  private paginatedResponse(items: any[], basePath: string, page: number = 1, itemsPerPage: number = 30): any {
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return {
      '@context': '/api/v1/contexts/Collection',
      '@id': basePath,
      '@type': 'hydra:Collection',
      'totalItems': totalItems,
      'member': items,
      'view': {
        '@id': `${basePath}?page=${page}`,
        '@type': 'hydra:PartialCollectionView',
        'first': `${basePath}?page=1`,
        'last': `${basePath}?page=${totalPages}`,
        'next': page < totalPages ? `${basePath}?page=${page + 1}` : undefined
      }
    };
  }
}

