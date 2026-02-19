import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, OnInit, OnDestroy, inject, ViewChild, TemplateRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { ToggleComponent } from '@app/ui-kit/atoms/toggle/toggle.component';
import { SelectComponent } from '@app/ui-kit/atoms/select/select.component';
import { TabsComponent, TabItem } from '@app/ui-kit/molecules/tabs/tabs.component';
import { BadgeComponent } from '@app/ui-kit/atoms/badge/badge.component';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { AvatarComponent } from '@app/ui-kit/atoms/avatar/avatar.component';
import { FormFieldComponent } from '@app/ui-kit/molecules/form-field/form-field.component';
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { DetailHeaderComponent } from '@app/ui-kit/molecules/detail-header/detail-header.component';
import { TableFooterComponent } from '@app/ui-kit/molecules/table-footer/table-footer.component';
import { TableActionsDropdownComponent, TableAction, ActionClickEvent } from '@app/ui-kit/molecules/table-actions-dropdown/table-actions-dropdown.component';
import { DataTableComponent, TableColumn } from '@app/ui-kit/organisms/data-table/data-table.component';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';
import { ToastService } from '@app/ui-kit/organisms/toast-container/toast-container.component';
import { AddressModalComponent, AddressFormData } from '../../../shared/components/modals/address-modal/address-modal.component';
import { Account, AccountContact } from '@core/models/account.model';
import { ClientService } from '@core/services/http/client.service';
import { ContactService } from '@core/services/http/contact.service';
import { OrderService } from '@core/services/http/order.service';
import { AddressService } from '@core/services/http/address.service';
import { ClientDetail, ClientAddress } from '@core/models/client.model';
import { Order } from '@core/models/order.model';
import { AccountGroupService } from '@core/services/http/account-group.service';

// Interfaces for tab data
interface Address {
  id: number;
  street: string;
  city: string;
  country: string;
  isBilling: boolean;
  isDelivery: boolean;
}

interface ShopOrder {
  orderId: string;
  type: 'order' | 'manual';
  dateCreated: string;
  internalRef: number;
  customer: {
    name: string;
    initials: string;
    avatar?: string;
  };
  partsOrdered: number;
  status: 'completed' | 'delayed' | 'failed' | 'in-review' | 'archived';
}

// Default empty account for new mode
const EMPTY_ACCOUNT: Account = {
  id: 0,
  code: '',
  oib: '',
  name: '',
  email: '',
  status: 'active',
  purchaseLimit: 0,
  amountSpent: 0,
  isActive: true,
  isLegalEntity: false,
  accountType: '',
  phone: '',
  otherPhone: '',
  otherEmail: '',
  fax: '',
  web: ''
};

