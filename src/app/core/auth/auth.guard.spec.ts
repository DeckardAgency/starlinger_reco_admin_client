import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { LoggerService } from '@services/logger.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let loggerService: jasmine.SpyObj<LoggerService>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'isAuthenticated',
      'getCurrentUser',
      'isClientArchived',
      'logout'
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree']);
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
        { provide: LoggerService, useValue: loggerServiceSpy }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
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

    it('should redirect to /login when user is not authenticated', () => {
      const loginTree = {} as UrlTree;
      router.createUrlTree.and.returnValue(loginTree);
      authService.isAuthenticated.and.returnValue(false);

      const result = guard.canActivate(mockRoute, mockState);

      expect(result).toBe(loginTree);
      expect(router.createUrlTree).toHaveBeenCalledOnceWith(['/login']);
    });

    it('should log out an archived client and redirect to /login with the reason', () => {
      const loginTree = {} as UrlTree;
      router.createUrlTree.and.returnValue(loginTree);
      authService.isAuthenticated.and.returnValue(true);
      authService.isClientArchived.and.returnValue(true);

      const result = guard.canActivate(mockRoute, mockState);

      expect(result).toBe(loginTree);
      expect(authService.logout).toHaveBeenCalled();
      expect(router.createUrlTree).toHaveBeenCalledOnceWith(['/login'], { queryParams: { reason: 'archived' } });
    });
  });
});
