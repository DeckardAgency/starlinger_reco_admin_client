import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import { USER_ROLES } from '@core/models/auth.model';

/**
 * RoleGuard - Protects routes based on user roles.
 * This app only has an admin area: an authenticated user without the required
 * role is logged out and sent to the login page with a "no access" message.
 */
@Injectable({
    providedIn: 'root'
})
export class RoleGuard {
    constructor(
        private authService: AuthService,
        private router: Router,
    ) {}

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        // Not authenticated? Go to login
        if (!this.authService.isAuthenticated()) {
            return this.router.createUrlTree(['/login']);
        }

        const user = this.authService.getCurrentUser();
        if (!user?.roles) {
            return this.router.createUrlTree(['/login']);
        }

        // Get required roles from route
        const requiredRoles: string[] = route.data['roles'] || [USER_ROLES.USER];

        // User has access? Allow
        if (requiredRoles.some(role => user.roles.includes(role))) {
            return true;
        }

        // No access: there is no other area in this app to send the user to, so end
        // the session (otherwise /login would bounce an authenticated user around).
        this.authService.logout();
        return this.router.createUrlTree(['/login'], { queryParams: { reason: 'no-access' } });
    }
}
