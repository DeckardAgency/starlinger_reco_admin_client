import { Component, ChangeDetectionStrategy, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';
import { InputComponent, ButtonComponent, LinkComponent } from '@app/ui-kit';
import { LoggerService, ScopedLogger } from '@services/logger.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    InputComponent,
    ButtonComponent,
    LinkComponent
  ],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
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
export class ForgotPasswordComponent {
  usernameValue = '';
  isLoading = signal(false);
  isSubmitted = signal(false);
  errorMessage = signal('');

  private logger: ScopedLogger;
  private destroyRef = inject(DestroyRef);

  constructor(
    private router: Router,
    private loggerService: LoggerService
  ) {
    this.logger = this.loggerService.createLogger('ForgotPasswordComponent');
  }

  onUsernameChange(value: string): void {
    this.usernameValue = value;
    if (this.errorMessage()) {
      this.errorMessage.set('');
    }
  }

  onSubmit(): void {
    const usernameVal = this.usernameValue;

    if (!usernameVal) {
      this.errorMessage.set('Please enter your username or email');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    // Simulate API call - replace with actual service call
    setTimeout(() => {
      this.isLoading.set(false);
      this.isSubmitted.set(true);
      this.logger.debug('Password reset requested for:', usernameVal);
    }, 1500);
  }

  backToLogin(): void {
    this.router.navigate(['/login']);
  }
}

