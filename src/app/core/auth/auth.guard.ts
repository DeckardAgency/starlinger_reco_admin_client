import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import { LoginModalService } from '@services/login-modal.service';
import { LoggerService, ScopedLogger } from '@services/logger.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  private logger!: ScopedLogger;

  constructor(
    private authService: AuthService,
    private router: Router,
    private loginModalService: LoginModalService,
    private loggerService: LoggerService
  ) {
    this.logger = this.loggerService.createLogger('AuthGuard');
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // TODO: Remove this bypass before production
    return true; // DEV BYPASS - skip auth check

    /* DEV BYPASS - Original code commented out
    // First check if user is already authenticated
    if (this.authService.isAuthenticated()) {
      // Check if user's client is archived
      if (this.authService.isClientArchived()) {
        this.logger.warn('User\'s client is archived. Logging out...');
        this.authService.logout();
        this.router.navigate(['/']);

        // Show login modal with message
        setTimeout(() => {
          this.loginModalService.open();
          // You could add a notification here if you have a notification service
        }, 100);

        return false;
      }

      return true;
    }

    // Store the attempted URL for redirecting after login
    const returnUrl = state.url;
    this.loginModalService.setReturnUrl(returnUrl);

    // Delay opening the modal slightly to avoid showing it during page refresh
    // when authentication might still be in progress
    setTimeout(() => {
      if (!this.authService.isAuthenticated()) {
        this.loginModalService.open();
      }
    }, 100);

    // Return false to prevent navigation when not authenticated
    return false;
    */
  }
}
