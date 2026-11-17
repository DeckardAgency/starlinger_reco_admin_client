import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';

import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { DetailHeaderComponent } from '@app/ui-kit/molecules/detail-header/detail-header.component';
import { FormFieldComponent } from '@app/ui-kit/molecules/form-field/form-field.component';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';
import { AdminUser, AdminUserRoleType, ADMIN_USER_ROLE_OPTIONS, AdminUserRoleOption } from '@core/models/admin-user.model';
import { UserService } from '@core/services/http/user.service';
import { User } from '@core/models';
import { ToastService } from '@app/ui-kit/organisms/toast-container/toast-container.component';
import { LoggerService } from '@core/services/logger.service';
import { AuthService } from '@core/auth/auth.service';
import { passwordPolicyError } from '@core/auth/password-policy';

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
  private logger = inject(LoggerService);
  private authService = inject(AuthService);

  isEditMode = signal(false);
  userId = signal<string | null>(null);
  user = signal<AdminUser>(EMPTY_USER);
  isLoading = signal(false);
  isSaving = signal(false);
  loadError = signal<string | null>(null);

  // Password fields
  password = signal('');
  repeatPassword = signal('');
  showPassword = signal(false);
  showRepeatPassword = signal(false);
  // Only asked for (and sent) when the logged-in admin changes their OWN password
  currentPassword = signal('');
  showCurrentPassword = signal(false);

  /** True when the logged-in admin is editing their own account. */
  isSelf = computed(() => {
    const me = this.authService.getCurrentUser();
    return this.isEditMode() && !!me && String(me.id) === String(this.userId());
  });

  // Field errors reported by the backend (422 violations), keyed like `errors`
  serverErrors = signal<Record<string, string>>({});

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
    // Password is optional: left empty, create sends an invitation email (the user
    // sets their own password via the link) and edit leaves the password unchanged.
    const password = this.password();
    if (password) {
      const policyError = passwordPolicyError(password);
      if (policyError) errs['password'] = policyError;
      if (password !== this.repeatPassword()) errs['repeatPassword'] = 'Passwords do not match';
      if (this.isSelf() && !this.currentPassword()) {
        errs['currentPassword'] = 'Enter your current password to change it';
      }
    }
    return errs;
  });
  isValid = computed(() => Object.keys(this.errors()).length === 0);

  // Context from the referring page (e.g. a client's Users tab): where to go
  // back to after save, and which client to assign a newly created user to.
  private returnTo = signal<string | null>(null);
  private presetClientId = signal<string | null>(null);

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
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(qp => {
      // Only allow in-app admin targets, never external/arbitrary URLs.
      const rt = qp.get('returnTo');
      this.returnTo.set(rt && rt.startsWith('/admin/') ? rt : null);
      this.presetClientId.set(qp.get('clientId'));
    });
  }

  /** Where Save / Back should land: the referring page when given, else the list. */
  private exitUrl(): string {
    return this.returnTo() ?? '/admin/users/list';
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

  /** False when the loaded user holds no functional role (ROLE_USER only) — see the banner. */
  loadedUserHasRole = signal(true);

  private mapUserToAdminUser(user: User): AdminUser {
    const roles = user.roles ?? [];
    this.loadedUserHasRole.set(
      ['ROLE_ADMIN', 'ROLE_CLIENT_ADMIN', 'ROLE_USER_CLIENT_AGENT', 'ROLE_CLIENT', 'ROLE_FINANCE'].some(r => roles.includes(r))
    );
    return {
      id: user.id,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      username: user.username ?? '',
      email: user.email ?? '',
      role: this.mapRolesToAdminRole(user.roles ?? [])
    };
  }

  private mapRolesToAdminRole(roles: string[]): AdminUserRoleType | null {
    if (!roles || roles.length === 0) return null;
    if (roles.includes('ROLE_ADMIN')) return 'admin';
    if (roles.includes('ROLE_CLIENT_ADMIN')) return 'client_admin';
    // Agent before client: an agent may also hold ROLE_CLIENT, but the agent
    // role is the more specific one and must survive an open-and-save round trip.
    if (roles.includes('ROLE_USER_CLIENT_AGENT')) return 'client_agent';
    if (roles.includes('ROLE_CLIENT')) return 'client';
    if (roles.includes('ROLE_FINANCE')) return 'finance';
    return 'client';
  }

  private mapAdminRoleToRoles(role: AdminUserRoleType | null): string[] {
    switch (role) {
      case 'admin': return ['ROLE_ADMIN'];
      case 'client_admin': return ['ROLE_CLIENT_ADMIN'];
      case 'client': return ['ROLE_CLIENT'];
      case 'client_agent': return ['ROLE_USER_CLIENT_AGENT'];
      case 'finance': return ['ROLE_FINANCE'];
      default: return ['ROLE_CLIENT'];
    }
  }

  // Validation methods
  markAllTouched(): void {
    this.touched.set({ firstName: true, lastName: true, email: true, password: true, repeatPassword: true, currentPassword: true });
  }

  markFieldTouched(field: string): void {
    this.touched.update(t => ({ ...t, [field]: true }));
    // The value changed, so the backend's verdict on the old value no longer applies
    if (this.serverErrors()[field]) {
      this.serverErrors.update(e => ({ ...e, [field]: '' }));
    }
  }

  getError(field: string): string {
    const clientError = this.touched()[field] ? (this.errors()[field] || '') : '';
    return clientError || this.serverErrors()[field] || '';
  }

  /** Password fields to send: nothing when left empty (invite on create / unchanged on edit). */
  private passwordPayload(): Record<string, unknown> {
    if (!this.password()) return {};
    return {
      plainPassword: this.password(),
      // The backend requires the current password only for a self-service change
      ...(this.isSelf() ? { currentPassword: this.currentPassword() } : {})
    };
  }

  /**
   * Show a save failure: 422 violations go inline under their field (the API's
   * `plainPassword` is this form's `password`), everything else to the toast.
   */
  private handleSaveError(error: any): void {
    this.logger.error('Error saving user:', error);
    const fieldMap: Record<string, string> = { plainPassword: 'password' };
    const known = ['firstName', 'lastName', 'email', 'password', 'currentPassword'];
    const violations: Array<{ propertyPath?: string; message?: string }> =
      error?.status === 422 && Array.isArray(error?.error?.violations) ? error.error.violations : [];

    const fieldErrors: Record<string, string> = {};
    for (const v of violations) {
      const field = fieldMap[v.propertyPath ?? ''] ?? v.propertyPath ?? '';
      if (known.includes(field) && v.message && !fieldErrors[field]) {
        fieldErrors[field] = v.message;
      }
    }
    this.serverErrors.set(fieldErrors);

    if (Object.keys(fieldErrors).length > 0) {
      this.toastService.error('Failed to save user: please check the highlighted fields');
      return;
    }
    const detail = error?.error?.detail;
    this.toastService.error(typeof detail === 'string' && detail.trim() ? `Failed to save user: ${detail}` : 'Failed to save user');
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

  onCurrentPasswordChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.currentPassword.set(input.value);
    this.markFieldTouched('currentPassword');
  }

  toggleCurrentPasswordVisibility(): void {
    this.showCurrentPassword.update(v => !v);
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

    if (this.isSaving()) return;

    const user = this.user();

    // New user without a password: send an invitation email instead of creating
    // the account directly — the user picks their own password via the link.
    if (!this.isEditMode() && !this.password()) {
      this.isSaving.set(true);
      this.userService.inviteUser({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: this.mapAdminRoleToRoles(user.role),
        // Invited from a client's Users tab: assign the company right away
        ...(this.presetClientId() ? { client: `/api/v1/clients/${this.presetClientId()}` } : {})
      }).pipe(finalize(() => { this.isSaving.set(false); this.cdr.markForCheck(); })).subscribe({
        next: () => {
          this.toastService.success(`Invitation email sent to ${user.email}`);
          this.router.navigateByUrl(this.exitUrl());
        },
        error: (error) => {
          this.logger.error('Error sending invitation:', error);
          this.toastService.error('Failed to send invitation: ' + (error?.error?.detail || 'Unknown error'));
        }
      });
      return;
    }

    const data: Record<string, unknown> = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      // Optional display/login alias; null clears it (it is NOT derived from email)
      username: user.username?.trim() || null,
      roles: this.mapAdminRoleToRoles(user.role),
      // Password only if set (create or password change)
      ...this.passwordPayload()
    };

    // Created from a client's Users tab: assign that company right away
    if (!this.isEditMode() && this.presetClientId()) {
      data['client'] = `/api/v1/clients/${this.presetClientId()}`;
    }

    const operation = this.isEditMode() && this.userId()
      ? this.userService.updateUser(this.userId()!, data)
      : this.userService.createUser(data);

    this.isSaving.set(true);
    operation.pipe(finalize(() => { this.isSaving.set(false); this.cdr.markForCheck(); })).subscribe({
      next: () => {
        this.toastService.success('Saved successfully');
        this.router.navigateByUrl(this.exitUrl());
      },
      error: (error) => this.handleSaveError(error)
    });
  }

  onSaveAndContinue(): void {
    this.markAllTouched();
    if (!this.isValid()) {
      this.cdr.markForCheck();
      return;
    }

    if (this.isSaving()) return;

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
      // Optional display/login alias; null clears it (it is NOT derived from email)
      username: user.username?.trim() || null,
      roles: this.mapAdminRoleToRoles(user.role),
      ...this.passwordPayload()
    };

    // Created from a client's Users tab: assign that company right away
    if (!this.isEditMode() && this.presetClientId()) {
      data['client'] = `/api/v1/clients/${this.presetClientId()}`;
    }

    const operation = this.isEditMode() && this.userId()
      ? this.userService.updateUser(this.userId()!, data)
      : this.userService.createUser(data);

    this.isSaving.set(true);
    operation.pipe(finalize(() => { this.isSaving.set(false); this.cdr.markForCheck(); })).subscribe({
      next: (response) => {
        this.toastService.success('Saved successfully');
        this.serverErrors.set({});
        if (this.isEditMode()) {
          // The password change (if any) is done - don't resend it on the next save
          this.password.set('');
          this.repeatPassword.set('');
          this.currentPassword.set('');
        }
        if (!this.isEditMode() && response?.id) {
          // Keep the referring-page context so a later Save still returns there
          this.router.navigate(['/admin/users', response.id, 'edit'], {
            queryParams: this.returnTo() ? { returnTo: this.returnTo() } : {}
          });
        }
      },
      error: (error) => this.handleSaveError(error)
    });
  }

  onDiscard(): void {
    this.router.navigateByUrl(this.exitUrl());
  }

  goBack(): void {
    this.router.navigateByUrl(this.exitUrl());
  }
}
