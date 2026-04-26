import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed, ViewChild, TemplateRef, AfterViewInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { ToggleComponent } from '@app/ui-kit/atoms/toggle/toggle.component';
import { SelectComponent } from '@app/ui-kit/atoms/select/select.component';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { FormFieldComponent } from '@app/ui-kit/molecules/form-field/form-field.component';
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { DetailHeaderComponent } from '@app/ui-kit/molecules/detail-header/detail-header.component';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';
import { TableFooterComponent } from '@app/ui-kit/molecules/table-footer/table-footer.component';
import { TableActionsDropdownComponent, TableAction, ActionClickEvent } from '@app/ui-kit/molecules/table-actions-dropdown/table-actions-dropdown.component';
import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms/data-table/data-table.component';
import { CalendarComponent } from '@app/ui-kit/molecules/calendar/calendar.component';
import { ModalComponent } from '@app/ui-kit/organisms/modal/modal.component';
import { ToastService } from '@app/ui-kit/organisms/toast-container/toast-container.component';
import { DiscountService } from '@core/services/http/discount.service';
import { AccountGroupService } from '@core/services/http/account-group.service';
import { ClientService } from '@core/services/http/client.service';
import { ProductDiscountService } from '@core/services/http/product-discount.service';
import { ProductService } from '@core/services/http/product.service';

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
  productTypes: string[];
}

interface DiscountProduct {
  id: string;
  productDiscountId?: number;  // ProductDiscount entity ID for deletion
  code: string;
  shortDescription: string;
}

interface SearchResult {
  id: number;
  code: string;
  name: string;
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
  accounts: [],
  productTypes: []
};