@Component({
  selector: 'app-accounts-edit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ToggleComponent,
    SelectComponent,
    TabsComponent,
    BadgeComponent,
    IconComponent,
    AvatarComponent,
    FormFieldComponent,
    BreadcrumbsComponent,
    DetailHeaderComponent,
    TableFooterComponent,
    TableActionsDropdownComponent,
    DataTableComponent,
    MobileFooterComponent,
    AddressModalComponent
  ],
  templateUrl: './accounts-edit.component.html',
  styleUrls: ['./accounts-edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountsEditComponent implements OnInit, OnDestroy, AfterViewInit {
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private clientService = inject(ClientService);
  private contactService = inject(ContactService);
  private orderService = inject(OrderService);
  private addressService = inject(AddressService);
  private accountGroupService = inject(AccountGroupService);
  private toastService = inject(ToastService);
  private destroy$ = new Subject<void>();

  isLoading = signal(false);
  loadError = signal<string | null>(null);

  // Template refs for custom cell rendering
  @ViewChild('contactBillingTemplate') contactBillingTemplate!: TemplateRef<any>;
  @ViewChild('contactActionsTemplate') contactActionsTemplate!: TemplateRef<any>;
  @ViewChild('addressBillingTemplate') addressBillingTemplate!: TemplateRef<any>;
  @ViewChild('addressDeliveryTemplate') addressDeliveryTemplate!: TemplateRef<any>;
  @ViewChild('addressActionsTemplate') addressActionsTemplate!: TemplateRef<any>;
  @ViewChild('orderTypeTemplate') orderTypeTemplate!: TemplateRef<any>;
  @ViewChild('orderCustomerTemplate') orderCustomerTemplate!: TemplateRef<any>;
  @ViewChild('orderStatusTemplate') orderStatusTemplate!: TemplateRef<any>;
  @ViewChild('orderActionsTemplate') orderActionsTemplate!: TemplateRef<any>;
  // Table column configs
  contactsColumns: TableColumn[] = [];
  addressesColumns: TableColumn[] = [];
  shopOrdersColumns: TableColumn[] = [];
  manualEntriesColumns: TableColumn[] = [];

  // Mode tracking
  isEditMode = signal(false);
  accountId = signal<string | null>(null);

  // Account data - starts empty
  account = signal<Account>({ ...EMPTY_ACCOUNT });

  // Contacts data - starts empty, loaded in edit mode
  contacts = signal<AccountContact[]>([]);

  // Addresses data - starts empty, loaded in edit mode
  addresses = signal<Address[]>([]);

  // Shop orders data - starts empty, loaded in edit mode
  shopOrders = signal<ShopOrder[]>([]);

  // Manual entries data - starts empty, loaded in edit mode
  manualEntries = signal<ShopOrder[]>([]);

  // Tabs configuration
  tabs: TabItem[] = [
    { id: 'contacts', label: 'Contacts' },
    { id: 'addresses', label: 'Addresses' },
    { id: 'shop-orders', label: 'Shop orders' }
  ];

  activeTab = signal('contacts');

  // Dropdown state
  openDropdownId = signal<number | string | null>(null);

  // Form state
  isActive = signal(true);
  isLegalEntity = signal(false);

  // Address modal state
  isAddressModalOpen = signal(false);
  selectedAddress = signal<Address | null>(null);
  isAddressSaving = signal(false);

  // Validation state
  touched = signal<Record<string, boolean>>({});
  errors = computed(() => {
    const account = this.account();
    const errs: Record<string, string> = {};
    if (!account.name?.trim()) errs['name'] = 'Title is required';
    if (!account.accountType) errs['accountType'] = 'Account type is required';
    if (!account.code?.trim()) errs['code'] = 'Code is required';
    else if (account.code.trim().length < 2) errs['code'] = 'Code must be at least 2 characters';
    return errs;
  });
  isValid = computed(() => Object.keys(this.errors()).length === 0);

  // Account type options for single-select
  accountTypeOptions = [
    { value: 'client', label: 'Client' },
    { value: 'supplier', label: 'Supplier' },
    { value: 'partner', label: 'Partner' },
    { value: 'distributor', label: 'Distributor' }
  ];

  // Account group options - loaded from API
  accountGroupOptions = signal<{ value: string; label: string }[]>([]);

  // Handle account type change
  onAccountTypeChange(value: string | number): void {
    this.account.update(a => ({ ...a, accountType: String(value) }));
    this.touched.update(t => ({ ...t, accountType: true }));
  }

  // Clear account type
  clearAccountType(): void {
    this.account.update(a => ({ ...a, accountType: '' }));
    this.touched.update(t => ({ ...t, accountType: true }));
  }

  // Handle account group change
  onAccountGroupChange(value: string | number): void {
    this.account.update(a => ({ ...a, accountGroupId: Number(value) }));
  }

  // Clear account group
  clearAccountGroup(): void {
    this.account.update(a => ({ ...a, accountGroupId: undefined }));
  }

  // Table actions
  contactActions: TableAction[] = [
    { id: 'edit', label: 'Edit', icon: 'pencil' },
    { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' }
  ];

  addressActions: TableAction[] = [
    { id: 'edit', label: 'Edit', icon: 'pencil' },
    { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' }
  ];

  orderActions: TableAction[] = [
    { id: 'view', label: 'View', icon: 'eye' },
    { id: 'edit', label: 'Edit', icon: 'pencil' }
  ];

  ngOnInit(): void {
    // Load account groups for dropdown
    this.loadAccountGroups();

    // Subscribe to route param changes to handle navigation between add/edit
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const accountId = params.get('id');
        if (accountId && accountId !== 'new') {
          this.accountId.set(accountId);
          this.isEditMode.set(true);
          this.loadAccount(accountId);
        } else {
          // New account mode - reset to empty state
          this.accountId.set(null);
          this.isEditMode.set(false);
          this.resetForm();
        }
      });
  }

  ngAfterViewInit(): void {
    this.initColumns();
    this.cdr.detectChanges();
  }

  private initColumns(): void {
    // Contacts columns
    this.contactsColumns = [
      { key: 'id', label: 'Id', sortable: true, width: '88px' },
      { key: 'fullName', label: 'Full name', sortable: true },
      { key: 'email', label: 'Email', sortable: true },
      { key: 'phone', label: 'Phone', width: '160px' },
      { key: 'isBilling', label: 'Billing', sortable: true, width: '104px', template: this.contactBillingTemplate },
      { key: 'actions', label: '', width: '64px', template: this.contactActionsTemplate }
    ];

    // Addresses columns
    this.addressesColumns = [
      { key: 'id', label: 'Id', sortable: true, width: '88px' },
      { key: 'street', label: 'Street', sortable: true },
      { key: 'city', label: 'City', sortable: true },
      { key: 'country', label: 'Country', sortable: true },
      { key: 'isBilling', label: 'Billing', sortable: true, width: '104px', template: this.addressBillingTemplate },
      { key: 'isDelivery', label: 'Show as delivery', sortable: true, width: '140px', template: this.addressDeliveryTemplate },
      { key: 'actions', label: '', width: '64px', template: this.addressActionsTemplate }
    ];

    // Shop orders columns
    this.shopOrdersColumns = [
      { key: 'orderId', label: 'Order ID', width: '100px' },
      { key: 'type', label: 'Type', width: '80px', template: this.orderTypeTemplate },
      { key: 'dateCreated', label: 'Date Created', width: '140px' },
      { key: 'internalRef', label: 'Internal reference number' },
      { key: 'customer', label: 'Customer', width: '200px', template: this.orderCustomerTemplate },
      { key: 'partsOrdered', label: 'Parts ordered', width: '120px' },
      { key: 'status', label: 'Status', width: '120px', template: this.orderStatusTemplate },
      { key: 'actions', label: '', width: '64px', template: this.orderActionsTemplate }
    ];

    // Manual entries columns (same as shop orders)
    this.manualEntriesColumns = [
      { key: 'orderId', label: 'Order ID', width: '100px' },
      { key: 'type', label: 'Type', width: '80px', template: this.orderTypeTemplate },
      { key: 'dateCreated', label: 'Date Created', width: '140px' },
      { key: 'internalRef', label: 'Internal reference number' },
      { key: 'customer', label: 'Customer', width: '200px', template: this.orderCustomerTemplate },
      { key: 'partsOrdered', label: 'Parts ordered', width: '120px' },
      { key: 'status', label: 'Status', width: '120px', template: this.orderStatusTemplate },
      { key: 'actions', label: '', width: '64px', template: this.orderActionsTemplate }
    ];

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private resetForm(): void {
    this.account.set({ ...EMPTY_ACCOUNT });
    this.contacts.set([]);
    this.addresses.set([]);
    this.shopOrders.set([]);
    this.manualEntries.set([]);
    this.isActive.set(true);
    this.isLegalEntity.set(false);
    this.activeTab.set('contacts');
    this.touched.set({});
    this.cdr.markForCheck();
  }

  private loadAccountGroups(): void {
    this.accountGroupService.getAccountGroups(1, 100).subscribe({
      next: (response) => {
        this.accountGroupOptions.set(
          (response.member || []).map(g => ({ value: String(g.id), label: g.name }))
        );
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error loading account groups:', err)
    });
  }

  private loadAccount(id: string): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.touched.set({});
    this.clientService.getClient(id).subscribe({
      next: (client) => {
        this.account.set(this.mapClientToAccount(client));
        this.manualEntries.set([]);
        this.isActive.set(client.isActive ?? true);
        this.isLegalEntity.set(client.isLegalEntity ?? false);
        this.isLoading.set(false);
        this.cdr.markForCheck();

        // Load contacts for this account
        this.loadAccountContacts(id);

        // Load addresses for this client
        this.loadClientAddresses(id);

        // Load orders for this client
        if (client.code) {
          this.loadClientOrders(client.code);
        }
      },
      error: (err) => {
        this.loadError.set(err?.message || 'Account not found');
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  private loadClientAddresses(clientId: string): void {
    this.addressService.getAddressesByClient(clientId).subscribe({
      next: (addresses) => {
        this.addresses.set(this.mapClientAddressesToAddresses(addresses));
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading addresses:', err);
        this.addresses.set([]);
      }
    });
  }

  private loadAccountContacts(accountId: string): void {
    this.contactService.getContactsByAccount(accountId).subscribe({
      next: (response) => {
        const contacts = response.contacts.map(c => ({
          id: c.id,
          fullName: c.fullName || [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email || '–',
          email: c.email ?? '',
          phone: c.phone ?? '',
          isBilling: false
        }));
        this.contacts.set(contacts);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading contacts:', err);
        this.contacts.set([]);
      }
    });
  }

  private mapClientAddressesToAddresses(clientAddresses: ClientAddress[]): Address[] {
    return clientAddresses.map(addr => ({
      id: addr.id,
      street: addr.street,
      city: addr.city,
      country: addr.country?.name ?? '',
      isBilling: addr.isBilling,
      isDelivery: addr.isDelivery
    }));
  }

  private loadClientOrders(clientCode: string): void {
    this.orderService.getOrders(1, 'createdAt', 'desc', { 'user.client.code': clientCode }).subscribe({
      next: (response) => {
        this.shopOrders.set(this.mapOrdersToShopOrders(response.orders));
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading orders:', err);
        this.shopOrders.set([]);
      }
    });
  }

  private mapOrdersToShopOrders(orders: Order[]): ShopOrder[] {
    return orders.map(order => ({
      orderId: order.orderNumber,
      type: order.isDraft ? 'manual' : 'order',
      dateCreated: new Date(order.createdAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      internalRef: order.id,
      customer: {
        name: order.user ? `${order.user.firstName ?? ''} ${order.user.lastName ?? ''}`.trim() || order.user.email : 'Unknown',
        initials: order.user ? this.getInitials(order.user.firstName, order.user.lastName) : '??'
      },
      partsOrdered: order.items?.length ?? 0,
      status: this.mapOrderStatus(order.status)
    }));
  }

  private getInitials(firstName?: string, lastName?: string): string {
    const first = firstName?.charAt(0)?.toUpperCase() ?? '';
    const last = lastName?.charAt(0)?.toUpperCase() ?? '';
    return first + last || '??';
  }

  private mapOrderStatus(status: string): 'completed' | 'delayed' | 'failed' | 'in-review' | 'archived' {
    switch (status?.toLowerCase()) {
      case 'completed': return 'completed';
      case 'dispatched': return 'completed';
      case 'processing': return 'in-review';
      case 'confirmed': return 'in-review';
      case 'pending': return 'delayed';
      case 'cancelled': return 'failed';
      case 'draft': return 'archived';
      default: return 'in-review';
    }
  }

  private mapClientToAccount(c: ClientDetail): Account {
    return {
      id: c.id,
      code: c.code,
      oib: c.vatNumber ?? '',
      name: c.name ?? '',
      email: c.email ?? '',
      status: c.isActive ? 'active' : 'inactive',
      isActive: c.isActive,
      isLegalEntity: c.isLegalEntity ?? false,
      accountType: c.accountType ?? '',
      accountGroupId: c.accountGroup?.id ?? undefined,
      phone: c.phoneNumber,
      web: (c as { web?: string }).web
    };
  }


  // Computed values
  totalContacts = computed(() => this.contacts().length);
  totalAddresses = computed(() => this.addresses().length);
  totalShopOrders = computed(() => this.shopOrders().length);
  totalManualEntries = computed(() => this.manualEntries().length);
  // Get current tab count
  currentTabCount = computed(() => {
    switch (this.activeTab()) {
      case 'contacts': return this.totalContacts();
      case 'addresses': return this.totalAddresses();
      case 'shop-orders': return this.totalShopOrders();
      case 'manual-entries': return this.totalManualEntries();
      default: return 0;
    }
  });

  // Get add button text based on active tab
  addButtonText = computed(() => {
    switch (this.activeTab()) {
      case 'contacts': return 'Add contact';
      case 'addresses': return 'Add address';
      case 'shop-orders': return 'Add order';
      case 'manual-entries': return 'Add entry';
      default: return 'Add';
    }
  });

  // Get status badge variant
  getStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'secondary' | 'info' {
    switch (status) {
      case 'completed': return 'success';
      case 'delayed': return 'warning';
      case 'failed': return 'danger';
      case 'in-review': return 'secondary';
      case 'archived': return 'secondary';
      default: return 'secondary';
    }
  }

  // Get status label
  getStatusLabel(status: string): string {
    switch (status) {
      case 'completed': return 'Completed';
      case 'delayed': return 'Delayed';
      case 'failed': return 'Failed';
      case 'in-review': return 'In Review';
      case 'archived': return 'Archived';
      default: return status;
    }
  }

  onActiveChange(value: boolean): void {
    this.isActive.set(value);
  }

  onLegalEntityChange(value: boolean): void {
    this.isLegalEntity.set(value);
  }

  updateAccount(field: keyof Account, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.account.update(a => ({ ...a, [field]: value }));
    this.touched.update(t => ({ ...t, [field]: true }));
  }

  markAllTouched(): void {
    this.touched.set({ name: true, code: true, email: true, accountType: true });
  }

  hasError(field: string): boolean {
    return !!this.touched()[field] && !!this.errors()[field];
  }

  getError(field: string): string {
    return this.touched()[field] ? (this.errors()[field] || '') : '';
  }

  onTabChange(tabId: string): void {
    this.activeTab.set(tabId);
  }

  toggleDropdown(id: number | string): void {
    if (this.openDropdownId() === id) {
      this.openDropdownId.set(null);
    } else {
      this.openDropdownId.set(id);
    }
  }

  closeDropdown(): void {
    this.openDropdownId.set(null);
  }

  onContactActionClick(event: ActionClickEvent): void {
    const contact = event.row as AccountContact;
    switch (event.actionId) {
      case 'edit':
        this.onEdit(contact);
        break;
      case 'delete':
        this.onDelete(contact);
        break;
    }
  }

  onAddressActionClick(event: ActionClickEvent): void {
    const address = event.row as Address;
    switch (event.actionId) {
      case 'edit':
        this.openAddressModal(address);
        this.closeDropdown();
        break;
      case 'delete':
        this.deleteAddress(address);
        this.closeDropdown();
        break;
    }
  }

  onOrderActionClick(event: ActionClickEvent): void {
    const order = event.row as ShopOrder;
    this.closeDropdown();
    switch (event.actionId) {
      case 'view':
      case 'edit':
        this.router.navigate(['/admin/shop-orders', order.internalRef, 'edit']);
        break;
    }
  }

  onEdit(contact: AccountContact): void {
    this.closeDropdown();
    this.router.navigate(['/admin/contacts', contact.id, 'edit']);
  }

  onDelete(contact: AccountContact): void {
    console.log('Delete contact:', contact);
    this.closeDropdown();
  }

  onSave(): void {
    this.saveAccount(false);
  }

  onSaveAndContinue(): void {
    this.saveAccount(true);
  }

  private saveAccount(navigateToList: boolean): void {
    this.markAllTouched();

    const account = this.account();
    const validationErrors = this.errors();

    if (Object.keys(validationErrors).length > 0) {
      this.cdr.detectChanges();
      return;
    }

    const data: Record<string, unknown> = {
      code: account.code?.trim() ?? '',
      name: account.name?.trim() ?? '',
      email: account.email?.trim() || null,
      vatNumber: account.oib?.trim() || null,
      phoneNumber: account.phone?.trim() || null,
      isActive: this.isActive(),
      isLegalEntity: this.isLegalEntity(),
      accountType: account.accountType || null,
      accountGroup: account.accountGroupId ? `/api/v1/account_groups/${account.accountGroupId}` : null
    };

    const isCreating = !this.isEditMode() || !this.accountId();
    const operation = isCreating
      ? this.clientService.createClient(data as any)
      : this.clientService.updateClient(this.accountId()!, data as any);

    operation.subscribe({
      next: (result) => {
        this.toastService.success('Saved successfully');
        if (navigateToList) {
          this.router.navigate(['/admin/accounts/list']);
        } else if (isCreating && result?.id) {
          // After creating, navigate to edit page for the new account
          this.router.navigate(['/admin/accounts', result.id, 'edit']);
        }
        // If editing and not navigating, just stay on page (data already saved)
      },
      error: (error) => {
        console.error('Error saving account:', error);
        this.toastService.error('Failed to save account');
      }
    });
  }

  onAddContact(): void {
    if (this.activeTab() === 'addresses') {
      this.openAddressModal();
    } else {
      // Navigate to create contact page with pre-selected account
      const account = this.account();
      this.router.navigate(['/admin/contacts/new'], {
        queryParams: { accountId: account.id, accountName: account.name }
      });
    }
  }

  // Address modal methods
  openAddressModal(address?: Address): void {
    this.selectedAddress.set(address || null);
    this.isAddressModalOpen.set(true);
    this.cdr.markForCheck();
  }

  closeAddressModal(): void {
    this.isAddressModalOpen.set(false);
    this.selectedAddress.set(null);
    this.cdr.markForCheck();
  }

  onAddressSave(formData: AddressFormData): void {
    this.isAddressSaving.set(true);
    const clientId = this.accountId();

    if (!clientId) {
      console.error('Cannot save address: no client ID');
      this.isAddressSaving.set(false);
      return;
    }

    if (formData.id !== undefined) {
      // Update existing address
      this.addressService.updateAddress(String(formData.id), {
        street: formData.street,
        city: formData.city,
        isBilling: formData.isBilling,
        isDelivery: formData.isDelivery
      }).subscribe({
        next: () => {
          this.loadClientAddresses(clientId);
          this.isAddressSaving.set(false);
          this.closeAddressModal();
        },
        error: (err) => {
          console.error('Error updating address:', err);
          this.isAddressSaving.set(false);
        }
      });
    } else {
      // Create new address
      this.addressService.createAddressForClient(clientId, {
        street: formData.street,
        city: formData.city,
        isBilling: formData.isBilling,
        isDelivery: formData.isDelivery
      }).subscribe({
        next: () => {
          this.loadClientAddresses(clientId);
          this.isAddressSaving.set(false);
          this.closeAddressModal();
        },
        error: (err) => {
          console.error('Error creating address:', err);
          this.isAddressSaving.set(false);
        }
      });
    }
  }

  deleteAddress(address: Address): void {
    this.addressService.deleteAddress(String(address.id)).subscribe({
      next: () => {
        this.addresses.update(addresses =>
          addresses.filter(a => a.id !== address.id)
        );
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error deleting address:', err);
      }
    });
  }

  goBack(): void {
    window.history.back();
  }

  formatCurrency(value: number | undefined): string {
    if (value === undefined) return '–';
    return `€ ${value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
