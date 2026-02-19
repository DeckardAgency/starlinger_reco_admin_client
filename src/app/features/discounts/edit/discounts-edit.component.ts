import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed, ViewChild, TemplateRef, AfterViewInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { BadgeComponent } from '@app/ui-kit/atoms/badge/badge.component';
import { ToggleComponent } from '@app/ui-kit/atoms/toggle/toggle.component';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { FormFieldComponent } from '@app/ui-kit/molecules/form-field/form-field.component';
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { DetailHeaderComponent } from '@app/ui-kit/molecules/detail-header/detail-header.component';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';
import { TableFooterComponent } from '@app/ui-kit/molecules/table-footer/table-footer.component';
import { TableActionsDropdownComponent, TableAction, ActionClickEvent } from '@app/ui-kit/molecules/table-actions-dropdown/table-actions-dropdown.component';
import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms/data-table/data-table.component';
import { CalendarComponent } from '@app/ui-kit/molecules/calendar/calendar.component';
import { ToastService } from '@app/ui-kit/organisms/toast-container/toast-container.component';
import { DiscountService } from '@core/services/http/discount.service';
import { AccountGroupService } from '@core/services/http/account-group.service';
import { ClientService } from '@core/services/http/client.service';

interface DiscountDetail {
  id: number;
  name: string;
  active: boolean;
  dateFrom: string;
  dateTo: string;
  discountPercent: number;
  priority: number;
  accountGroups: string[];
  accounts: string[];
}

interface DiscountProduct {
  id: string;
  code: string;
  shortDescription: string;
}

const EMPTY_DISCOUNT: DiscountDetail = {
  id: 0,
  name: '',
  active: false,
  dateFrom: '',
  dateTo: '',
  discountPercent: 0,
  priority: 0,
  accountGroups: [],
  accounts: []
};

