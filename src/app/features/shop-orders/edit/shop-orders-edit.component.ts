import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, OnInit, OnDestroy, inject, ViewChild, TemplateRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap, finalize } from 'rxjs';

import { BreadcrumbsComponent, BreadcrumbItem } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { BadgeComponent, BadgeVariant } from '@app/ui-kit/atoms/badge/badge.component';
import { ToggleComponent } from '@app/ui-kit/atoms/toggle/toggle.component';
import { FormFieldComponent } from '@app/ui-kit/molecules/form-field/form-field.component';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { DataTableComponent, TableColumn } from '@app/ui-kit/organisms/data-table/data-table.component';
import { SelectComponent, SelectOption } from '@app/ui-kit/atoms/select/select.component';
import { OrderService } from '@core/services/http/order.service';
import { DeliveryTypeService } from '@core/services/http/delivery-type.service';
import { PaymentTypeService } from '@core/services/http/payment-type.service';
import { UserService } from '@core/services/http/user.service';
import { ClientService } from '@core/services/http/client.service';
import { AddressService } from '@core/services/http/address.service';
import { Order } from '@core/models/order.model';
import { Client, ClientAddress } from '@core/models/client.model';
import { ToastService } from '@app/ui-kit/organisms/toast-container/toast-container.component';
import { AlertService } from '@services/alert.service';
import { LoggerService } from '@core/services/logger.service';

// Interfaces
interface OrderProduct {
  partNo: string;
  productName: string;
  weight: string;
  quantity: number;
  unitPrice: number;
  discount: string;
  price: number;
}

interface ProductGroup {
  id: number | string;
  name: string;
  products: OrderProduct[];
  isExpanded: boolean;
}

/** Agent orders: product groups bucketed by the managed client they were ordered for. */
interface ClientGroup {
  clientId: string;
  clientName: string;
  clientCode: string;
  productGroups: ProductGroup[];
}

interface LogMessage {
  status: string;
  statusVariant: BadgeVariant;
  dateTime: string;
  user: string;
  message: string;
}

interface ShopOrderDetail {
  id: number;
  internalRef: string;
  dateCreated: string;
  partsOrdered: number;
  status: string;
  enableSale: boolean;
  accountId: string;  // Client ID for dropdown
  account: string;    // Client name for display
  contactId: string;  // User ID for dropdown
  contact: string;    // User name for display
  contactDropdown: string;
  billingAddress: string;
  shippingAddress: string;
  date: string;
  paymentType: string;
  deliveryType: string;
  trackingNumber: string;
  trackingCarrier: string;
  trackingUrl: string;
  cancellationReason: string;
  dispatchedAt: string;
  priceWithoutTax: number;
  totalPrice: number;
  priceTax: number;
  productGroups: ProductGroup[];
  subtotalBeforeDiscount: number;
  totalDiscount: number;
  orderTotal: number;
  logMessages: LogMessage[];
  // Agent (on-behalf-of) presentation
  isAgentOrder: boolean;
  agentName: string;
  agentEmail: string;
  clientGroups: ClientGroup[];
}

const EMPTY_ORDER: ShopOrderDetail = {
  id: 0,
  internalRef: '',
  dateCreated: '',
  partsOrdered: 0,
  status: 'new',
  enableSale: false,
  accountId: '',
  account: '',
  contactId: '',
  contact: '',
  contactDropdown: '',
  billingAddress: '',
  shippingAddress: '',
  date: '',
  paymentType: '',
  deliveryType: '',
  trackingNumber: '',
  trackingCarrier: '',
  trackingUrl: '',
  cancellationReason: '',
  dispatchedAt: '',
  priceWithoutTax: 0,
  totalPrice: 0,
  priceTax: 0,
  productGroups: [],
  subtotalBeforeDiscount: 0,
  totalDiscount: 0,
  orderTotal: 0,
  logMessages: [],
  isAgentOrder: false,
  agentName: '',
  agentEmail: '',
  clientGroups: []
};

