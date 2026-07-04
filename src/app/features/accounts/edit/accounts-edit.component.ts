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
import { ModalComponent } from '@app/ui-kit/organisms/modal/modal.component';
import { AddressModalComponent, AddressFormData } from '../../../shared/components/modals/address-modal/address-modal.component';
import { Account } from '@core/models/account.model';
import { ClientService } from '@core/services/http/client.service';
import { OrderService } from '@core/services/http/order.service';
import { AddressService } from '@core/services/http/address.service';
import { UserService } from '@core/services/http/user.service';
import { ClientDetail, ClientAddress, ClientUser } from '@core/models/client.model';
import { Order } from '@core/models/order.model';
import { AccountGroupService } from '@core/services/http/account-group.service';
import { CountryService } from '@core/services/http/country.service';
import { CountryOption } from '../../../shared/components/modals/address-modal/address-modal.component';

// Interfaces for tab data
interface Address {
  id: number;
  street: string;
  city: string;
  postalCode: string;
  countryId: string;
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
  vatNumber: '',
  name: '',
  email: '',
  status: 'active',
  purchaseLimit: 0,
  amountSpent: 0,
  isActive: true,
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
    ModalComponent,
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
  private userService = inject(UserService);
  private orderService = inject(OrderService);
  private addressService = inject(AddressService);
  private accountGroupService = inject(AccountGroupService);
  private countryService = inject(CountryService);
  private toastService = inject(ToastService);
  private destroy$ = new Subject<void>();

  isLoading = signal(false);
  loadError = signal<string | null>(null);

  // Template refs for custom cell rendering
  @ViewChild('userRoleTemplate') userRoleTemplate!: TemplateRef<any>;
  @ViewChild('userStatusTemplate') userStatusTemplate!: TemplateRef<any>;
  @ViewChild('userActionsTemplate') userActionsTemplate!: TemplateRef<any>;
  @ViewChild('addressBillingTemplate') addressBillingTemplate!: TemplateRef<any>;
  @ViewChild('addressDeliveryTemplate') addressDeliveryTemplate!: TemplateRef<any>;
  @ViewChild('addressActionsTemplate') addressActionsTemplate!: TemplateRef<any>;
  @ViewChild('orderTypeTemplate') orderTypeTemplate!: TemplateRef<any>;
  @ViewChild('orderCustomerTemplate') orderCustomerTemplate!: TemplateRef<any>;
  @ViewChild('orderStatusTemplate') orderStatusTemplate!: TemplateRef<any>;
  @ViewChild('orderActionsTemplate') orderActionsTemplate!: TemplateRef<any>;
  @ViewChild('managedClientActionsTemplate') managedClientActionsTemplate!: TemplateRef<any>;
  // Table column configs
  usersColumns: TableColumn[] = [];
  addressesColumns: TableColumn[] = [];
  shopOrdersColumns: TableColumn[] = [];
  manualEntriesColumns: TableColumn[] = [];
  managedClientsColumns: TableColumn[] = [];

  // Mode tracking
  isEditMode = signal(false);
  accountId = signal<string | null>(null);

  // Account data - starts empty
  account = signal<Account>({ ...EMPTY_ACCOUNT });

  // Users data - starts empty, loaded in edit mode
  clientUsers = signal<{ id: number; fullName: string; email: string; role: string; isActive: boolean }[]>([]);

  // Addresses data - starts empty, loaded in edit mode
  addresses = signal<Address[]>([]);

  // Shop orders data - starts empty, loaded in edit mode (server-side paginated)
  shopOrders = signal<ShopOrder[]>([]);
  ordersPage = signal(1);
  readonly ordersItemsPerPage = 30;
  ordersTotalItems = signal(0);
  ordersShowingFrom = computed(() => this.ordersTotalItems() === 0 ? 0 : (this.ordersPage() - 1) * this.ordersItemsPerPage + 1);
  ordersShowingTo = computed(() => Math.min(this.ordersPage() * this.ordersItemsPerPage, this.ordersTotalItems()));
  private ordersClientCode: string | null = null;

