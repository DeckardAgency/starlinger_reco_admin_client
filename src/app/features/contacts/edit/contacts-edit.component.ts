import { Component, ChangeDetectionStrategy, ChangeDetectorRef, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { ToggleComponent } from '@app/ui-kit/atoms/toggle/toggle.component';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { FormFieldComponent } from '@app/ui-kit/molecules/form-field/form-field.component';
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { DetailHeaderComponent } from '@app/ui-kit/molecules/detail-header/detail-header.component';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';
import { UserService } from '@core/services/http/user.service';
import { User } from '@core/models';

// Contact detail interface (aligned with User from API)
interface ContactDetail {
  id: string | number | null;
  firstName: string;
  lastName: string;
  account: string;
  accountId?: number;
  personTitle?: string;
  department?: string;
  dateOfBirth?: string;
  supportLevel?: string;
  supportPerson?: string;
  phone?: string;
  otherPhone?: string;
  homePhone?: string;
  email: string;
  otherEmail?: string;
  fax?: string;
  isBilling: boolean;
  isActive: boolean;
}

// Default empty contact for new mode
const EMPTY_CONTACT: ContactDetail = {
  id: null,
  firstName: '',
  lastName: '',
  account: '',
  personTitle: '',
  department: '',
  dateOfBirth: '',
  supportLevel: '',
  supportPerson: '',
  phone: '',
  otherPhone: '',
  homePhone: '',
  email: '',
  otherEmail: '',
  fax: '',
  isBilling: false,
  isActive: true
};

@Component({
  selector: 'app-contacts-edit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ToggleComponent,
    IconComponent,
    FormFieldComponent,
    BreadcrumbsComponent,
    DetailHeaderComponent,
    MobileFooterComponent
  ],
  templateUrl: './contacts-edit.component.html',
  styleUrls: ['./contacts-edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactsEditComponent implements OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);
  private destroy$ = new Subject<void>();

  // Mode tracking
  isEditMode = signal(false);
  isLoading = signal(false);
  loadError = signal<string | null>(null);

  // Contact data - starts empty
  contact = signal<ContactDetail>({ ...EMPTY_CONTACT });

  isBilling = signal(false);
  isActive = signal(true);

  ngOnInit(): void {
    // Subscribe to route param changes to handle navigation between add/edit
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const contactId = params.get('id');
        if (contactId && contactId !== 'new') {
          this.isEditMode.set(true);
          this.loadContact(contactId);
        } else {
          // New contact mode - reset to empty state
          this.isEditMode.set(false);
          this.resetForm();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private resetForm(): void {
    this.contact.set({ ...EMPTY_CONTACT });
    this.isBilling.set(false);
    this.isActive.set(true);
    this.cdr.markForCheck();
  }

  private loadContact(id: string): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.userService.getUserById(id).subscribe({
      next: (user) => {
        if (user) {
          const detail = this.mapUserToContactDetail(user);
          this.contact.set(detail);
          this.isBilling.set(detail.isBilling);
          this.isActive.set(detail.isActive);
        } else {
          this.loadError.set('Contact not found');
        }
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loadError.set(err?.message || 'Failed to load contact');
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  private mapUserToContactDetail(user: User): ContactDetail {
    const client = user.client as { id?: string; name?: string } | undefined;
    return {
      id: user.id,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      account: client?.name ?? '',
      accountId: client?.id as number | undefined,
      email: user.email ?? '',
      phone: user.phoneNumber ?? (user as { phone?: string }).phone ?? undefined,
      isBilling: false,
      isActive: (user as { isActive?: boolean }).isActive ?? true
    };
  }

  onBack(): void {
    this.router.navigate(['/admin/contacts/list']);
  }

  onBillingChange(checked: boolean): void {
    this.isBilling.set(checked);
  }

  onActiveChange(checked: boolean): void {
    this.isActive.set(checked);
  }

  onSaveAndContinue(): void {
    console.log('Save and continue:', this.contact());
    // Navigate to next contact or stay on page
  }

  onSave(): void {
    const contact = this.contact();
    const data = {
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phoneNumber: contact.phone
    };

    const operation = this.isEditMode() && contact.id
      ? this.userService.updateUser(String(contact.id), data)
      : this.userService.createUser(data);

    operation.subscribe({
      next: () => this.router.navigate(['/admin/contacts/list']),
      error: (error) => console.error('Error saving contact:', error)
    });
  }

  formatValue(value: string | undefined | null): string {
    return value || '–';
  }
}
