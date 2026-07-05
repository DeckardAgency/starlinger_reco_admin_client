import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { DetailHeaderComponent } from '@app/ui-kit/molecules/detail-header/detail-header.component';
import { FormFieldComponent } from '@app/ui-kit/molecules/form-field/form-field.component';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';
import { AdminUser, AdminUserRoleType, ADMIN_USER_ROLE_OPTIONS, AdminUserRoleOption } from '@core/models/admin-user.model';
import { UserService } from '@core/services/http/user.service';
import { User } from '@core/models';
import { ToastService } from '@app/ui-kit/organisms/toast-container/toast-container.component';

const EMPTY_USER: AdminUser = {
  id: 0,
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  role: null
};

@Component({
  selector: 'app-users-edit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    BreadcrumbsComponent,
    DetailHeaderComponent,
    FormFieldComponent,
    IconComponent,
    MobileFooterComponent
  ],
  templateUrl: './users-edit.component.html',
  styleUrls: ['./users-edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersEditComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private userService = inject(UserService);
  private toastService = inject(ToastService);

  isEditMode = signal(false);
  userId = signal<string | null>(null);
  user = signal<AdminUser>(EMPTY_USER);
  isLoading = signal(false);
  loadError = signal<string | null>(null);

  // Password fields
  password = signal('');
  repeatPassword = signal('');
  showPassword = signal(false);
  showRepeatPassword = signal(false);

  // Role options
  roleOptions: AdminUserRoleOption[] = ADMIN_USER_ROLE_OPTIONS;

  // Validation state
  touched = signal<Record<string, boolean>>({});
  errors = computed(() => {
    const user = this.user();
    const errs: Record<string, string> = {};
    if (!user.firstName?.trim()) errs['firstName'] = 'First name is required';
    if (!user.lastName?.trim()) errs['lastName'] = 'Last name is required';
    if (!user.email?.trim()) errs['email'] = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) errs['email'] = 'Invalid email format';
    // Password is optional on create: leaving it empty sends an invitation email
    // and the user sets their own password via the emailed link.
    if (this.password() && this.repeatPassword() && this.password() !== this.repeatPassword()) {
      errs['repeatPassword'] = 'Passwords do not match';
    }
    return errs;
  });
  isValid = computed(() => Object.keys(this.errors()).length === 0);

  constructor() {
    this.route.params.pipe(takeUntilDestroyed()).subscribe(params => {
      const id = params['id'];
      if (id && id !== 'new') {
        this.userId.set(id);
        this.isEditMode.set(true);
        this.loadUser(id);
      } else {
        this.isEditMode.set(false);
        this.user.set({ ...EMPTY_USER });
      }
    });
  }

  ngOnInit(): void {}

  private loadUser(id: string): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.userService.getUserById(id).subscribe({
      next: (apiUser) => {
        if (apiUser) {
          this.user.set(this.mapUserToAdminUser(apiUser));
        } else {
          this.loadError.set('User not found');
        }
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loadError.set(err?.message || 'Failed to load user');
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  private mapUserToAdminUser(user: User): AdminUser {
    return {
      id: user.id,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      username: user.email ?? user.username ?? '',
      email: user.email ?? '',
      role: this.mapRolesToAdminRole(user.roles ?? [])
    };
  }

  private mapRolesToAdminRole(roles: string[]): AdminUserRoleType | null {
    if (!roles || roles.length === 0) return null;
    if (roles.includes('ROLE_ADMIN')) return 'admin';
    if (roles.includes('ROLE_CLIENT_ADMIN')) return 'client_admin';
    if (roles.includes('ROLE_CLIENT')) return 'client';
    if (roles.includes('ROLE_FINANCE')) return 'finance';
    return 'client';
  }

  private mapAdminRoleToRoles(role: AdminUserRoleType | null): string[] {
    switch (role) {
      case 'admin': return ['ROLE_ADMIN'];
      case 'client_admin': return ['ROLE_CLIENT_ADMIN'];
      case 'client': return ['ROLE_CLIENT'];
      case 'finance': return ['ROLE_FINANCE'];
      default: return ['ROLE_CLIENT'];
    }
  }

  // Validation methods
  markAllTouched(): void {
    this.touched.set({ firstName: true, lastName: true, email: true, password: true, repeatPassword: true });
  }

  markFieldTouched(field: string): void {
    this.touched.update(t => ({ ...t, [field]: true }));
  }

  getError(field: string): string {
    return this.touched()[field] ? (this.errors()[field] || '') : '';
  }

  onFirstNameChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.user.update(u => ({ ...u, firstName: input.value }));
    this.markFieldTouched('firstName');
  }

  onLastNameChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.user.update(u => ({ ...u, lastName: input.value }));
    this.markFieldTouched('lastName');
  }

  onUsernameChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.user.update(u => ({ ...u, username: input.value }));
  }

  onEmailChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.user.update(u => ({ ...u, email: input.value }));
    this.markFieldTouched('email');
  }

  onPasswordChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.password.set(input.value);
    this.markFieldTouched('password');
  }

  onRepeatPasswordChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.repeatPassword.set(input.value);
    this.markFieldTouched('repeatPassword');
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  toggleRepeatPasswordVisibility(): void {
    this.showRepeatPassword.update(v => !v);
  }

  isRoleSelected(roleId: AdminUserRoleType): boolean {
    return this.user().role === roleId;
  }

  trackByRoleId(_index: number, role: AdminUserRoleOption): AdminUserRoleType {
    return role.id;
  }

  selectRole(roleId: AdminUserRoleType): void {
    this.user.update(u => ({ ...u, role: roleId }));
  }

  onSave(): void {
    this.markAllTouched();
    if (!this.isValid()) {
      this.cdr.markForCheck();
      return;
    }

    const user = this.user();

    // New user without a password: send an invitation email instead of creating
    // the account directly — the user picks their own password via the link.
    if (!this.isEditMode() && !this.password()) {
      this.userService.inviteUser({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: this.mapAdminRoleToRoles(user.role)
      }).subscribe({
        next: () => {
          this.toastService.success(`Invitation email sent to ${user.email}`);
          this.router.navigate(['/admin/users/list']);
        },
        error: (error) => {
          console.error('Error sending invitation:', error);
          this.toastService.error('Failed to send invitation: ' + (error?.error?.detail || 'Unknown error'));
        }
      });
      return;
    }

    const data: Record<string, unknown> = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roles: this.mapAdminRoleToRoles(user.role)
    };

    // Include plainPassword only if set (for create or password change)
    if (this.password()) {
      data['plainPassword'] = this.password();
    }

    const operation = this.isEditMode() && this.userId()
      ? this.userService.updateUser(this.userId()!, data)
      : this.userService.createUser(data);

    operation.subscribe({
      next: () => {
        this.toastService.success('Saved successfully');
        this.router.navigate(['/admin/users/list']);
      },
      error: (error) => {
        console.error('Error saving user:', error);
        this.toastService.error('Failed to save user');
      }
    });
  }

  onSaveAndContinue(): void {
    this.markAllTouched();
    if (!this.isValid()) {
      this.cdr.markForCheck();
      return;
    }

    const user = this.user();

    // Invitation path: there is no user entity to continue editing yet,
    // so behave like a plain save.
    if (!this.isEditMode() && !this.password()) {
      this.onSave();
      return;
    }

    const data: Record<string, unknown> = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roles: this.mapAdminRoleToRoles(user.role)
    };

    if (this.password()) {
      data['plainPassword'] = this.password();
    }

    const operation = this.isEditMode() && this.userId()
      ? this.userService.updateUser(this.userId()!, data)
      : this.userService.createUser(data);

    operation.subscribe({
      next: (response) => {
        this.toastService.success('Saved successfully');
        if (!this.isEditMode() && response?.id) {
          this.router.navigate(['/admin/users', response.id, 'edit']);
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error saving user:', error);
        this.toastService.error('Failed to save user');
      }
    });
  }

  onDiscard(): void {
    this.router.navigate(['/admin/users/list']);
  }

  goBack(): void {
    this.router.navigate(['/admin/users/list']);
  }
}
