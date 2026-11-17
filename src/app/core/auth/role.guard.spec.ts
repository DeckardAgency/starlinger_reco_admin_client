import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { RoleGuard } from './role.guard';
import { AuthService } from './auth.service';

describe('RoleGuard', () => {
  let guard: RoleGuard;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  const loginTree = {} as UrlTree;
  const route = { data: { roles: ['ROLE_ADMIN'] } } as unknown as ActivatedRouteSnapshot;
  const state = { url: '/admin/dashboard' } as RouterStateSnapshot;

  beforeEach(() => {
    authService = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'getCurrentUser', 'logout']);
    router = jasmine.createSpyObj('Router', ['createUrlTree']);
    router.createUrlTree.and.returnValue(loginTree);
    TestBed.configureTestingModule({
      providers: [
        RoleGuard,
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router }
      ]
    });
    guard = TestBed.inject(RoleGuard);
  });

  it('allows a user holding the required role', () => {
    authService.isAuthenticated.and.returnValue(true);
    authService.getCurrentUser.and.returnValue({ roles: ['ROLE_USER', 'ROLE_ADMIN'] } as any);

    expect(guard.canActivate(route, state)).toBe(true);
    expect(authService.logout).not.toHaveBeenCalled();
  });

  it('redirects an unauthenticated user to /login', () => {
    authService.isAuthenticated.and.returnValue(false);

    expect(guard.canActivate(route, state)).toBe(loginTree);
    expect(router.createUrlTree).toHaveBeenCalledOnceWith(['/login']);
    expect(authService.logout).not.toHaveBeenCalled();
  });

  it('logs out an authenticated non-admin and redirects to /login with a no-access reason', () => {
    authService.isAuthenticated.and.returnValue(true);
    authService.getCurrentUser.and.returnValue({ roles: ['ROLE_USER', 'ROLE_CLIENT_ADMIN'] } as any);

    expect(guard.canActivate(route, state)).toBe(loginTree);
    expect(authService.logout).toHaveBeenCalledTimes(1);
    expect(router.createUrlTree).toHaveBeenCalledOnceWith(['/login'], { queryParams: { reason: 'no-access' } });
  });
});
