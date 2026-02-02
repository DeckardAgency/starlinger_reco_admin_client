import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, OnInit, OnDestroy, inject, ViewChild, TemplateRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { BreadcrumbsComponent, BreadcrumbItem } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { BadgeComponent } from '@app/ui-kit/atoms/badge/badge.component';
import { ToggleComponent } from '@app/ui-kit/atoms/toggle/toggle.component';
import { FormFieldComponent } from '@app/ui-kit/molecules/form-field/form-field.component';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { DataTableComponent, TableColumn } from '@app/ui-kit/organisms/data-table/data-table.component';
import { OrderService } from '@core/services/http/order.service';
import { InquiryService, Inquiry } from '@core/services/http/inquiry.service';
import { Order } from '@core/models/order.model';

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

interface MachineGroup {
  id: string;
  name: string;
  products: OrderProduct[];
  isExpanded: boolean;
}

interface LogMessage {
  status: string;
  statusVariant: 'success' | 'warning' | 'info' | 'secondary';
  dateTime: string;
  user: string;
  message: string;
}

interface ShopOrderDetail {
  id: string;
  internalRef: string;
  dateCreated: string;
  partsOrdered: number;
  status: string;
  enableSale: boolean;
  account: string;
  contact: string;
  contactDropdown: string;
  billingAddress: string;
  date: string;
  paymentType: string;
  deliveryType: string;
  priceWithoutTax: number;
  totalPrice: number;
  priceTax: number;
  machineGroups: MachineGroup[];
  orderTotal: number;
  amountPaid: number;
  logMessages: LogMessage[];
}

