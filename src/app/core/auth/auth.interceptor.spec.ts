import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { AuthInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { TokenRefreshService } from '@services/http/token-refresh.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('AuthInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let authService: jasmine.SpyObj<AuthService>;
  let tokenRefreshService: jasmine.SpyObj<TokenRefreshService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken', 'logout']);
    const tokenRefreshServiceSpy = jasmine.createSpyObj('TokenRefreshService', ['refreshToken']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true
        },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: TokenRefreshService, useValue: tokenRefreshServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    tokenRefreshService = TestBed.inject(TokenRefreshService) as jasmine.SpyObj<TokenRefreshService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should add Authorization header when token exists', () => {
    const token = 'test-token-123';
    authService.getToken.and.returnValue(token);

    httpClient.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(true);
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
    req.flush({});
  });

  it('should not add Authorization header when token does not exist', () => {
    authService.getToken.and.returnValue(null);

    httpClient.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should not add Authorization header for login_check endpoint', () => {
    const token = 'test-token-123';
    authService.getToken.and.returnValue(token);

    httpClient.post('/api/login_check', { username: 'test@test.com', password: 'password' }).subscribe();

    const req = httpMock.expectOne('/api/login_check');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should not add Authorization header for token refresh endpoint', () => {
    const token = 'test-token-123';
    authService.getToken.and.returnValue(token);

    httpClient.post('/api/token/refresh', { refresh_token: 'refresh' }).subscribe();

    const req = httpMock.expectOne('/api/token/refresh');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should handle 401 error and attempt token refresh', (done) => {
    authService.getToken.and.returnValue('expired-token');
    // Token refresh fails
    tokenRefreshService.refreshToken.and.returnValue(throwError(() => new Error('Refresh failed')));

    httpClient.get('/api/protected').subscribe({
      next: () => fail('Should not succeed'),
      error: () => {
        expect(tokenRefreshService.refreshToken).toHaveBeenCalled();
        expect(authService.logout).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
        done();
      }
    });

    const req = httpMock.expectOne('/api/protected');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
  });

  it('should retry request with new token after successful refresh', (done) => {
    const originalToken = 'expired-token';
    const newToken = 'new-token';

    authService.getToken.and.returnValue(originalToken);
    tokenRefreshService.refreshToken.and.returnValue(of({ token: newToken, refresh_token: 'new-refresh' }));

    const mockData = { success: true };

    httpClient.get('/api/protected').subscribe({
      next: (data) => {
        expect(data).toEqual(mockData);
        expect(tokenRefreshService.refreshToken).toHaveBeenCalled();
        done();
      },
      error: () => fail('Should not error')
    });

    // First request returns 401
    const req1 = httpMock.expectOne('/api/protected');
    req1.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    // Retry request with new token
    const req2 = httpMock.expectOne('/api/protected');
    expect(req2.request.headers.get('Authorization')).toBe(`Bearer ${newToken}`);
    req2.flush(mockData);
  });

  it('should pass through non-401 errors without logout', (done) => {
    authService.getToken.and.returnValue('valid-token');

    httpClient.get('/api/server-error').subscribe({
      next: () => fail('Should not succeed'),
      error: (error) => {
        expect(error.status).toBe(500);
        expect(authService.logout).not.toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      }
    });

    const req = httpMock.expectOne('/api/server-error');
    req.flush({ message: 'Server Error' }, { status: 500, statusText: 'Internal Server Error' });
  });

  it('should pass through successful requests', (done) => {
    authService.getToken.and.returnValue('valid-token');

    const mockData = { id: 1, name: 'Test' };

    httpClient.get('/api/data').subscribe({
      next: (data) => {
        expect(data).toEqual(mockData);
        done();
      },
      error: () => fail('Should not error')
    });

    const req = httpMock.expectOne('/api/data');
    expect(req.request.headers.get('Authorization')).toBe('Bearer valid-token');
    req.flush(mockData);
  });
});