@Component({
  selector: 'app-discounts-edit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    BadgeComponent,
    ToggleComponent,
    IconComponent,
    FormFieldComponent,
    BreadcrumbsComponent,
    DetailHeaderComponent,
    MobileFooterComponent,
    TableFooterComponent,
    TableActionsDropdownComponent,
    DataTableComponent,
    CalendarComponent
  ],
  templateUrl: './discounts-edit.component.html',
  styleUrls: ['./discounts-edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiscountsEditComponent implements OnInit, OnDestroy, AfterViewInit {
  private toastService = inject(ToastService);
  private destroy$ = new Subject<void>();
  private discountId: string | null = null;

  @ViewChild('productActionsTemplate') productActionsTemplate!: TemplateRef<any>;

  // Form state
  discount = signal<DiscountDetail>({ ...EMPTY_DISCOUNT });
  isEditMode = signal(false);
  isLoading = signal(false);

  // Validation state
  touched = signal<Record<string, boolean>>({});
  errors = computed(() => {
    const discount = this.discount();
    const errs: Record<string, string> = {};
    if (!discount.name?.trim()) errs['name'] = 'Name is required';
    return errs;
  });
  isValid = computed(() => Object.keys(this.errors()).length === 0);

  // Products table
  products = signal<DiscountProduct[]>([]);
  productColumns: TableColumn[] = [];
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' | null = null;
  searchQuery = signal('');

  // Pagination
  currentPage = signal(1);
  itemsPerPage = signal(12);
  totalItems = computed(() => this.products().length);
  totalPages = computed(() => Math.ceil(this.totalItems() / this.itemsPerPage()));

  // Dropdown state
  openDropdownId = signal<string | null>(null);

  // Calendar state
  showDateFromCalendar = signal(false);
  showDateToCalendar = signal(false);
  dateFromDate = signal<Date | null>(null);
  dateToDate = signal<Date | null>(null);

  // Account options (loaded from API)
  accountGroupOptions = signal<{ value: string; label: string }[]>([]);
  accountOptions = signal<{ value: string; label: string }[]>([]);

  // Selected values (for select fields)
  selectedAccountGroup = '';
  selectedAccount = '';

  // Product actions
  productActions: TableAction[] = [
    { id: 'remove', label: 'Remove', icon: 'trash', variant: 'danger' }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private discountService: DiscountService,
    private accountGroupService: AccountGroupService,
    private clientService: ClientService
  ) {}

  ngOnInit(): void {
    this.loadDropdownOptions();

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.discountId = params['id'] || null;
      this.isEditMode.set(!!this.discountId && this.discountId !== 'new');

      if (this.isEditMode()) {
        this.loadDiscount(this.discountId!);
        this.loadProducts();
      } else {
        // New discount - reset form
        this.discount.set({ ...EMPTY_DISCOUNT });
      }
    });
  }

  ngAfterViewInit(): void {
    this.initProductColumns();
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initProductColumns(): void {
    this.productColumns = [
      { key: 'code', label: 'Product code', sortable: false, width: '195px' },
      { key: 'shortDescription', label: 'Short description', sortable: false },
      { key: 'actions', label: '', sortable: false, width: '64px', template: this.productActionsTemplate }
    ];
  }

  private loadDiscount(id: string): void {
    this.isLoading.set(true);

    this.discountService.getDiscountById(id).subscribe({
      next: (discount) => {
        // Map API property names to component's local interface
        const discountAny = discount as any;
        this.discount.set({
          id: discount.id || Number(id),
          name: discount.name || '',
          active: discount.isActive || false,
          dateFrom: discount.dateValidFrom || '',
          dateTo: discount.dateValidTo || '',
          discountPercent: parseFloat(discount.discountPercent || '0') || 0,
          priority: discount.priority || 0,
          accountGroups: discountAny.accountGroups || [],
          accounts: discountAny.accounts || []
        });
        this.dateFromDate.set(this.parseDateString(discount.dateValidFrom || ''));
        this.dateToDate.set(this.parseDateString(discount.dateValidTo || ''));
        // Load products if available
        if (discountAny.products) {
          this.products.set(discountAny.products as DiscountProduct[]);
        }
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading discount:', error);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  private loadProducts(): void {
    // Products are loaded with discount data
  }

  private loadDropdownOptions(): void {
    this.accountGroupService.getAccountGroups(1, 100).subscribe({
      next: (response) => {
        this.accountGroupOptions.set(
          (response.member || []).map(g => ({ value: String(g.id), label: g.name }))
        );
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error loading account groups:', err)
    });

    this.clientService.getClients(1, 'name', 'asc').subscribe({
      next: (response) => {
        this.accountOptions.set(
          (response.clients || []).map(c => ({ value: String(c.id), label: c.name }))
        );
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error loading accounts:', err)
    });
  }

  // Navigation
  onBack(): void {
    this.router.navigate(['/admin/discounts/list']);
  }

  // Validation helpers
  markAllTouched(): void {
    this.touched.set({ name: true });
  }

  markFieldTouched(field: string): void {
    this.touched.update(t => ({ ...t, [field]: true }));
  }

  getError(field: string): string {
    return this.touched()[field] ? (this.errors()[field] || '') : '';
  }

  // Form handlers
  onActiveChange(active: boolean): void {
    this.discount.update(d => ({ ...d, active }));
  }

  onNameChange(value: string): void {
    this.discount.update(d => ({ ...d, name: value }));
    this.markFieldTouched('name');
  }

  toggleDateFromCalendar(event?: Event): void {
    event?.stopPropagation();
    this.showDateToCalendar.set(false);
    this.showDateFromCalendar.update(v => !v);
  }

  toggleDateToCalendar(event?: Event): void {
    event?.stopPropagation();
    this.showDateFromCalendar.set(false);
    this.showDateToCalendar.update(v => !v);
  }

  onDateFromSelected(date: Date): void {
    this.dateFromDate.set(date);
    const isoString = this.formatDateToISO(date);
    this.discount.update(d => ({ ...d, dateFrom: isoString }));
    this.showDateFromCalendar.set(false);
  }

  onDateToSelected(date: Date): void {
    this.dateToDate.set(date);
    const isoString = this.formatDateToISO(date);
    this.discount.update(d => ({ ...d, dateTo: isoString }));
    this.showDateToCalendar.set(false);
  }

  clearDateFrom(event: Event): void {
    event.stopPropagation();
    this.dateFromDate.set(null);
    this.discount.update(d => ({ ...d, dateFrom: '' }));
    this.showDateFromCalendar.set(false);
  }

  clearDateTo(event: Event): void {
    event.stopPropagation();
    this.dateToDate.set(null);
    this.discount.update(d => ({ ...d, dateTo: '' }));
    this.showDateToCalendar.set(false);
  }

  formatDateDisplay(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private formatDateToISO(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00+00:00`;
  }

  private parseDateString(dateStr: string): Date | null {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  }

  onDiscountPercentChange(value: string): void {
    const numValue = parseFloat(value) || 0;
    this.discount.update(d => ({ ...d, discountPercent: numValue }));
  }

  onPriorityChange(value: string): void {
    const numValue = parseInt(value) || 0;
    this.discount.update(d => ({ ...d, priority: numValue }));
  }

  onAccountGroupChange(): void {
    if (this.selectedAccountGroup) {
      this.discount.update(d => ({
        ...d,
        accountGroups: [...new Set([...d.accountGroups, this.selectedAccountGroup])]
      }));
      this.selectedAccountGroup = '';
    }
  }

  onAccountChange(): void {
    if (this.selectedAccount) {
      this.discount.update(d => ({
        ...d,
        accounts: [...new Set([...d.accounts, this.selectedAccount])]
      }));
      this.selectedAccount = '';
    }
  }

  removeAccountGroup(value: string): void {
    this.discount.update(d => ({
      ...d,
      accountGroups: d.accountGroups.filter(g => g !== value)
    }));
  }

  removeAccount(value: string): void {
    this.discount.update(d => ({
      ...d,
      accounts: d.accounts.filter(a => a !== value)
    }));
  }

  getAccountGroupLabel(value: string): string {
    return this.accountGroupOptions().find(o => o.value === value)?.label || value;
  }

  getAccountLabel(value: string): string {
    return this.accountOptions().find(o => o.value === value)?.label || value;
  }

  // Save actions
  onSave(): void {
    this.saveDiscount(false);
  }

  onSaveAndContinue(): void {
    this.saveDiscount(true);
  }

  private saveDiscount(navigateToList: boolean): void {
    this.markAllTouched();
    if (!this.isValid()) {
      this.cdr.markForCheck();
      return;
    }

    const data = this.discount();
    // Map component's local interface back to API format
    const apiData = {
      name: data.name,
      isActive: data.active,
      dateValidFrom: data.dateFrom || null,
      dateValidTo: data.dateTo || null,
      discountPercent: data.discountPercent.toString(),
      priority: data.priority
    };

    const isCreating = !this.isEditMode();
    const operation = isCreating
      ? this.discountService.createDiscount(apiData)
      : this.discountService.updateDiscount(this.discountId!, apiData);

    operation.subscribe({
      next: (result) => {
        this.toastService.success('Saved successfully');
        if (navigateToList) {
          this.router.navigate(['/admin/discounts/list']);
        } else if (isCreating && result?.id) {
          this.router.navigate(['/admin/discounts', result.id, 'edit']);
        }
      },
      error: (error) => {
        console.error('Error saving discount:', error);
        this.toastService.error('Failed to save discount');
      }
    });
  }

  // Table handlers
  onSortChange(event: SortEvent): void {
    this.sortColumn = event.column;
    this.sortDirection = event.direction;
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    console.log('Searching:', query);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  // Dropdown
  toggleDropdown(productId: string): void {
    if (this.openDropdownId() === productId) {
      this.openDropdownId.set(null);
    } else {
      this.openDropdownId.set(productId);
    }
  }

  closeDropdown(): void {
    this.openDropdownId.set(null);
    this.showDateFromCalendar.set(false);
    this.showDateToCalendar.set(false);
  }

  // Product actions
  onProductActionClick(event: ActionClickEvent): void {
    const product = event.row as DiscountProduct;
    if (event.actionId === 'remove') {
      this.onRemoveProduct(product);
    }
  }

  onRemoveProduct(product: DiscountProduct): void {
    this.products.update(list => list.filter(p => p.id !== product.id));
    this.closeDropdown();
  }
}