  // Manual entries data - starts empty, loaded in edit mode
  manualEntries = signal<ShopOrder[]>([]);

  // Tabs configuration — "Managed clients" only shows for client agents
  tabs = computed<TabItem[]>(() => {
    const base: TabItem[] = [
      { id: 'users', label: 'Users' },
      { id: 'addresses', label: 'Addresses' },
      { id: 'shop-orders', label: 'Shop orders' }
    ];
    if (this.isClientAgent()) {
      base.push({ id: 'managed-clients', label: 'Managed clients' });
    }
    return base;
  });

  activeTab = signal('users');

  // Dropdown state
  openDropdownId = signal<number | string | null>(null);

  // Form state
  isActive = signal(true);
  isClientAgent = signal(false);

  // Managed clients (client-agent only)
  managedClients = signal<{ id: number; name: string; code: string }[]>([]);
  isManagedClientModalOpen = signal(false);
  availableClients = signal<{ id: number; name: string; code: string }[]>([]);
  filteredAvailableClients = signal<{ id: number; name: string; code: string }[]>([]);
  managedClientSearchQuery = signal('');
  isLoadingAvailableClients = signal(false);
  private allClients: { id: number; name: string; code: string }[] = [];
  private allClientsLoaded = false;

  // Address modal state
  isAddressModalOpen = signal(false);
  selectedAddress = signal<Address | null>(null);
  isAddressSaving = signal(false);
  countries = signal<CountryOption[]>([]);

  // User assignment modal state
  isUserModalOpen = signal(false);
  unassignedUsers = signal<{ id: number; fullName: string; email: string; role: string }[]>([]);
  filteredUnassignedUsers = signal<{ id: number; fullName: string; email: string; role: string }[]>([]);
  userSearchQuery = signal('');
  isLoadingUnassignedUsers = signal(false);

  // Validation state
  touched = signal<Record<string, boolean>>({});
  errors = computed(() => {
    const account = this.account();
    const errs: Record<string, string> = {};
    if (!account.name?.trim()) errs['name'] = 'Title is required';
    if (!account.code?.trim()) errs['code'] = 'Code is required';
    else if (account.code.trim().length < 2) errs['code'] = 'Code must be at least 2 characters';
    return errs;
  });
  isValid = computed(() => Object.keys(this.errors()).length === 0);

  // Account group options - loaded from API
  accountGroupOptions = signal<{ value: string; label: string }[]>([]);

  // Handle account group change
  onAccountGroupChange(value: string | number): void {
    this.account.update(a => ({ ...a, accountGroupId: Number(value) }));
  }

  // Clear account group
  clearAccountGroup(): void {
    this.account.update(a => ({ ...a, accountGroupId: undefined }));
  }

  // Table actions
  userActions: TableAction[] = [
    { id: 'edit', label: 'Edit', icon: 'pencil' },
    { id: 'remove', label: 'Remove from client', icon: 'trash', variant: 'danger' }
  ];

