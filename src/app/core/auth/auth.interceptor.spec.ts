import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { AuthInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { TokenRefreshService } from '@services/http/token-refresh.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('AuthInterceptor (cookie auth)', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let authService: jasmine.SpyObj<AuthService>;
  let tokenRefreshService: jasmine.SpyObj<TokenRefreshService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);
    const tokenRefreshServiceSpy = jasmine.createSpyObj('TokenRefreshService', ['refreshToken']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
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

  afterEach(() => httpMock.verify());

  it('sends requests with credentials and no Authorization header', () => {
    httpClient.get('/api/test').subscribe();
    const req = httpMock.expectOne('/api/test');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('passes auth endpoints through (still credentialed, no refresh loop)', () => {
    httpClient.post('/api/login_check', {}).subscribe();
    const req = httpMock.expectOne('/api/login_check');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({}, { status: 204, statusText: 'No Content' });
  });

  it('on 401 attempts a cookie refresh and replays the request', (done) => {
    tokenRefreshService.refreshToken.and.returnValue(of({}));

    httpClient.get('/api/protected').subscribe({
      next: data => {
        expect(data).toEqual({ ok: true });
        expect(tokenRefreshService.refreshToken).toHaveBeenCalled();
        done();
      },
      error: () => fail('should not error')
    });

    httpMock.expectOne('/api/protected').flush({}, { status: 401, statusText: 'Unauthorized' });
    // Replayed request (no token header — auth is via the rotated cookie)
    const retry = httpMock.expectOne('/api/protected');
    expect(retry.request.withCredentials).toBe(true);
    expect(retry.request.headers.has('Authorization')).toBe(false);
    retry.flush({ ok: true });
  });

  it('on refresh failure logs out and redirects to /login', (done) => {
    tokenRefreshService.refreshToken.and.returnValue(throwError(() => new Error('refresh failed')));

    httpClient.get('/api/protected').subscribe({
      next: () => fail('should not succeed'),
      error: () => {
        expect(authService.logout).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
        done();
      }
    });

    httpMock.expectOne('/api/protected').flush({}, { status: 401, statusText: 'Unauthorized' });
  });

  it('passes non-401 errors through without logout', (done) => {
    httpClient.get('/api/server-error').subscribe({
      next: () => fail('should not succeed'),
      error: error => {
        expect(error.status).toBe(500);
        expect(authService.logout).not.toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      }
    });

    httpMock.expectOne('/api/server-error').flush({}, { status: 500, statusText: 'Server Error' });
  });

  it('passes successful requests through', (done) => {
    httpClient.get('/api/data').subscribe({
      next: data => { expect(data).toEqual({ id: 1 }); done(); },
      error: () => fail('should not error')
    });
    httpMock.expectOne('/api/data').flush({ id: 1 });
  });
});
