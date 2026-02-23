import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import { USER_ROLES } from '@core/models/auth.model';

/**
 * RoleGuard - Protects routes based on user roles
 * Simply redirects users to the correct area based on their role
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

        // Wrong area - redirect to correct area based on role
        return this.getHomeUrlForUser(user.roles);
    }

    /**
     * Get the home URL for a user based on their roles
     */
    getHomeUrlForUser(userRoles: string[]): UrlTree {
        if (userRoles.includes(USER_ROLES.ADMIN)) {
            return this.router.createUrlTree(['/admin/dashboard']);
        }
        if (userRoles.includes(USER_ROLES.CLIENT_ADMIN)) {
            return this.router.createUrlTree(['/customer-admin/orders']);
        }
        if (userRoles.includes(USER_ROLES.CLIENT)) {
            return this.router.createUrlTree(['/customer/dashboard']);
        }
        return this.router.createUrlTree(['/login']);
    }
}