  addressActions: TableAction[] = [
    { id: 'edit', label: 'Edit', icon: 'pencil' },
    { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' }
  ];

  orderActions: TableAction[] = [
    { id: 'view', label: 'View', icon: 'eye' },
    { id: 'edit', label: 'Edit', icon: 'pencil' }
  ];

  managedClientActions: TableAction[] = [
    { id: 'remove', label: 'Remove', icon: 'trash', variant: 'danger' }
  ];

  ngOnInit(): void {
    // Load account groups and countries for dropdowns
    this.loadAccountGroups();
    this.loadCountries();

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
    // Users columns
    this.usersColumns = [
      { key: 'id', label: 'Id', sortable: true, width: '88px' },
      { key: 'fullName', label: 'Name', sortable: true },
      { key: 'email', label: 'Email', sortable: true },
      { key: 'role', label: 'Role', width: '140px', template: this.userRoleTemplate },
      { key: 'isActive', label: 'Status', sortable: true, width: '104px', template: this.userStatusTemplate },
      { key: 'actions', label: '', width: '64px', template: this.userActionsTemplate }
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

    // Managed clients columns
    this.managedClientsColumns = [
      { key: 'id', label: 'Id', sortable: true, width: '88px' },
      { key: 'name', label: 'Name', sortable: true },
      { key: 'code', label: 'Code', sortable: true, width: '160px' },
      { key: 'actions', label: '', width: '64px', template: this.managedClientActionsTemplate }
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
    this.clientUsers.set([]);
    this.addresses.set([]);
    this.shopOrders.set([]);
    this.ordersPage.set(1);
    this.ordersTotalItems.set(0);
    this.ordersClientCode = null;
    this.manualEntries.set([]);
    this.isActive.set(true);
    this.isClientAgent.set(false);
    this.managedClients.set([]);
    this.activeTab.set('users');
    this.touched.set({});
    this.cdr.markForCheck();
  }

  private loadAccountGroups(): void {
    this.accountGroupService.getAllAccountGroups().subscribe({
      next: (response) => {
        this.accountGroupOptions.set(
          (response.member || []).map(g => ({ value: String(g.id), label: g.name }))
        );
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error loading account groups:', err)
    });
  }

  private loadCountries(): void {
    this.countryService.getAllCountries().subscribe({
      next: (response) => {
        this.countries.set(
          (response.member || []).map(c => ({ id: c.id, name: c.name, code: c.code }))
        );
      },
      error: (err) => console.error('Error loading countries:', err)
    });
  }

  private loadAccount(id: string): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.touched.set({});
    this.ordersPage.set(1);

    // Users and addresses only depend on the route id, so load them in
    // parallel with the client itself instead of waiting for it.
    this.loadClientUsers(id);
    this.loadClientAddresses(id);

    this.clientService.getClient(id).subscribe({
      next: (client) => {
        this.account.set(this.mapClientToAccount(client));
        this.manualEntries.set([]);
        this.isActive.set(client.isActive ?? true);
        this.isClientAgent.set(client.isClientAgent ?? false);
        this.setManagedClientsFromDetail(client.managedClients);
        this.isLoading.set(false);
        this.cdr.markForCheck();

        // Load orders for this client (needs the client code from the response)
        if (client.code) {
          this.loadClientOrders(client.code);
        }
      },
      error: (err) => {
        this.loadError.set(err?.message || 'Client not found');
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

  private loadClientUsers(clientId: string): void {
    this.userService.getUsers({ 'client.id': clientId, itemsPerPage: 100 }).subscribe({
      next: (response) => {
        const users = (response.member || []).map((u: any) => ({
          id: u.id,
          fullName: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || '–',
          email: u.email ?? '',
          role: (u.roles || []).includes('ROLE_ADMIN') ? 'Admin' :
                (u.roles || []).includes('ROLE_CLIENT_ADMIN') ? 'Client Admin' :
                (u.roles || []).includes('ROLE_FINANCE') ? 'Finance' :
                (u.roles || []).includes('ROLE_CLIENT') ? 'Client' : 'User',
          isActive: u.isActive ?? true
        }));
        this.clientUsers.set(users);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.clientUsers.set([]);
      }
    });
  }

  private mapClientAddressesToAddresses(clientAddresses: ClientAddress[]): Address[] {
    return clientAddresses.map(addr => ({
      id: addr.id,
      street: addr.street,
      city: addr.city,
      postalCode: addr.postalCode ?? '',
      countryId: addr.country?.id ? String(addr.country.id) : '',
      country: addr.country?.name ?? '',
      isBilling: addr.isBilling,
      isDelivery: addr.isDelivery
    }));
  }

  private loadClientOrders(clientCode: string): void {
    this.ordersClientCode = clientCode;
    this.orderService.getOrders({
      page: this.ordersPage(),
      itemsPerPage: this.ordersItemsPerPage,
      'order[createdAt]': 'desc',
      'user.client.code': clientCode
    }).subscribe({
      next: (response) => {
        this.shopOrders.set(this.mapOrdersToShopOrders(response.orders));
        this.ordersTotalItems.set(response.totalOrders || 0);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading orders:', err);
        this.shopOrders.set([]);
        this.ordersTotalItems.set(0);
        this.cdr.markForCheck();
      }
    });
  }

  onOrdersPageChange(page: number): void {
    this.ordersPage.set(page);
    if (this.ordersClientCode) {
      this.loadClientOrders(this.ordersClientCode);
    }
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
      partsOrdered: order.itemsCount ?? 0,
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
      vatNumber: c.vatNumber ?? '',
      name: c.name ?? '',
      email: c.email ?? '',
      status: c.isActive ? 'active' : 'inactive',
      isActive: c.isActive,
      accountGroupId: c.accountGroup?.id ?? undefined,
      phone: c.phoneNumber,
      otherPhone: c.otherPhone ?? '',
      otherEmail: c.otherEmail ?? '',
      fax: c.fax ?? '',
      web: c.web ?? '',
      purchaseLimit: c.purchaseLimit ? parseFloat(c.purchaseLimit) : 0,
      amountSpent: c.amountSpent ? parseFloat(c.amountSpent) : 0,
    };
  }


  // Computed values
  totalUsers = computed(() => this.clientUsers().length);
  totalAddresses = computed(() => this.addresses().length);
  totalShopOrders = computed(() => this.ordersTotalItems());
  totalManualEntries = computed(() => this.manualEntries().length);
  totalManagedClients = computed(() => this.managedClients().length);
  // Get current tab count
  currentTabCount = computed(() => {
    switch (this.activeTab()) {
      case 'users': return this.totalUsers();
      case 'addresses': return this.totalAddresses();
      case 'shop-orders': return this.totalShopOrders();
      case 'manual-entries': return this.totalManualEntries();
      case 'managed-clients': return this.totalManagedClients();
      default: return 0;
    }
  });

  // Get add button text based on active tab
  addButtonText = computed(() => {
    switch (this.activeTab()) {
      case 'users': return 'Add user';
      case 'addresses': return 'Add address';
      case 'shop-orders': return 'Add order';
      case 'manual-entries': return 'Add entry';
      case 'managed-clients': return 'Add client';
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

  onClientAgentChange(value: boolean): void {
    this.isClientAgent.set(value);
    if (value) {
      // Preload the client list so the "Managed clients" tab/modal is ready
      this.ensureClientsLoaded();
    } else if (this.activeTab() === 'managed-clients') {
      // The tab disappears when the flag is off — fall back to a visible tab
      this.activeTab.set('users');
    }
  }

  updateAccount(field: keyof Account, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.account.update(a => ({ ...a, [field]: value }));
    this.touched.update(t => ({ ...t, [field]: true }));
  }

  markAllTouched(): void {
    this.touched.set({ name: true, code: true, email: true });
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

  onUserActionClick(event: ActionClickEvent): void {
    const user = event.row as { id: number; fullName: string; email: string };
    switch (event.actionId) {
      case 'edit':
        this.router.navigate(['/admin/users', user.id, 'edit']);
        this.closeDropdown();
        break;
      case 'remove':
        this.removeUserFromClient(user);
        this.closeDropdown();
        break;
    }
  }

  private removeUserFromClient(user: { id: number }): void {
    this.userService.updateUser(String(user.id), { client: null } as any).subscribe({
      next: () => {
        this.clientUsers.update(users => users.filter(u => u.id !== user.id));
        this.toastService.success('User removed from client');
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error removing user:', err)
    });
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
      vatNumber: account.vatNumber?.trim() || null,
      phoneNumber: account.phone?.trim() || null,
      otherPhone: account.otherPhone?.trim() || null,
      otherEmail: account.otherEmail?.trim() || null,
      fax: account.fax?.trim() || null,
      web: account.web?.trim() || null,
      purchaseLimit: account.purchaseLimit?.toString() || null,
      isActive: this.isActive(),
      isClientAgent: this.isClientAgent(),
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
          this.router.navigate(['/admin/clients/list']);
        } else if (isCreating && result?.id) {
          // After creating, navigate to edit page for the new client
          this.router.navigate(['/admin/clients', result.id, 'edit']);
        }
        // If editing and not navigating, just stay on page (data already saved)
      },
      error: (error) => {
        console.error('Error saving account:', error);
        this.toastService.error('Failed to save account');
      }
    });
  }

  onAddTabItem(): void {
    if (this.activeTab() === 'addresses') {
      this.openAddressModal();
    } else if (this.activeTab() === 'users') {
      this.openUserModal();
    } else if (this.activeTab() === 'managed-clients') {
      this.openManagedClientModal();
    }
  }

  // ---- Managed clients (client-agent only) ----

  /** Build the managed-clients table from the IRIs (or embedded objects) on the detail. */
  private setManagedClientsFromDetail(raw: unknown): void {
    const ids = (Array.isArray(raw) ? raw : [])
      .map((m: any) => (typeof m === 'string' ? this.idFromIri(m) : m?.id))
      .filter((id: any): id is number => typeof id === 'number' && !Number.isNaN(id));

    if (ids.length === 0) {
      this.managedClients.set([]);
      return;
    }

    this.ensureClientsLoaded(() => {
      const byId = new Map(this.allClients.map(c => [c.id, c]));
      this.managedClients.set(ids.map(id => byId.get(id) ?? { id, name: `Client #${id}`, code: '' }));
      this.cdr.markForCheck();
    });
  }

  private idFromIri(iri: string): number {
    const match = iri.match(/\/(\d+)(?:\/)?$/);
    return match ? Number(match[1]) : NaN;
  }

  /** Fetch the full client list once (used to resolve names + populate the picker). */
  private ensureClientsLoaded(cb?: () => void): void {
    if (this.allClientsLoaded) {
      cb?.();
      return;
    }
    this.isLoadingAvailableClients.set(true);
    this.clientService.getClients({ itemsPerPage: 1000, 'order[name]': 'asc' }).subscribe({
      next: (res) => {
        this.allClients = (res.clients || []).map(c => ({ id: c.id, name: c.name, code: c.code }));
        this.allClientsLoaded = true;
        this.isLoadingAvailableClients.set(false);
        cb?.();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading clients:', err);
        this.isLoadingAvailableClients.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  openManagedClientModal(): void {
    this.isManagedClientModalOpen.set(true);
    this.managedClientSearchQuery.set('');
    this.ensureClientsLoaded(() => this.refreshAvailableClients());
    this.refreshAvailableClients();
  }

  closeManagedClientModal(): void {
    this.isManagedClientModalOpen.set(false);
    this.managedClientSearchQuery.set('');
  }

  /** Candidates = all clients except this one and the already-managed ones. */
  private refreshAvailableClients(): void {
    const selfId = this.account().id;
    const managedIds = new Set(this.managedClients().map(c => c.id));
    this.availableClients.set(
      this.allClients.filter(c => c.id !== selfId && !managedIds.has(c.id))
    );
    this.applyManagedClientFilter();
  }

  onManagedClientSearchChange(event: Event): void {
    this.managedClientSearchQuery.set((event.target as HTMLInputElement).value.toLowerCase().trim());
    this.applyManagedClientFilter();
  }

  private applyManagedClientFilter(): void {
    const q = this.managedClientSearchQuery();
    const list = this.availableClients();
    this.filteredAvailableClients.set(
      !q ? list : list.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
    );
  }

  addManagedClient(client: { id: number; name: string; code: string }): void {
    this.managedClients.update(list => [...list, client]);
    this.refreshAvailableClients();
    this.persistManagedClients();
  }

  onManagedClientActionClick(event: ActionClickEvent): void {
    this.closeDropdown();
    if (event.actionId === 'remove') {
      this.removeManagedClient(event.row as { id: number });
    }
  }

  removeManagedClient(client: { id: number }): void {
    this.managedClients.update(list => list.filter(c => c.id !== client.id));
    this.refreshAvailableClients();
    this.persistManagedClients();
  }

  /** Persist the managed-clients relation via PATCH (sends IRIs). */
  private persistManagedClients(): void {
    const clientId = this.accountId();
    if (!clientId) {
      return;
    }
    const managedClients = this.managedClients().map(c => `/api/v1/clients/${c.id}`);
    this.clientService.updateClient(clientId, { managedClients } as any).subscribe({
      next: () => {
        this.toastService.success('Managed clients updated');
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error updating managed clients:', err);
        this.toastService.error('Failed to update managed clients');
      }
    });
  }

  // User assignment modal methods
  openUserModal(): void {
    this.isUserModalOpen.set(true);
    this.userSearchQuery.set('');
    this.loadUnassignedUsers();
  }

  closeUserModal(): void {
    this.isUserModalOpen.set(false);
    this.unassignedUsers.set([]);
    this.filteredUnassignedUsers.set([]);
    this.userSearchQuery.set('');
  }

  private loadUnassignedUsers(): void {
    this.isLoadingUnassignedUsers.set(true);
    this.userService.getUsers({ hasClient: false, itemsPerPage: 200 }).subscribe({
      next: (response) => {
        const assignedIds = new Set(this.clientUsers().map(u => u.id));
        const users = (response.member || [])
          .filter((u: any) => !assignedIds.has(u.id))
          .map((u: any) => ({
            id: u.id,
            fullName: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || '–',
            email: u.email ?? '',
            role: (u.roles || []).includes('ROLE_ADMIN') ? 'Admin' :
                  (u.roles || []).includes('ROLE_CLIENT_ADMIN') ? 'Client Admin' :
                  (u.roles || []).includes('ROLE_FINANCE') ? 'Finance' :
                  (u.roles || []).includes('ROLE_CLIENT') ? 'Client' : 'User'
          }));
        this.unassignedUsers.set(users);
        this.filteredUnassignedUsers.set(users);
        this.isLoadingUnassignedUsers.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading unassigned users:', err);
        this.isLoadingUnassignedUsers.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  onUserSearchChange(event: Event): void {
    const query = (event.target as HTMLInputElement).value.toLowerCase().trim();
    this.userSearchQuery.set(query);
    if (!query) {
      this.filteredUnassignedUsers.set(this.unassignedUsers());
    } else {
      this.filteredUnassignedUsers.set(
        this.unassignedUsers().filter(u =>
          u.fullName.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query)
        )
      );
    }
  }

  assignUserToClient(user: { id: number; fullName: string; email: string; role: string }): void {
    const clientId = this.accountId();
    if (!clientId) return;

    this.userService.updateUser(String(user.id), { client: `/api/v1/clients/${clientId}` } as any).subscribe({
      next: () => {
        // Add to client users list
        this.clientUsers.update(users => [...users, { ...user, isActive: true }]);
        // Remove from unassigned list
        this.unassignedUsers.update(users => users.filter(u => u.id !== user.id));
        this.filteredUnassignedUsers.update(users => users.filter(u => u.id !== user.id));
        this.toastService.success(`${user.fullName} assigned to client`);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error assigning user:', err);
        this.toastService.error('Failed to assign user');
      }
    });
  }

  navigateToCreateUser(): void {
    const account = this.account();
    this.closeUserModal();
    this.router.navigate(['/admin/users/new'], {
      queryParams: { clientId: account.id, clientName: account.name }
    });
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

    const countryIri = formData.countryId ? `/api/v1/countries/${formData.countryId}` : undefined;

    if (formData.id !== undefined) {
      // Update existing address
      this.addressService.updateAddress(String(formData.id), {
        street: formData.street,
        city: formData.city,
        postalCode: formData.postalCode || undefined,
        country: countryIri,
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
        postalCode: formData.postalCode || undefined,
        country: countryIri,
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

  updatePurchaseLimit(event: Event): void {
    const value = parseFloat((event.target as HTMLInputElement).value) || 0;
    this.account.update(a => ({ ...a, purchaseLimit: value }));
  }

  formatCurrency(value: number | undefined): string {
    if (value === undefined) return '–';
    return `€ ${value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
