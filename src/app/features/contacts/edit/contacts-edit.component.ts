import { Component, ChangeDetectionStrategy, ChangeDetectorRef, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { ToggleComponent } from '@app/ui-kit/atoms/toggle/toggle.component';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { SelectComponent } from '@app/ui-kit/atoms/select/select.component';
import { FormFieldComponent } from '@app/ui-kit/molecules/form-field/form-field.component';
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { DetailHeaderComponent } from '@app/ui-kit/molecules/detail-header/detail-header.component';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';
import { ToastService } from '@app/ui-kit/organisms/toast-container/toast-container.component';
import { ContactService } from '@core/services/http/contact.service';
import { ClientService } from '@core/services/http/client.service';
import { LookupService } from '@core/services/http/lookup.service';
import { Contact, CreateContactDto } from '@core/models/contact.model';

// Contact detail interface for the form
interface ContactDetail {
  id: number | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  otherPhone: string;
  homePhone: string;
  otherEmail: string;
  fax: string;
  dateOfBirth: string;
  description: string;
  accountId: string | null;
  accountName: string;
  titleId: number | null;
  departmentId: number | null;
  supportPersonId: number | null;
  supportLevelId: number | null;
  isActive: boolean;
  isBilling: boolean;
}

// Default empty contact for new mode
const EMPTY_CONTACT: ContactDetail = {
  id: null,
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  otherPhone: '',
  homePhone: '',
  otherEmail: '',
  fax: '',
  dateOfBirth: '',
  description: '',
  accountId: null,
  accountName: '',
  titleId: null,
  departmentId: null,
  supportPersonId: null,
  supportLevelId: null,
  isActive: true,
  isBilling: false
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
    SelectComponent,
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
  private contactService = inject(ContactService);
  private clientService = inject(ClientService);
  private lookupService = inject(LookupService);
  private toastService = inject(ToastService);
  private destroy$ = new Subject<void>();

  // Mode tracking
  isEditMode = signal(false);
  isLoading = signal(false);
  loadError = signal<string | null>(null);

  // Contact data - starts empty
  contact = signal<ContactDetail>({ ...EMPTY_CONTACT });

  isBilling = signal(false);
  isActive = signal(true);

  // Account options for dropdown (string values to match native <select> behavior)
  accountOptions = signal<{ value: string; label: string }[]>([]);

  // Select options - loaded from API (string values to match native <select> behavior)
  personTitleOptions = signal<{ value: string; label: string }[]>([]);
  departmentOptions = signal<{ value: string; label: string }[]>([]);
  supportLevelOptions = signal<{ value: string; label: string }[]>([]);

  ngOnInit(): void {
    // Load dropdown options
    this.loadAccounts();
    this.loadLookupOptions();

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

          // Check for pre-selected account from query params (e.g., from Account detail page)
          this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(queryParams => {
            const accountId = queryParams['accountId'];
            const accountName = queryParams['accountName'];
            if (accountId) {
              this.contact.update(c => ({
                ...c,
                accountId: accountId,
                accountName: accountName || ''
              }));
              this.cdr.markForCheck();
            }
          });
        }
      });
  }

  private loadLookupOptions(): void {
    // Load contact titles
    this.lookupService.getContactTitles().subscribe({
      next: (items) => {
        this.personTitleOptions.set(items.map(i => ({ value: String(i.id), label: i.name })));
        this.cdr.markForCheck();
      }
    });

    // Load departments
    this.lookupService.getDepartments().subscribe({
      next: (items) => {
        this.departmentOptions.set(items.map(i => ({ value: String(i.id), label: i.name })));
        this.cdr.markForCheck();
      }
    });

    // Load support levels (hardcoded - no DB table)
    this.lookupService.getSupportLevels().subscribe({
      next: (items) => {
        this.supportLevelOptions.set(items.map(i => ({ value: String(i.id), label: i.name })));
        this.cdr.markForCheck();
      }
    });
  }

  private loadAccounts(): void {
    this.clientService.getClients(1, 'name', 'asc').subscribe({
      next: (response) => {
        const options = response.clients.map(client => ({
          value: String(client.id),
          label: client.name
        }));
        this.accountOptions.set(options);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading accounts:', err);
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
    this.contactService.getContact(id).subscribe({
      next: (contact) => {
        if (contact) {
          const detail = this.mapContactToDetail(contact);
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

  private mapContactToDetail(contact: Contact): ContactDetail {
    // Find account name from options
    const account = this.accountOptions().find(a => a.value === String(contact.accountId));

    return {
      id: contact.id,
      firstName: contact.firstName ?? '',
      lastName: contact.lastName ?? '',
      email: contact.email ?? '',
      phone: contact.phone ?? '',
      otherPhone: contact.otherPhone ?? '',
      homePhone: contact.homePhone ?? '',
      otherEmail: contact.otherEmail ?? '',
      fax: contact.fax ?? '',
      dateOfBirth: contact.dateOfBirth ?? '',
      description: contact.description ?? '',
      accountId: contact.accountId,
      accountName: account?.label ?? '',
      titleId: contact.titleId,
      departmentId: contact.departmentId,
      supportPersonId: contact.supportPersonId,
      supportLevelId: contact.supportLevelId,
      isActive: (contact.isActive !== null && contact.isActive !== undefined) ? contact.isActive === 1 : true,
      isBilling: false // No backing field in contact_entity schema
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

  onAccountChange(value: string | number): void {
    const strValue = String(value);
    const selectedAccount = this.accountOptions().find(opt => opt.value === strValue);
    if (selectedAccount) {
      this.contact.update(c => ({
        ...c,
        accountId: strValue,
        accountName: selectedAccount.label
      }));
    }
  }

  clearAccount(): void {
    this.contact.update(c => ({ ...c, accountId: null, accountName: '' }));
  }

  updateContact(field: keyof ContactDetail, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.contact.update(c => ({ ...c, [field]: value }));
  }

  onPersonTitleChange(value: string | number): void {
    const titleId = typeof value === 'string' ? parseInt(value, 10) : value;
    this.contact.update(c => ({ ...c, titleId }));
  }

  clearPersonTitle(): void {
    this.contact.update(c => ({ ...c, titleId: null }));
  }

  onDepartmentChange(value: string | number): void {
    const departmentId = typeof value === 'string' ? parseInt(value, 10) : value;
    this.contact.update(c => ({ ...c, departmentId }));
  }

  clearDepartment(): void {
    this.contact.update(c => ({ ...c, departmentId: null }));
  }

  onSupportLevelChange(value: string | number): void {
    const supportLevelId = typeof value === 'string' ? parseInt(value, 10) : value;
    this.contact.update(c => ({ ...c, supportLevelId }));
  }

  clearSupportLevel(): void {
    this.contact.update(c => ({ ...c, supportLevelId: null }));
  }

  onSave(): void {
    this.saveContact(false);
  }

  onSaveAndContinue(): void {
    this.saveContact(true);
  }

  private saveContact(navigateToList: boolean): void {
    const contact = this.contact();

    const data: CreateContactDto = {
      firstName: contact.firstName?.trim() || null,
      lastName: contact.lastName?.trim() || null,
      email: contact.email?.trim() || null,
      phone: contact.phone?.trim() || null,
      otherPhone: contact.otherPhone?.trim() || null,
      homePhone: contact.homePhone?.trim() || null,
      otherEmail: contact.otherEmail?.trim() || null,
      fax: contact.fax?.trim() || null,
      dateOfBirth: contact.dateOfBirth || null,
      description: contact.description?.trim() || null,
      accountId: contact.accountId,
      titleId: contact.titleId,
      departmentId: contact.departmentId,
      supportPersonId: contact.supportPersonId,
      supportLevelId: contact.supportLevelId,
      isActive: this.isActive() ? 1 : 0
    };

    const isCreating = !this.isEditMode() || !contact.id;
    const operation = isCreating
      ? this.contactService.createContact(data)
      : this.contactService.updateContact(contact.id!, data);

    operation.subscribe({
      next: (result) => {
        this.toastService.success('Saved successfully');
        if (navigateToList) {
          this.router.navigate(['/admin/contacts/list']);
        } else if (isCreating && result?.id) {
          this.router.navigate(['/admin/contacts', result.id, 'edit']);
        }
      },
      error: (error) => {
        console.error('Error saving contact:', error);
        this.toastService.error('Failed to save contact');
      }
    });
  }

  formatValue(value: string | undefined | null): string {
    return value || '–';
  }
}