@Component({
  selector: 'app-shop-orders-edit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    BreadcrumbsComponent,
    BadgeComponent,
    ToggleComponent,
    FormFieldComponent,
    IconComponent,
    DataTableComponent,
    SelectComponent
  ],
  templateUrl: './shop-orders-edit.component.html',
  styleUrls: ['./shop-orders-edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShopOrdersEditComponent implements OnInit, OnDestroy, AfterViewInit {
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(OrderService);
  private deliveryTypeService = inject(DeliveryTypeService);
  private paymentTypeService = inject(PaymentTypeService);
  private userService = inject(UserService);
  private clientService = inject(ClientService);
  private addressService = inject(AddressService);
  private toastService = inject(ToastService);
  private alertService = inject(AlertService);
  private logger = inject(LoggerService);
  private destroy$ = new Subject<void>();

  isLoading = signal(true);
  isSaving = signal(false);
  loadError = signal<string | null>(null);

  // Template references for custom cell rendering
  @ViewChild('unitPriceTemplate') unitPriceTemplate!: TemplateRef<any>;
  @ViewChild('priceTemplate') priceTemplate!: TemplateRef<any>;
  @ViewChild('logStatusTemplate') logStatusTemplate!: TemplateRef<any>;

  // Breadcrumb items
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Shop orders', route: '/admin/shop-orders' }
  ];

  // Order data
  order = signal<ShopOrderDetail>({ ...EMPTY_ORDER });

  // Products table columns (initialized in ngAfterViewInit)
  productsColumns: TableColumn[] = [];

  // Log messages table columns (initialized in ngAfterViewInit)
  logColumns: TableColumn[] = [];

  // Dropdown options - loaded from backend
  accountOptions = signal<SelectOption[]>([]);
  contactOptions = signal<SelectOption[]>([]);
  billingAddressOptions = signal<SelectOption[]>([]);
  shippingAddressOptions = signal<SelectOption[]>([]);

  // Store loaded client addresses
  private loadedAddresses: ClientAddress[] = [];

  // Store loaded clients to look up client code when account changes
  private loadedClients: Array<{ id: number; code: string }> = [];
  // Server-side client typeahead state
  private clientSearch$ = new Subject<string>();
  private initialClientsLoaded = false;
  // Store loaded users to look up addresses when contact changes
  private loadedUsers: Array<{ id: number; address?: string }> = [];

  // Order status options
  orderStatusOptions: SelectOption[] = [
    { value: 'draft', label: 'Draft' },
    { value: 'new', label: 'New' },
    { value: 'in_process', label: 'In process' },
    { value: 'waiting_for_payment', label: 'Waiting for payment' },
    { value: 'ready_for_shipment', label: 'Ready for shipment' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'canceled', label: 'Canceled' },
    { value: 'reversal', label: 'Reversal' }
  ];

  get statusOptions(): SelectOption[] {
    return this.orderStatusOptions;
  }

  // Dropdown options - loaded from backend
  paymentTypeOptions = signal<SelectOption[]>([]);
  deliveryTypeOptions = signal<SelectOption[]>([]);

  // Selected values as signals for reactive validation
  selectedAccount = signal('');
  selectedContact = signal('');
  selectedBillingAddress = signal('');
  selectedShippingAddress = signal('');
  selectedStatus = signal('');
  selectedPaymentType = signal('');
  selectedDeliveryType = signal('');

  // Validation state
  touched = signal<Record<string, boolean>>({});
  errors = computed(() => {
    const errs: Record<string, string> = {};
    if (!this.selectedAccount()) errs['account'] = 'Account is required';
    if (!this.selectedContact()) errs['contact'] = 'Contact is required';
    if (!this.selectedBillingAddress()) errs['billingAddress'] = 'Billing address is required';
    if (!this.selectedShippingAddress()) errs['shippingAddress'] = 'Shipping address is required';
    if (!this.selectedStatus()) errs['status'] = 'Status is required';
    if (this.order().status === 'canceled' && !this.order().cancellationReason.trim()) {
      errs['cancellationReason'] = 'Cancellation reason is required when canceling an order';
    }
    return errs;
  });
  isValid = computed(() => Object.keys(this.errors()).length === 0);

  showError(field: string): boolean {
    return !!this.touched()[field] && !!this.errors()[field];
  }

  getError(field: string): string {
    return this.touched()[field] ? (this.errors()[field] || '') : '';
  }

  markAllTouched(): void {
    this.touched.set({
      account: true,
      contact: true,
      billingAddress: true,
      shippingAddress: true,
      status: true,
      cancellationReason: true
    });
  }

  ngOnInit(): void {
    // Load dropdown options from backend
    this.setupClientSearch();
    this.loadDeliveryTypes();
    this.loadPaymentTypes();

    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const orderId = params.get('id');
        if (orderId) {
          this.loadOrder(orderId);
        }
      });
  }

  private loadDeliveryTypes(): void {
    this.deliveryTypeService.getAllDeliveryTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const options = response.member
            .filter(dt => dt.isActive)
            .map(dt => ({ value: dt.id, label: dt.name, carrierCode: (dt as any).carrierCode ?? '' }));
          this.deliveryTypeOptions.set(options);
          this.cdr.markForCheck();
        },
        error: (err) => this.logger.error('[ShopOrdersEdit] Error loading delivery types:', err)
      });
  }

  private loadPaymentTypes(): void {
    this.paymentTypeService.getAllPaymentTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const options = response.member
            .filter(pt => pt.isActive)
            .map(pt => ({ value: pt.id, label: pt.name }));
          this.paymentTypeOptions.set(options);
          this.cdr.markForCheck();
        },
        error: (err) => this.logger.error('[ShopOrdersEdit] Error loading payment types:', err)
      });
  }

  private setupClientSearch(): void {
    // Server-side client typeahead (instead of fetching 500 clients up front).
    // switchMap cancels in-flight lookups when the user keeps typing.
    this.clientSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => this.clientService.getClients({
        page: 1,
        itemsPerPage: 20,
        'order[name]': 'asc',
        ...(term.trim() ? { search: term.trim() } : {})
      })),
      takeUntil(this.destroy$)
    ).subscribe(response => this.applyClientSearchResults(response.clients));

    // Load the initial page of clients
    this.clientSearch$.next('');
  }

  onAccountSearch(term: string): void {
    this.clientSearch$.next(term);
  }

  private applyClientSearchResults(clients: Client[]): void {
    const activeClients = (clients || []).filter(c => c.isActive);

    // Remember client codes so contacts/addresses can be loaded on selection
    activeClients.forEach(c => {
      if (!this.loadedClients.some(lc => String(lc.id) === String(c.id))) {
        this.loadedClients.push({ id: c.id, code: c.code });
      }
    });

    const options: SelectOption[] = activeClients.map(c => ({
      value: c.id,
      label: c.name || c.code
    }));

    // Keep the currently selected account present in the options
    const currentOrder = this.order();
    if (currentOrder.accountId && !options.some(o => String(o.value) === currentOrder.accountId)) {
      options.unshift({ value: currentOrder.accountId, label: currentOrder.account || currentOrder.accountId });
    }
    this.accountOptions.set(options);

    // On the first response only: if the order was already loaded, ensure its
    // account is selected and its contacts/addresses are loaded.
    if (!this.initialClientsLoaded) {
      this.initialClientsLoaded = true;
      if (currentOrder.accountId) {
        this.selectedAccount.set(currentOrder.accountId);
        const client = this.loadedClients.find(c => String(c.id) === currentOrder.accountId);
        if (client?.code) {
          this.loadContactsAndAddresses(client.code, String(client.id));
        }
      }
    }

    this.cdr.markForCheck();
  }

  private loadContactsAndAddresses(clientCode: string, clientId?: string): void {
    if (!clientCode) return;

    // Load contacts (users) for this client
    this.userService.getUsers({ 'client.code': clientCode, itemsPerPage: 100 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Store users for address lookup when contact changes
          this.loadedUsers = response.member
            .filter(u => u.isActive !== false)
            .map(u => ({ id: u.id, address: u.address }));

          // Map users to contact options
          const contacts = this.loadedUsers.map(u => {
            const member = response.member.find(m => m.id === u.id);
            return {
              value: u.id,
              label: member ? (`${member.firstName} ${member.lastName}`.trim() || member.email) : String(u.id)
            };
          });
          this.contactOptions.set(contacts);
          this.cdr.markForCheck();
        },
        error: (err) => this.logger.error('[ShopOrdersEdit] Error loading contacts:', err)
      });

    // Load addresses for this client from the Address API
    if (clientId) {
      this.loadClientAddresses(clientId);
    }
  }

  private loadClientAddresses(clientId: string): void {
    this.addressService.getAddressesByClient(clientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (addresses) => {
          this.loadedAddresses = addresses;

          // Filter billing addresses (isBilling = true or all if none marked as billing)
          const billingAddresses = addresses.filter(a => a.isBilling && a.isActive);
          const billingOptions = billingAddresses.length > 0
            ? billingAddresses.map(a => ({
                value: a.id,
                label: `${a.street}, ${a.city}${a.country?.name ? ', ' + a.country.name : ''}`
              }))
            : addresses.filter(a => a.isActive).map(a => ({
                value: a.id,
                label: `${a.street}, ${a.city}${a.country?.name ? ', ' + a.country.name : ''}`
              }));
          this.billingAddressOptions.set(billingOptions);

          // Filter shipping/delivery addresses (isDelivery = true or all if none marked)
          const shippingAddresses = addresses.filter(a => a.isDelivery && a.isActive);
          const shippingOptions = shippingAddresses.length > 0
            ? shippingAddresses.map(a => ({
                value: a.id,
                label: `${a.street}, ${a.city}${a.country?.name ? ', ' + a.country.name : ''}`
              }))
            : addresses.filter(a => a.isActive).map(a => ({
                value: a.id,
                label: `${a.street}, ${a.city}${a.country?.name ? ', ' + a.country.name : ''}`
              }));
          this.shippingAddressOptions.set(shippingOptions);

          // Try to match the order's address strings to Address entity IDs
          // Match billing against billing-flagged addresses first, shipping against delivery-flagged first
          const currentOrder = this.order();

          if (currentOrder.billingAddress) {
            const matchedBilling = this.findMatchingAddressId(currentOrder.billingAddress, billingAddresses.length > 0 ? billingAddresses : addresses)
              || this.findMatchingAddressId(currentOrder.billingAddress, addresses);
            if (matchedBilling) {
              this.selectedBillingAddress.set(matchedBilling);
            }
          }

          if (currentOrder.shippingAddress) {
            const matchedShipping = this.findMatchingAddressId(currentOrder.shippingAddress, shippingAddresses.length > 0 ? shippingAddresses : addresses)
              || this.findMatchingAddressId(currentOrder.shippingAddress, addresses);
            if (matchedShipping) {
              this.selectedShippingAddress.set(matchedShipping);
            }
          }

          this.cdr.markForCheck();
        },
        error: (err) => this.logger.error('[ShopOrdersEdit] Error loading addresses:', err)
      });
  }

  private findMatchingAddressId(addressString: string, addresses: ClientAddress[]): string | null {
    if (!addressString) return null;

    // Normalize the address string for comparison
    const normalizedSearch = addressString.toLowerCase().trim();

    for (const addr of addresses) {
      // Build possible address string formats to match against
      const formats = [
        `${addr.street}, ${addr.city}`,
        `${addr.street}, ${addr.postalCode} ${addr.city}`,
        `${addr.street}, ${addr.postalCode} ${addr.city}, ${addr.country?.name || ''}`,
        `${addr.street}, ${addr.city}, ${addr.country?.name || ''}`,
        `${addr.street}, ${addr.postalCode}, ${addr.city}`,
        `${addr.street}, ${addr.city}${addr.country?.name ? ', ' + addr.country.name : ''}`
      ];

      for (const format of formats) {
        const normalizedFormat = format.toLowerCase().trim();
        // Check if the order address contains the key parts of this address
        if (normalizedSearch.includes(addr.street.toLowerCase()) &&
            normalizedSearch.includes(addr.city.toLowerCase())) {
          return String(addr.id);
        }
        // Also check for exact match
        if (normalizedSearch === normalizedFormat) {
          return String(addr.id);
        }
      }
    }

    return null;
  }

  ngAfterViewInit(): void {
    // Initialize columns with templates
    this.productsColumns = [
      { key: 'partNo', label: 'Part no.', width: '140px' },
      { key: 'productName', label: 'Product name' },
      { key: 'weight', label: 'Weight', width: '100px' },
      { key: 'quantity', label: 'Quantity', width: '100px' },
      { key: 'unitPrice', label: 'Unit price', width: '120px', template: this.unitPriceTemplate },
      { key: 'discount', label: 'Discount', width: '100px' },
      { key: 'price', label: 'Price', width: '140px', template: this.priceTemplate }
    ];

    this.logColumns = [
      { key: 'status', label: 'Status', width: '180px', template: this.logStatusTemplate },
      { key: 'dateTime', label: 'Date & Time', width: '160px' },
      { key: 'user', label: 'User', width: '200px' },
      { key: 'message', label: 'Message' }
    ];

    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadOrder(id: string): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.orderService.getOrder(id).subscribe({
      next: (order) => {
        const detail = this.mapOrderToDetail(order);
        this.applyOrderDetail(detail);
        // Populate tracking events from the order response
        const events = ((order as any).trackingEvents || []) as Array<any>;
        this.trackingEvents.set(events.map(e => ({
          id: e.id,
          status: e.status,
          location: e.location ?? null,
          description: e.description ?? null,
          occurredAt: e.occurredAt,
          source: e.source ?? 'manual',
        })));
        // Load contacts and addresses based on client
        const clientCode = (order.user as { client?: { code?: string } })?.client?.code;
        const clientId = (order.user as { client?: { id?: number } })?.client?.id;
        // Register the order's client for code lookups and make sure it is
        // present in the (typeahead-driven) account options.
        if (clientId != null && clientCode && !this.loadedClients.some(c => String(c.id) === String(clientId))) {
          this.loadedClients.push({ id: clientId, code: clientCode });
        }
        if (detail.accountId && !this.accountOptions().some(o => String(o.value) === detail.accountId)) {
          this.accountOptions.set([
            { value: detail.accountId, label: detail.account || detail.accountId },
            ...this.accountOptions()
          ]);
        }
        if (clientCode) {
          this.loadContactsAndAddresses(clientCode, clientId != null ? String(clientId) : undefined);
        }
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loadError.set(err?.message || 'Order not found');
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  private mapOrderToDetail(o: Order): ShopOrderDetail {
    const userName = o.user ? `${(o.user as { firstName?: string }).firstName || ''} ${(o.user as { lastName?: string }).lastName || ''}`.trim() || 'Unknown' : 'Unknown';
    const partsCount = o.items?.reduce((sum, i) => sum + (i.quantity || 0), 0) ?? 0;
    // Build one product group per item, and simultaneously bucket them by the
    // managed client each item was ordered on behalf of (agent orders).
    const productGroups: ProductGroup[] = [];
    const clientGroupMap = new Map<string, ClientGroup>();
    (o.items || []).forEach((item, idx) => {
      const group: ProductGroup = {
        id: item.id || String(idx),
        name: item.product?.name || 'Product',
        products: [{
          partNo: item.product?.partNo ?? '',
          productName: item.product?.name ?? '',
          weight: item.product?.weight ?? '',
          quantity: item.quantity ?? 0,
          unitPrice: item.unitPrice ?? 0,
          discount: item.discountPercent ? `${item.discountPercent.toFixed(1)}%` : '0%',
          price: (item.quantity ?? 0) * (item.unitPrice ?? 0)
        }],
        isExpanded: true
      };
      productGroups.push(group);

      const client = item.onBehalfOfClient;
      const key = client?.id != null ? String(client.id) : '_self';
      let cg = clientGroupMap.get(key);
      if (!cg) {
        cg = {
          clientId: key,
          clientName: client?.name ?? 'Own Company',
          clientCode: client?.code ?? '',
          productGroups: []
        };
        clientGroupMap.set(key, cg);
      }
      cg.productGroups.push(group);
    });
    const isAgentOrder = (o.items || []).some(i => !!i.onBehalfOfClient);
    const clientGroups = Array.from(clientGroupMap.values());
    const logMessages: LogMessage[] = (o.logs || []).map(log => ({
      status: this.statusLabelFor(log.newStatus),
      statusVariant: this.getStatusBadgeVariant(log.newStatus),
      dateTime: this.formatDateTime(log.createdAt),
      user: '',
      message: log.comment || ''
    }));
    if (logMessages.length === 0 && o.status) {
      logMessages.push({
        status: this.statusLabelFor(o.status),
        statusVariant: this.getStatusBadgeVariant(o.status),
        dateTime: this.formatDateTime(o.createdAt),
        user: userName,
        message: ''
      });
    }
    return {
      id: o.id,
      internalRef: o.orderNumber || String(o.id),
      dateCreated: this.formatDate(o.createdAt),
      partsOrdered: partsCount,
      status: o.status || 'pending',
      enableSale: !o.isDraft,
      accountId: String((o.user as { client?: { id?: number } })?.client?.id ?? ''),
      account: (o.user as { client?: { name?: string } })?.client?.name ?? '',
      contactId: String((o.user as { id?: number })?.id ?? ''),
      contact: userName,
      contactDropdown: userName,
      billingAddress: o.billingAddress ?? '',
      shippingAddress: o.shippingAddress ?? '',
      date: this.formatDate(o.createdAt),
      paymentType: o.paymentType && typeof o.paymentType === 'object' ? String(o.paymentType.id) : '',
      deliveryType: o.deliveryType && typeof o.deliveryType === 'object' ? String(o.deliveryType.id) : '',
      trackingNumber: (o as any).trackingNumber ?? '',
      trackingCarrier: (o as any).trackingCarrier ?? '',
      trackingUrl: (o as any).trackingUrl ?? '',
      cancellationReason: (o as any).cancellationReason ?? '',
      dispatchedAt: (o as any).dispatchedAt ?? '',
      priceWithoutTax: o.totalAmount ?? 0,
      totalPrice: (o.totalAmount ?? 0) + (o.totalTax ?? 0),
      priceTax: o.totalTax ?? 0,
      productGroups,
      subtotalBeforeDiscount: (o.subtotalBeforeDiscount && o.subtotalBeforeDiscount > 0) ? o.subtotalBeforeDiscount : (o.totalAmount ?? 0),
      totalDiscount: o.totalDiscount ?? 0,
      orderTotal: o.totalAmount ?? 0,
      logMessages,
      isAgentOrder,
      agentName: userName,
      agentEmail: (o.user as { email?: string })?.email ?? '',
      clientGroups
    };
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  formatDateTime(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${this.formatDate(dateStr)} ${hours}:${minutes}`;
  }

  statusLabelFor(status: string): string {
    return this.orderStatusOptions.find(o => o.value === status)?.label ?? status;
  }

  private applyOrderDetail(orderData: ShopOrderDetail): void {
    this.order.set(orderData);
    this.breadcrumbItems = [
      { label: 'Shop orders', route: '/admin/shop-orders' },
      { label: orderData.internalRef ? `#${orderData.internalRef}` : String(orderData.id) }
    ];
    this.selectedAccount.set(orderData.accountId);
    this.selectedContact.set(orderData.contactId);
    // Don't set address signals here — they use string values but dropdowns use IDs.
    // loadClientAddresses() will match the strings to IDs after loading.
    this.selectedStatus.set(orderData.status);
    this.selectedPaymentType.set(orderData.paymentType);
    this.selectedDeliveryType.set(orderData.deliveryType);
    this.cdr.markForCheck();
  }

  // Dropdown change handlers
  onAccountChange(value: string | number): void {
    const option = this.accountOptions().find(o => o.value === value);
    if (option) {
      this.selectedAccount.set(String(value));
      this.order.update(o => ({ ...o, accountId: String(value), account: option.label }));
      this.touched.update(t => ({ ...t, account: true }));

      // Clear contact and addresses when account changes
      this.selectedContact.set('');
      this.selectedBillingAddress.set('');
      this.selectedShippingAddress.set('');
      this.contactOptions.set([]);
      this.billingAddressOptions.set([]);
      this.shippingAddressOptions.set([]);
      this.order.update(o => ({ ...o, contactId: '', contact: '', contactDropdown: '', billingAddress: '', shippingAddress: '' }));

      // Load contacts and addresses for the selected client
      const client = this.loadedClients.find(c => String(c.id) === String(value));
      if (client?.code) {
        this.loadContactsAndAddresses(client.code, String(client.id));
      }
    }
  }

  clearAccount(): void {
    this.selectedAccount.set('');
    this.selectedContact.set('');
    this.selectedBillingAddress.set('');
    this.selectedShippingAddress.set('');
    this.contactOptions.set([]);
    this.billingAddressOptions.set([]);
    this.shippingAddressOptions.set([]);
    this.order.update(o => ({ ...o, accountId: '', account: '', contactId: '', contact: '', contactDropdown: '', billingAddress: '', shippingAddress: '' }));
    this.touched.update(t => ({ ...t, account: true, contact: true, billingAddress: true, shippingAddress: true }));
  }

  onContactChange(value: string | number): void {
    const option = this.contactOptions().find(o => o.value === value);
    if (option) {
      this.selectedContact.set(String(value));
      this.order.update(o => ({ ...o, contactId: String(value), contact: option.label, contactDropdown: String(value) }));
      this.touched.update(t => ({ ...t, contact: true }));
    }
  }

  onBillingAddressChange(value: string | number): void {
    this.selectedBillingAddress.set(String(value));
    // Find the address and store the full address string for the order
    const address = this.loadedAddresses.find(a => String(a.id) === String(value));
    const addressStr = address
      ? `${address.street}, ${address.city}${address.country?.name ? ', ' + address.country.name : ''}`
      : String(value);
    this.order.update(o => ({ ...o, billingAddress: addressStr }));
    this.touched.update(t => ({ ...t, billingAddress: true }));
  }

  onShippingAddressChange(value: string | number): void {
    this.selectedShippingAddress.set(String(value));
    // Find the address and store the full address string for the order
    const address = this.loadedAddresses.find(a => String(a.id) === String(value));
    const addressStr = address
      ? `${address.street}, ${address.city}${address.country?.name ? ', ' + address.country.name : ''}`
      : String(value);
    this.order.update(o => ({ ...o, shippingAddress: addressStr }));
    this.touched.update(t => ({ ...t, shippingAddress: true }));
  }

  clearShippingAddress(): void {
    this.selectedShippingAddress.set('');
    this.order.update(o => ({ ...o, shippingAddress: '' }));
    this.touched.update(t => ({ ...t, shippingAddress: true }));
  }

  onStatusChange(value: string | number): void {
    const status = String(value);
    this.selectedStatus.set(status);
    // "Enable sale" is the inverse of draft — keep the toggle in sync
    this.order.update(o => ({ ...o, status, enableSale: status !== 'draft' }));
    this.touched.update(t => ({ ...t, status: true }));
  }

  onPaymentTypeChange(value: string | number): void {
    this.selectedPaymentType.set(String(value));
    this.order.update(o => ({ ...o, paymentType: String(value) }));
  }

  onDeliveryTypeChange(value: string | number): void {
    this.selectedDeliveryType.set(String(value));
    this.order.update(o => ({ ...o, deliveryType: String(value) }));
  }

  // Clear handlers
  clearContact(): void {
    this.selectedContact.set('');
    this.order.update(o => ({ ...o, contact: '', contactDropdown: '' }));
    this.touched.update(t => ({ ...t, contact: true }));
  }

  clearBillingAddress(): void {
    this.selectedBillingAddress.set('');
    this.order.update(o => ({ ...o, billingAddress: '' }));
    this.touched.update(t => ({ ...t, billingAddress: true }));
  }

  clearStatus(): void {
    this.selectedStatus.set('');
    this.order.update(o => ({ ...o, status: '' }));
    this.touched.update(t => ({ ...t, status: true }));
  }

  clearPaymentType(): void {
    this.selectedPaymentType.set('');
    this.order.update(o => ({ ...o, paymentType: '' }));
  }

  clearDeliveryType(): void {
    this.selectedDeliveryType.set('');
    this.order.update(o => ({ ...o, deliveryType: '' }));
  }

  // Tracking handlers
  onTrackingNumberChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.order.update(o => ({ ...o, trackingNumber: value }));
  }

  // Carrier is derived from the delivery type; the select is only shown on explicit override.
  carrierOverride = signal(false);

  carrierOptions: SelectOption[] = [
    { value: 'dhl', label: 'DHL' },
    { value: 'ups', label: 'UPS' },
    { value: 'fedex', label: 'FedEx' },
    { value: 'dpd', label: 'DPD' },
    { value: 'gls', label: 'GLS' },
    { value: 'other', label: 'Other' }
  ];

  effectiveCarrier = computed(() => this.order().trackingCarrier || this.derivedCarrier() || '');

  onTrackingCarrierSelect(value: string | number): void {
    this.order.update(o => ({ ...o, trackingCarrier: String(value) }));
  }

  resetCarrierOverride(): void {
    // Clearing the stored value makes the backend re-derive from the delivery type on save.
    this.carrierOverride.set(false);
    this.order.update(o => ({ ...o, trackingCarrier: '' }));
  }


  // Tracking events list + refresh
  trackingEvents = signal<Array<{ id: number; status: string; location: string | null; description: string | null; occurredAt: string; source: string }>>([]);
  isRefreshingTracking = signal(false);

  onRefreshTracking(): void {
    const id = this.order().id;
    if (!id) return;
    if (!this.order().trackingNumber) {
      this.toastService.error('Enter a tracking number (and save the order) before refreshing tracking.');
      return;
    }
    this.isRefreshingTracking.set(true);
    this.orderService.refreshTracking(String(id)).subscribe({
      next: (response) => {
        this.trackingEvents.set((response.events || []).map((e: any) => ({
          id: e.id,
          status: e.status,
          location: e.location ?? null,
          description: e.description ?? null,
          occurredAt: e.occurredAt,
          source: e.source ?? 'dhl_api',
        })));
        // Tracking may have advanced the order status server-side (e.g. delivered).
        // Sync the form state so a later Save doesn't write the stale status back.
        const newStatus = (response as any).orderStatus;
        if (newStatus && newStatus !== this.order().status) {
          this.order.update(o => ({ ...o, status: newStatus, enableSale: newStatus !== 'draft' }));
          this.selectedStatus.set(newStatus);
          const label = this.orderStatusOptions.find(o => o.value === newStatus)?.label ?? newStatus;
          this.toastService.success(`Order status updated to "${label}" from carrier tracking.`);
        }
        this.toastService.success(response.created > 0
          ? `${response.created} new tracking event(s) recorded.`
          : 'Tracking is up to date.');
        this.isRefreshingTracking.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.logger.error('[Tracking] refresh failed', err);
        this.toastService.error('Failed to refresh tracking.');
        this.isRefreshingTracking.set(false);
      }
    });
  }

  // Show tracking fields when order is shipped/delivered or has a tracking number
  showTrackingFields = computed(() => {
    const o = this.order();
    return o.status === 'shipped' || o.status === 'delivered' || !!o.trackingNumber;
  });

  formatTrackingStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  trackByEventId(_index: number, event: { id: number }): number {
    return event.id;
  }

  trackByGroupId(_index: number, group: ProductGroup): number | string {
    return group.id;
  }

  // Derive carrier label from selected delivery type's carrierCode (read-only fallback)
  derivedCarrier = computed(() => {
    const id = this.selectedDeliveryType();
    if (!id) return '';
    const dt = this.deliveryTypeOptions().find(o => String(o.value) === String(id));
    return (dt as any)?.carrierCode ?? '';
  });

  // Event handlers
  onEnableSaleChange(value: boolean): void {
    // The toggle and the Draft status are the same concept — keep them in sync
    this.order.update(o => {
      const status = value
        ? (o.status === 'draft' ? 'new' : o.status)
        : 'draft';
      this.selectedStatus.set(status);
      return { ...o, enableSale: value, status };
    });
  }

  onCancellationReasonChange(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.order.update(o => ({ ...o, cancellationReason: value }));
    this.touched.update(t => ({ ...t, cancellationReason: true }));
  }

  toggleProductGroup(groupId: number | string): void {
    this.order.update(o => {
      const toggle = (g: ProductGroup): ProductGroup =>
        g.id === groupId ? { ...g, isExpanded: !g.isExpanded } : g;
      return {
        ...o,
        productGroups: o.productGroups.map(toggle),
        clientGroups: o.clientGroups.map(cg => ({
          ...cg,
          productGroups: cg.productGroups.map(toggle)
        }))
      };
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/shop-orders/list']);
  }

  onExport(): void {
    const orderData = this.order();
    if (!orderData.id) return;
    const orderNumber = orderData.internalRef || String(orderData.id);
    this.orderService.exportOrdersToExcel(
      undefined,
      undefined,
      { query: orderNumber }
    ).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `order-${orderNumber}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.logger.error('Export failed:', err);
        this.alertService.error('Failed to export order to Excel.');
      }
    });
  }

  onPrint(): void {
    const orderId = this.order().id;
    if (!orderId) return;
    this.orderService.exportOrderPdf(String(orderId)).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const printWindow = window.open(url);
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
            setTimeout(() => window.URL.revokeObjectURL(url), 60000);
          };
        }
      },
      error: (err) => {
        this.logger.error('Print failed:', err);
        this.alertService.error('Failed to generate print preview.');
      }
    });
  }

  onSave(): void {
    const orderData = this.order();

    // Mark all fields as touched to show validation errors
    this.markAllTouched();
    this.cdr.markForCheck();

    // Check if form is valid
    if (!this.isValid()) {
      const errorMessages = Object.values(this.errors()).join('\n');
      this.alertService.error(errorMessages, 'Validation Error');
      return;
    }
    if (this.isSaving()) return;

    // Save as order - build payload with all changed fields
    // Note: isDraft is deliberately NOT sent — the backend derives it from status,
    // and sending both lets setIsDraft() overwrite an explicit "draft" status.
    const updatePayload: Record<string, any> = {
      status: orderData.status,
      billingAddress: orderData.billingAddress,
      shippingAddress: orderData.shippingAddress,
      cancellationReason: orderData.cancellationReason || null,
      // User reference - this determines the account (user's client)
      user: `/api/v1/users/${this.selectedContact()}`,
      paymentType: this.selectedPaymentType() ? `/api/v1/payment_types/${this.selectedPaymentType()}` : null,
      deliveryType: this.selectedDeliveryType() ? `/api/v1/delivery_types/${this.selectedDeliveryType()}` : null,
      trackingNumber: orderData.trackingNumber || null,
      trackingCarrier: orderData.trackingCarrier || null,
      trackingUrl: orderData.trackingUrl || null,
    };

    this.logger.debug('[ShopOrdersEdit] Saving order ID:', orderData.id);
    this.logger.debug('[ShopOrdersEdit] Payload:', JSON.stringify(updatePayload, null, 2));

    this.isSaving.set(true);
    this.orderService.updateOrder(String(orderData.id), updatePayload as Partial<Order>)
      .pipe(finalize(() => { this.isSaving.set(false); this.cdr.markForCheck(); }))
      .subscribe({
      next: (updatedOrder) => {
        this.logger.debug('[ShopOrdersEdit] Order saved successfully:', updatedOrder);
        this.toastService.success('Order saved successfully');
        // Log entries are written asynchronously by the worker — reload shortly
        // after saving so the Log messages section reflects this change.
        setTimeout(() => this.loadOrder(String(orderData.id)), 1200);
      },
      error: (error) => {
        this.logger.error('[ShopOrdersEdit] Error saving order:', error);
        this.toastService.error('Error saving order: ' + (error?.error?.detail || error?.error?.message || error?.message || 'Unknown error'));
      }
    });
  }

  getStatusBadgeVariant(status: string): BadgeVariant {
    const variants: Record<string, BadgeVariant> = {
      'draft': 'secondary',
      'new': 'info',
      'in_process': 'warning',
      'waiting_for_payment': 'orange',
      'ready_for_shipment': 'teal',
      'shipped': 'blue',
      'delivered': 'success',
      'canceled': 'danger',
      'reversal': 'dark'
    };
    return variants[status.toLowerCase()] || 'secondary';
  }

  formatCurrency(value: number): string {
    return `€ ${value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