const EMPTY_ORDER: ShopOrderDetail = {
  id: '',
  internalRef: '',
  dateCreated: '',
  partsOrdered: 0,
  status: 'new',
  enableSale: false,
  account: '',
  contact: '',
  contactDropdown: '',
  billingAddress: '',
  date: '',
  paymentType: '',
  deliveryType: '',
  priceWithoutTax: 0,
  totalPrice: 0,
  priceTax: 0,
  machineGroups: [],
  orderTotal: 0,
  amountPaid: 0,
  logMessages: []
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
    DataTableComponent
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
  private inquiryService = inject(InquiryService);
  private destroy$ = new Subject<void>();

  isLoading = signal(true);
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

  // Dropdown options
  contactOptions = [
    { value: 'martina', label: 'Martina Kemper - Unistrap Gmbh' },
    { value: 'john', label: 'John Doe - Unistrap Gmbh' },
    { value: 'jane', label: 'Jane Smith - Unistrap Gmbh' }
  ];

  billingAddressOptions = [
    { value: 'wien', label: '1060 Wien, Sonnenuhrgasse 4' },
    { value: 'graz', label: '8010 Graz, Hauptplatz 1' },
    { value: 'linz', label: '4020 Linz, Landstraße 15' }
  ];

  statusOptions = [
    { value: 'new', label: 'New' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  paymentTypeOptions = [
    { value: 'bank-transfer', label: 'Bank transfer' },
    { value: 'credit-card', label: 'Credit card' },
    { value: 'paypal', label: 'PayPal' }
  ];

  deliveryTypeOptions = [
    { value: 'dhl', label: 'DHL' },
    { value: 'fedex', label: 'FedEx' },
    { value: 'ups', label: 'UPS' },
    { value: 'pickup', label: 'Pickup' }
  ];

  // Selected values for ngModel
  selectedContact = '';
  selectedBillingAddress = '';
  selectedStatus = '';
  selectedPaymentType = '';
  selectedDeliveryType = '';



  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const orderId = params.get('id');
        if (orderId) {
          this.loadOrder(orderId);
        }
      });
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
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.inquiryService.getInquiry(id).subscribe({
          next: (inquiry) => {
            const detail = this.mapInquiryToDetail(inquiry);
            this.applyOrderDetail(detail);
            this.isLoading.set(false);
            this.cdr.markForCheck();
          },
          error: (err) => {
            this.loadError.set(err?.message || 'Order or inquiry not found');
            this.isLoading.set(false);
            this.cdr.markForCheck();
          }
        });
      }
    });
  }

  private mapOrderToDetail(o: Order): ShopOrderDetail {
    const userName = o.user ? `${(o.user as { firstName?: string }).firstName || ''} ${(o.user as { lastName?: string }).lastName || ''}`.trim() || 'Unknown' : 'Unknown';
    const partsCount = o.items?.reduce((sum, i) => sum + (i.quantity || 0), 0) ?? 0;
    const machineGroups: MachineGroup[] = (o.items || []).map((item, idx) => ({
      id: item.id || String(idx),
      name: item.product?.name || 'Product',
      products: [{
        partNo: item.product?.partNo ?? '',
        productName: item.product?.name ?? '',
        weight: item.product?.weight ?? '',
        quantity: item.quantity ?? 0,
        unitPrice: item.unitPrice ?? 0,
        discount: '0',
        price: (item.quantity ?? 0) * (item.unitPrice ?? 0)
      }],
      isExpanded: true
    }));
    const logMessages: LogMessage[] = (o.logs || []).map(log => ({
      status: log.newStatus,
      statusVariant: 'info',
      dateTime: log.createdAt,
      user: '',
      message: log.comment || ''
    }));
    if (logMessages.length === 0 && o.status) {
      logMessages.push({ status: o.status, statusVariant: 'info', dateTime: o.createdAt, user: userName, message: '' });
    }
    return {
      id: o.id,
      internalRef: o.orderNumber || o.id,
      dateCreated: this.formatDate(o.createdAt),
      partsOrdered: partsCount,
      status: o.status || 'pending',
      enableSale: !o.isDraft,
      account: (o.user as { client?: { name?: string } })?.client?.name ?? '',
      contact: userName,
      contactDropdown: userName,
      billingAddress: o.billingAddress ?? '',
      date: this.formatDate(o.createdAt),
      paymentType: '',
      deliveryType: '',
      priceWithoutTax: 0,
      totalPrice: o.totalAmount ?? 0,
      priceTax: 0,
      machineGroups,
      orderTotal: o.totalAmount ?? 0,
      amountPaid: 0,
      logMessages
    };
  }

  private mapInquiryToDetail(i: Inquiry): ShopOrderDetail {
    const userName = i.user ? `${i.user.firstName || ''} ${i.user.lastName || ''}`.trim() || 'Unknown' : 'Unknown';
    const partsCount = i.machines?.reduce((sum, m) => sum + (m.products?.reduce((p, q) => p + (q.quantity || 0), 0) || 0), 0) ?? 0;
    const machineGroups: MachineGroup[] = (i.machines || []).map((m, idx) => ({
      id: m.id || String(idx),
      name: m.serialNumber || 'Machine',
      products: (m.products || []).map(p => ({
        partNo: p.partNo ?? '',
        productName: p.name ?? '',
        weight: '',
        quantity: p.quantity ?? 0,
        unitPrice: p.unitPrice ?? 0,
        discount: '0',
        price: (p.quantity ?? 0) * (p.unitPrice ?? 0)
      })),
      isExpanded: true
    }));
    const logMessages: LogMessage[] = [{ status: i.status, statusVariant: 'info', dateTime: i.createdAt, user: userName, message: i.notes || '' }];
    return {
      id: i.id,
      internalRef: String(i.inquiryNumber ?? i.id),
      dateCreated: this.formatDate(i.createdAt),
      partsOrdered: partsCount,
      status: i.status || 'pending',
      enableSale: !i.isDraft,
      account: i.user?.client?.companyName ?? '',
      contact: userName,
      contactDropdown: userName,
      billingAddress: '',
      date: this.formatDate(i.createdAt),
      paymentType: '',
      deliveryType: '',
      priceWithoutTax: 0,
      totalPrice: 0,
      priceTax: 0,
      machineGroups,
      orderTotal: 0,
      amountPaid: 0,
      logMessages
    };
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  private applyOrderDetail(orderData: ShopOrderDetail): void {
    this.order.set(orderData);
    this.breadcrumbItems = [
      { label: 'Shop orders', route: '/admin/shop-orders' },
      { label: orderData.internalRef ? `#${orderData.internalRef}` : orderData.id }
    ];
    this.selectedContact = orderData.contactDropdown;
    this.selectedBillingAddress = orderData.billingAddress;
    this.selectedStatus = orderData.status;
    this.selectedPaymentType = orderData.paymentType;
    this.selectedDeliveryType = orderData.deliveryType;
    this.cdr.markForCheck();
  }

  // Dropdown change handlers
  onContactChange(): void {
    const option = this.contactOptions.find(o => o.value === this.selectedContact);
    if (option) {
      this.order.update(o => ({ ...o, contact: option.label, contactDropdown: this.selectedContact }));
    }
  }

  onBillingAddressChange(): void {
    this.order.update(o => ({ ...o, billingAddress: this.selectedBillingAddress }));
  }

  onStatusChange(): void {
    this.order.update(o => ({ ...o, status: this.selectedStatus }));
  }

  onPaymentTypeChange(): void {
    this.order.update(o => ({ ...o, paymentType: this.selectedPaymentType }));
  }

  onDeliveryTypeChange(): void {
    this.order.update(o => ({ ...o, deliveryType: this.selectedDeliveryType }));
  }

  // Remove pill handlers
  removeContact(): void {
    this.selectedContact = '';
    this.order.update(o => ({ ...o, contact: '', contactDropdown: '' }));
  }

  removeBillingAddress(): void {
    this.selectedBillingAddress = '';
    this.order.update(o => ({ ...o, billingAddress: '' }));
  }

  removeStatus(): void {
    this.selectedStatus = '';
    this.order.update(o => ({ ...o, status: '' }));
  }

  removePaymentType(): void {
    this.selectedPaymentType = '';
    this.order.update(o => ({ ...o, paymentType: '' }));
  }

  removeDeliveryType(): void {
    this.selectedDeliveryType = '';
    this.order.update(o => ({ ...o, deliveryType: '' }));
  }

  getContactLabel(): string {
    const option = this.contactOptions.find(o => o.value === this.selectedContact);
    return option ? option.label : '';
  }

  getBillingAddressLabel(): string {
    const option = this.billingAddressOptions.find(o => o.value === this.selectedBillingAddress);
    return option ? option.label : '';
  }

  getStatusLabel(): string {
    const option = this.statusOptions.find(o => o.value === this.selectedStatus);
    return option ? option.label : '';
  }

  getPaymentTypeLabel(): string {
    const option = this.paymentTypeOptions.find(o => o.value === this.selectedPaymentType);
    return option ? option.label : '';
  }

  getDeliveryTypeLabel(): string {
    const option = this.deliveryTypeOptions.find(o => o.value === this.selectedDeliveryType);
    return option ? option.label : '';
  }

  // Event handlers
  onEnableSaleChange(value: boolean): void {
    this.order.update(o => ({ ...o, enableSale: value }));
  }

  toggleMachineGroup(groupId: string): void {
    this.order.update(o => ({
      ...o,
      machineGroups: o.machineGroups.map(g =>
        g.id === groupId ? { ...g, isExpanded: !g.isExpanded } : g
      )
    }));
  }

  goBack(): void {
    this.router.navigate(['/admin/shop-orders/list']);
  }

  onExport(): void {
    console.log('Export order...');
  }

  onPrint(): void {
    console.log('Print order...');
  }

  onSave(): void {
    console.log('Save order...', this.order());
  }

  getStatusBadgeVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'secondary' {
    switch (status.toLowerCase()) {
      case 'new': return 'success';
      case 'completed': return 'success';
      case 'in-progress': return 'warning';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  }

  formatCurrency(value: number): string {
    return `€ ${value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

