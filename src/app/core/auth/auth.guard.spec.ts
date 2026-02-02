import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { LoginModalService } from '@services/login-modal.service';
import { LoggerService } from '@services/logger.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let loginModalService: jasmine.SpyObj<LoginModalService>;
  let loggerService: jasmine.SpyObj<LoggerService>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'isAuthenticated',
      'getCurrentUser',
      'isClientArchived',
      'logout'
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const loginModalServiceSpy = jasmine.createSpyObj('LoginModalService', ['open', 'setReturnUrl']);
    const loggerServiceSpy = jasmine.createSpyObj('LoggerService', ['createLogger']);

    loggerServiceSpy.createLogger.and.returnValue({
      debug: jasmine.createSpy('debug'),
      info: jasmine.createSpy('info'),
      warn: jasmine.createSpy('warn'),
      error: jasmine.createSpy('error')
    });

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: LoginModalService, useValue: loginModalServiceSpy },
        { provide: LoggerService, useValue: loggerServiceSpy }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    loginModalService = TestBed.inject(LoginModalService) as jasmine.SpyObj<LoginModalService>;
    loggerService = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  describe('canActivate', () => {
    let mockRoute: ActivatedRouteSnapshot;
    let mockState: RouterStateSnapshot;

    beforeEach(() => {
      mockRoute = {} as ActivatedRouteSnapshot;
      mockState = { url: '/dashboard' } as RouterStateSnapshot;
    });

    it('should allow activation when user is authenticated and client not archived', () => {
      authService.isAuthenticated.and.returnValue(true);
      authService.isClientArchived.and.returnValue(false);

      const result = guard.canActivate(mockRoute, mockState);

      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should redirect when user is not authenticated', fakeAsync(() => {
      authService.isAuthenticated.and.returnValue(false);

      const result = guard.canActivate(mockRoute, mockState);

      expect(result).toBe(false);
      expect(loginModalService.setReturnUrl).toHaveBeenCalledWith('/dashboard');

      // The loginModalService.open() is called in a setTimeout(100ms)
      tick(100);
      expect(loginModalService.open).toHaveBeenCalled();
    }));

    it('should handle archived client and logout', fakeAsync(() => {
      authService.isAuthenticated.and.returnValue(true);
      authService.isClientArchived.and.returnValue(true);

      const result = guard.canActivate(mockRoute, mockState);

      expect(result).toBe(false);
      expect(authService.logout).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/']);

      // The loginModalService.open() is called in a setTimeout(100ms)
      tick(100);
      expect(loginModalService.open).toHaveBeenCalled();
    }));
  });
});
