import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { AuthService } from '@core/auth/auth.service';
import { USER_ROLES } from '@core/models';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotFoundComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  goToDashboard(): void {
    // Navigate to appropriate dashboard based on user role
    if (this.authService.hasRole(USER_ROLES.SUPER_ADMIN)) {
      this.router.navigate(['/admin/dashboard']);
    } else if (this.authService.hasRole(USER_ROLES.CLIENT_ADMIN)) {
      this.router.navigate(['/customer-admin/orders']);
    } else if (this.authService.hasRole(USER_ROLES.CLIENT)) {
      this.router.navigate(['/customer/dashboard']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