@Component({
  selector: 'app-discounts-edit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ToggleComponent,
    SelectComponent,
    IconComponent,
    FormFieldComponent,
    BreadcrumbsComponent,
    DetailHeaderComponent,
    MobileFooterComponent,
    TableFooterComponent,
    TableActionsDropdownComponent,
    DataTableComponent,
    CalendarComponent,
    ModalComponent
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
  openDropdownId = signal<number | null>(null);

  // Calendar state
  showDateFromCalendar = signal(false);
  showDateToCalendar = signal(false);
  dateFromDate = signal<Date | null>(null);
  dateToDate = signal<Date | null>(null);

  // Account options (loaded from API)
  accountGroupOptions = signal<{ value: string; label: string }[]>([]);
  accountOptions = signal<{ value: string; label: string }[]>([]);

  productTypeOptions: { value: string; label: string }[] = [
    { value: 'VT', label: 'VT' },
    { value: 'ET', label: 'ET' }
  ];


  // Product modal
  isProductModalOpen = signal(false);
  productSearchResults = signal<SearchResult[]>([]);
  isSearchingProducts = signal(false);
  productSearchQuery = signal('');
  private productSearchSubject = new Subject<string>();

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
    private clientService: ClientService,
    private productDiscountService: ProductDiscountService,
    private productService: ProductService
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

    // Debounced product search for modal
    this.productSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      if (!query.trim()) {
        this.productSearchResults.set([]);
        this.isSearchingProducts.set(false);
        this.cdr.markForCheck();
        return;
      }
      this.isSearchingProducts.set(true);
      this.productService.getProducts({ search: query, itemsPerPage: 20 }).subscribe({
        next: (res) => {
          const linkedIds = new Set(this.products().map(p => p.id));
          const members = (res as any).member || (res as any)['hydra:member'] || [];
          this.productSearchResults.set(
            members
              .filter((p: any) => !linkedIds.has(String(p.id)))
              .map((p: any) => ({ id: p.id, code: p.partNo, name: p.name }))
          );
          this.isSearchingProducts.set(false);
          this.cdr.markForCheck();
        },
        error: () => {
          this.isSearchingProducts.set(false);
          this.cdr.markForCheck();
        }
      });
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
        // Parse IRI arrays to plain IDs (e.g. "/api/account_groups/1" → "1")
        const parseIris = (arr: any[]): string[] =>
          (arr || []).map((v: any) => typeof v === 'string' ? v.split('/').pop()! : String(v));
        this.discount.set({
          id: discount.id || Number(id),
          name: discount.name || '',
          active: discount.isActive || false,
          dateFrom: discount.dateValidFrom || '',
          dateTo: discount.dateValidTo || '',
          discountPercent: parseFloat(discount.discountPercent || '0') || 0,
          priority: discount.priority || 0,
          accountGroups: parseIris(discountAny.accountGroups),
          accounts: parseIris(discountAny.clients),
          productTypes: Array.isArray(discountAny.productTypes) ? discountAny.productTypes : []
        });
        this.dateFromDate.set(this.parseDateString(discount.dateValidFrom || ''));
        this.dateToDate.set(this.parseDateString(discount.dateValidTo || ''));
        // Load linked products
        this.loadProducts();
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
    if (!this.discountId) return;

    this.productDiscountService.getByDiscountId(this.discountId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        const productDiscounts = response.member || [];
        if (productDiscounts.length === 0) {
          this.products.set([]);
          this.cdr.markForCheck();
          return;
        }

        // Build a map of productId → productDiscountId
        const pdMap = new Map<number, number>();
        productDiscounts.forEach(pd => {
          if (pd.productId != null) pdMap.set(pd.productId, pd.id);
        });

        const uniqueIds = [...pdMap.keys()];
        forkJoin(
          uniqueIds.map(pid => this.productService.getProductById(String(pid)))
        ).pipe(takeUntil(this.destroy$)).subscribe({
          next: (products) => {
            this.products.set(products.map(p => ({
              id: String(p.id),
              productDiscountId: pdMap.get(p.id),
              code: p.partNo || '',
              shortDescription: p.shortDescription || p.name || ''
            })));
            this.cdr.markForCheck();
          },
          error: (err) => console.error('Error loading products:', err)
        });
      },
      error: (err) => console.error('Error loading product discounts:', err)
    });
  }

  private loadDropdownOptions(): void {
    this.accountGroupService.getAccountGroups({ itemsPerPage: 100 }).subscribe({
      next: (response) => {
        this.accountGroupOptions.set(
          (response.member || []).map(g => ({ value: String(g.id), label: g.name }))
        );
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error loading account groups:', err)
    });

    this.clientService.getClients({ page: 1, itemsPerPage: 500, 'order[name]': 'asc' }).subscribe({
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

  onAccountGroupsChange(values: (string | number)[]): void {
    this.discount.update(d => ({ ...d, accountGroups: values.map(String) }));
  }

  onAccountsChange(values: (string | number)[]): void {
    this.discount.update(d => ({ ...d, accounts: values.map(String) }));
  }

  onProductTypesChange(values: (string | number)[]): void {
    this.discount.update(d => ({ ...d, productTypes: values.map(String) }));
  }

  clearAccountGroups(): void {
    this.discount.update(d => ({ ...d, accountGroups: [] }));
  }

  clearAccounts(): void {
    this.discount.update(d => ({ ...d, accounts: [] }));
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
      priority: data.priority,
      accountGroups: data.accountGroups.map(id => `/api/v1/account_groups/${id}`),
      clients: data.accounts.map(id => `/api/v1/clients/${id}`),
      productTypes: data.productTypes.length > 0 ? data.productTypes : null
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
  }

  // Product modal
  openProductModal(): void {
    this.isProductModalOpen.set(true);
    this.productSearchQuery.set('');
    this.productSearchResults.set([]);
  }

  onProductSearchChange(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.productSearchQuery.set(query);
    this.productSearchSubject.next(query);
  }

  onAddProduct(result: SearchResult): void {
    if (!this.discountId) return;

    this.productDiscountService.createProductDiscount({
      productId: result.id,
      discountId: Number(this.discountId)
    }).subscribe({
      next: (pd) => {
        this.products.update(list => [...list, {
          id: String(result.id),
          productDiscountId: pd.id,
          code: result.code,
          shortDescription: result.name
        }]);
        this.productSearchResults.update((list: SearchResult[]) => list.filter((r: SearchResult) => r.id !== result.id));
        this.toastService.success(`Added ${result.code}`);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error linking product:', err);
        this.toastService.error('Failed to link product');
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  // Dropdown
  toggleDropdown(productId: number): void {
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
    if (product.productDiscountId) {
      this.productDiscountService.deleteProductDiscount(String(product.productDiscountId)).subscribe({
        next: () => {
          this.products.update(list => list.filter(p => p.id !== product.id));
          this.toastService.success(`Removed ${product.code}`);
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error removing product:', err);
          this.toastService.error('Failed to remove product');
        }
      });
    } else {
      this.products.update(list => list.filter(p => p.id !== product.id));
    }
    this.closeDropdown();
  }
}
