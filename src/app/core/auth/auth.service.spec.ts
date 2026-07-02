import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { LoggerService } from '@services/logger.service';
import { environment } from '@env/environment';

/**
 * Auth is cookie-based: the service stores no tokens, authenticates via /api/login_check
 * (which sets HttpOnly cookies and returns 204), and hydrates the user from /api/me. The
 * constructor defers a /api/me validation to a microtask, so tests flush that first.
 */
describe('AuthService (cookie auth)', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const meUrl = `${environment.apiBaseUrl}/api/me`;
  const loginUrl = `${environment.apiBaseUrl}/api/login_check`;
  const logoutUrl = `${environment.apiBaseUrl}/api/logout`;
  const USER_KEY = 'currentUser';

  const meUser = {
    id: 1, email: 'test@test.com', username: 'test',
    firstName: 'Test', lastName: 'User', roles: ['ROLE_USER'], client: null
  };

  function build(): void {
    TestBed.resetTestingModule();
    const loggerSpy = jasmine.createSpyObj('LoggerService', ['createLogger']);
    loggerSpy.createLogger.and.returnValue({
      debug() {}, info() {}, warn() {}, error() {}
    } as any);
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService, { provide: LoggerService, useValue: loggerSpy }]
    });
    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(AuthService);
  }

  // Build the service and resolve the deferred /api/me validation.
  function boot(meStatus = 401, meBody: any = {}): void {
    build();
    flushMicrotasks();
    const req = httpMock.expectOne(meUrl);
    expect(req.request.withCredentials).toBe(true);
    if (meStatus >= 400) {
      req.flush({}, { status: meStatus, statusText: 'x' });
    } else {
      req.flush(meBody);
    }
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => { try { httpMock.verify(); } catch {} localStorage.clear(); });

  it('is unauthenticated when /me returns 401', fakeAsync(() => {
    boot(401);
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.getCurrentUser()).toBeNull();
  }));

  it('login posts credentials then hydrates via /me, storing no tokens', fakeAsync(() => {
    boot(401);
    let result: boolean | undefined;
    service.login('test@test.com', 'pw').subscribe(r => (result = r));

    const loginReq = httpMock.expectOne(loginUrl);
    expect(loginReq.request.method).toBe('POST');
    expect(loginReq.request.withCredentials).toBe(true);
    loginReq.flush(null, { status: 204, statusText: 'No Content' });

    httpMock.expectOne(meUrl).flush(meUser);
    flushMicrotasks();

    expect(result).toBeTrue();
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.getCurrentUser()?.email).toBe('test@test.com');
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  }));

  it('login rejects an archived client and does not authenticate', fakeAsync(() => {
    boot(401);
    let errored = false;
    service.login('t@t.com', 'pw').subscribe({ next: () => {}, error: () => (errored = true) });
    httpMock.expectOne(loginUrl).flush(null, { status: 204, statusText: 'No Content' });
    httpMock.expectOne(meUrl).flush({
      ...meUser, client: { id: 9, name: 'X', code: 'X', isActive: false, isArchived: true }
    });
    httpMock.expectOne(logoutUrl).flush({}); // archived path triggers a server logout
    flushMicrotasks();
    expect(errored).toBeTrue();
    expect(service.isAuthenticated()).toBeFalse();
  }));

  it('login surfaces a 401 error', fakeAsync(() => {
    boot(401);
    let errored = false;
    service.login('bad', 'bad').subscribe({ next: () => {}, error: () => (errored = true) });
    httpMock.expectOne(loginUrl).flush({}, { status: 401, statusText: 'Unauthorized' });
    flushMicrotasks();
    expect(errored).toBeTrue();
  }));

  it('logout posts to /api/logout and clears the user', fakeAsync(() => {
    boot(200, meUser);
    expect(service.isAuthenticated()).toBeTrue();
    service.logout();
    httpMock.expectOne(logoutUrl).flush({});
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.getCurrentUser()).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
  }));

  it('getToken / getRefreshToken return null (tokens are HttpOnly)', fakeAsync(() => {
    boot(401);
    expect(service.getToken()).toBeNull();
    expect(service.getRefreshToken()).toBeNull();
  }));

  it('restores a cached user synchronously, then validates via /me', fakeAsync(() => {
    localStorage.setItem(USER_KEY, JSON.stringify({
      id: 1, email: 'c@c.com', firstName: 'C', lastName: 'D', roles: ['ROLE_CLIENT']
    }));
    build();
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.getCurrentUser()?.email).toBe('c@c.com');
    flushMicrotasks();
    httpMock.expectOne(meUrl).flush({ ...meUser, email: 'c@c.com' });
    expect(service.isAuthenticated()).toBeTrue();
  }));

  it('hasRole / getClientInfo / isClientArchived read the current user', fakeAsync(() => {
    boot(200, {
      ...meUser, roles: ['ROLE_ADMIN', 'ROLE_USER'],
      client: { id: 3, name: 'Acme', code: 'AC', isActive: true, isArchived: false }
    });
    expect(service.hasRole('ROLE_ADMIN')).toBeTrue();
    expect(service.hasRole('ROLE_MISSING')).toBeFalse();
    expect(service.getClientInfo()).toEqual({ name: 'Acme', code: 'AC' });
    expect(service.isClientArchived()).toBeFalse();
  }));

  it('getUserFullName falls back to email when names are empty', fakeAsync(() => {
    boot(200, { ...meUser, firstName: '', lastName: '' });
    expect(service.getUserFullName()).toBe('test@test.com');
  }));
});
