import { Component, inject, DestroyRef, ChangeDetectionStrategy, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/auth/auth.service';
import { animate, style, transition, trigger } from '@angular/animations';
import { LoggerService, ScopedLogger } from '@services/logger.service';
import { InputComponent, ButtonComponent, CheckboxComponent, LinkComponent } from '@app/ui-kit';
import { USER_ROLES } from '@core/models/auth.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    InputComponent,
    ButtonComponent,
    CheckboxComponent,
    LinkComponent
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class LoginComponent {
  usernameValue = '';
  passwordValue = '';
  errorMessage = signal('');
  isLoading = signal(false);
  rememberMe = signal(false);

  private destroyRef = inject(DestroyRef);
  private logger!: ScopedLogger;

  constructor(
    private authService: AuthService,
    private router: Router,
    private loggerService: LoggerService
  ) {
    this.logger = this.loggerService.createLogger('LoginComponent');

    // If already authenticated, go to home
    if (this.authService.isAuthenticated()) {
      this.navigateToHome();
    }
  }

  onUsernameChange(value: string): void {
    this.usernameValue = value;
    if (this.errorMessage()) this.errorMessage.set('');
  }

  onPasswordChange(value: string): void {
    this.passwordValue = value;
    if (this.errorMessage()) this.errorMessage.set('');
  }

  onRememberMeChange(value: boolean): void {
    this.rememberMe.set(value);
  }

  onSubmit(): void {
    if (!this.usernameValue || !this.passwordValue) {
      this.errorMessage.set('Please enter both email and password');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.login(this.usernameValue, this.passwordValue).subscribe({
      next: (success) => {
        this.isLoading.set(false);
        if (success) {
          this.navigateToHome();
        } else {
          this.errorMessage.set('Invalid email or password');
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(this.resolveLoginError(error));
        this.logger.error('Login error', error);
      }
    });
  }

  /**
   * Surface the most specific error message available. A 401 is always invalid
   * credentials; otherwise prefer the API Platform problem+json `detail`, then the
   * error's own `message` (AuthService throws specific ones, e.g. archived account),
   * falling back to a generic string only when nothing specific is present.
   */
  private resolveLoginError(error: any): string {
    if (error?.status === 401) {
      return 'Invalid email or password';
    }
    const detail = error?.error?.detail;
    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }
    const message = error?.message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
    return 'An error occurred. Please try again.';
  }

  /**
   * Navigate to the user's home page based on role
   */
  private navigateToHome(): void {
    const user = this.authService.getCurrentUser();
    
    if (user?.roles?.includes(USER_ROLES.ADMIN)) {
      this.router.navigate(['/admin/dashboard']);
    } else if (user?.roles?.includes(USER_ROLES.CLIENT_ADMIN)) {
      this.router.navigate(['/customer-admin/orders']);
    } else if (user?.roles?.includes(USER_ROLES.CLIENT)) {
      this.router.navigate(['/customer/dashboard']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
