import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import { LoggerService, ScopedLogger } from '@services/logger.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  private logger!: ScopedLogger;

  constructor(
    private authService: AuthService,
    private router: Router,
    private loggerService: LoggerService
  ) {
    this.logger = this.loggerService.createLogger('AuthGuard');
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // First check if user is already authenticated
    if (this.authService.isAuthenticated()) {
      // Check if user's client is archived
      if (this.authService.isClientArchived()) {
        this.logger.warn('User\'s client is archived. Logging out...');
        this.authService.logout();
        return this.router.createUrlTree(['/login'], { queryParams: { reason: 'archived' } });
      }

      return true;
    }

    // Not authenticated: send to the login page
    return this.router.createUrlTree(['/login']);
  }
}
