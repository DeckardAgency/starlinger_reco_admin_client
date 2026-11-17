import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed, ViewChild, TemplateRef, AfterViewInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, switchMap, finalize } from 'rxjs/operators';

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
import { ModalComponent } from '@app/ui-kit/organisms/modal/modal.component';
import { ToastService } from '@app/ui-kit/organisms/toast-container/toast-container.component';
import { Discount } from '@core/models/discount.model';
import { ValidationError } from '@core/models/client.model';
import { DiscountService } from '@core/services/http/discount.service';
import { ClientService } from '@core/services/http/client.service';
import { ProductDiscountService } from '@core/services/http/product-discount.service';
import { ProductService } from '@core/services/http/product.service';
import { LoggerService } from '@core/services/logger.service';

/** Which way the percentage moves the price; it is the sign of `adjustmentPercent`. */
type AdjustmentKind = 'discount' | 'markup';

interface DiscountDetail {
  id: number;
  name: string;
  active: boolean;
  /** Signed percentage: negative = discount (price down), positive = markup (price up). 0 = not entered. */
  adjustmentPercent: number;
  /** Plain client IDs; converted to `/api/v1/clients/{id}` IRIs on save. */
  clients: string[];
  /** VT / ET; empty = all product types. */
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
  adjustmentPercent: 0,
  clients: [],
  productTypes: []
};

/** The API accepts -100 < adjustmentPercent <= 999, never 0. */
const MAX_DISCOUNT_PERCENT = 100;  // exclusive: a 100 % discount is not allowed
const MAX_MARKUP_PERCENT = 999;    // inclusive

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
  isSaving = signal(false);

  // Adjustment control: the kind is the sign of adjustmentPercent, kept separately so the
  // user's choice survives an empty percent input; the text is the raw input so typing
  // (e.g. "0." on the way to "0.5") is never clobbered by re-formatting.
  adjustmentKind = signal<AdjustmentKind>('discount');
  percentText = signal('');
  percentMax = computed(() => this.adjustmentKind() === 'discount' ? 99.99 : MAX_MARKUP_PERCENT);

  // Validation state
  touched = signal<Record<string, boolean>>({});
  errors = computed(() => {
    const discount = this.discount();
    const errs: Record<string, string> = {};
    if (!discount.name?.trim()) errs['name'] = 'Name is required';

    const magnitude = Math.abs(discount.adjustmentPercent);
    if (!(magnitude > 0)) {
      errs['adjustmentPercent'] = 'Enter a percentage greater than 0';
    } else if (this.adjustmentKind() === 'discount' && magnitude >= MAX_DISCOUNT_PERCENT) {
      errs['adjustmentPercent'] = 'A discount must be less than 100 %';
    } else if (this.adjustmentKind() === 'markup' && magnitude > MAX_MARKUP_PERCENT) {
      errs['adjustmentPercent'] = 'A markup cannot exceed 999 %';
    }

    if (discount.clients.length === 0) errs['clients'] = 'Select at least one client';
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

  // Client options for the server-side typeahead
  clientOptions = signal<{ value: string; label: string }[]>([]);
  private clientSearch$ = new Subject<string>();
  private clientSearchResults: { value: string; label: string }[] = [];
  private knownClientLabels = new Map<string, string>();

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
    private clientService: ClientService,
    private productDiscountService: ProductDiscountService,
    private productService: ProductService,
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    // Server-side client typeahead for the Clients select (instead of loading
    // 500 clients up front). switchMap cancels in-flight lookups.
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
    ).subscribe(response => {
      this.clientSearchResults = (response.clients || []).map(c => {
        const option = { value: String(c.id), label: c.name };
        this.knownClientLabels.set(option.value, option.label);
        return option;
      });
      this.updateClientOptions();
      this.cdr.markForCheck();
    });

    // Initial page of clients for the typeahead select
    this.clientSearch$.next('');

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.discountId = params['id'] || null;
      this.isEditMode.set(!!this.discountId && this.discountId !== 'new');

      if (this.isEditMode()) {
        this.loadDiscount(this.discountId!);
        this.loadProducts();
      } else {
        // New discount - reset form
        this.discount.set({ ...EMPTY_DISCOUNT });
        this.adjustmentKind.set('discount');
        this.percentText.set('');
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
        const adjustment = parseFloat(discount.adjustmentPercent ?? '') || 0;
        this.discount.set({
          id: discount.id || Number(id),
          name: discount.name || '',
          active: discount.isActive || false,
          adjustmentPercent: adjustment,
          clients: this.parseIris(discount.clients),
          productTypes: Array.isArray(discount.productTypes) ? discount.productTypes : []
        });
        // Sign -> control: negative is a discount, positive a markup; the input shows the magnitude.
        this.adjustmentKind.set(adjustment > 0 ? 'markup' : 'discount');
        this.percentText.set(adjustment === 0 ? '' : String(Math.abs(adjustment)));
        // Make sure the selected clients have labelled options in the typeahead
        this.ensureSelectedClientOptions();
        // Load linked products
        this.loadProducts();
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.logger.error('Error loading discount:', error);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  /** "/api/v1/clients/12" -> "12" (plain IDs are passed through unchanged). */
  private parseIris(values: unknown[] | null | undefined): string[] {
    return (values || []).map(v => typeof v === 'string' ? v.split('/').pop()! : String(v));
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
          error: (err) => this.logger.error('Error loading products:', err)
        });
      },
      error: (err) => this.logger.error('Error loading product discounts:', err)
    });
  }

  onClientSearch(term: string): void {
    this.clientSearch$.next(term);
  }

  /** Options = latest search results plus any selected clients not in them. */
  private updateClientOptions(): void {
    const options = [...this.clientSearchResults];
    for (const id of this.discount().clients) {
      if (!options.some(o => o.value === id)) {
        options.unshift({ value: id, label: this.knownClientLabels.get(id) ?? id });
      }
    }
    this.clientOptions.set(options);
  }

  /** Resolve labels for selected client ids that the typeahead hasn't seen. */
  private ensureSelectedClientOptions(): void {
    const missing = this.discount().clients.filter(id => !this.knownClientLabels.has(id));
    if (missing.length === 0) {
      this.updateClientOptions();
      return;
    }
    forkJoin(missing.map(id => this.clientService.getClient(id))).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (clients) => {
        clients.forEach(c => this.knownClientLabels.set(String(c.id), c.name ?? String(c.id)));
        this.updateClientOptions();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.logger.error('Error loading selected clients:', err);
        this.updateClientOptions();
        this.cdr.markForCheck();
      }
    });
  }

  // Navigation
  onBack(): void {
    this.router.navigate(['/admin/discounts/list']);
  }

  // Validation helpers
  markAllTouched(): void {
    this.touched.set({ name: true, adjustmentPercent: true, clients: true });
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

  /** Discount | Markup: re-signs the stored percentage (discount negative, markup positive). */
  onAdjustmentKindChange(kind: AdjustmentKind): void {
    this.adjustmentKind.set(kind);
    this.discount.update(d => ({ ...d, adjustmentPercent: this.signed(Math.abs(d.adjustmentPercent), kind) }));
    this.markFieldTouched('adjustmentPercent');
  }

  /** Percent input holds the magnitude; the sign comes from the selected kind. */
  onPercentInput(event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    this.percentText.set(text);
    const magnitude = Math.abs(parseFloat(text));
    this.discount.update(d => ({
      ...d,
      adjustmentPercent: Number.isFinite(magnitude) ? this.signed(magnitude, this.adjustmentKind()) : 0
    }));
    this.markFieldTouched('adjustmentPercent');
  }

  private signed(magnitude: number, kind: AdjustmentKind): number {
    return kind === 'discount' ? -magnitude : magnitude;
  }

  onClientsChange(values: (string | number)[]): void {
    this.discount.update(d => ({ ...d, clients: values.map(String) }));
    this.updateClientOptions();
    this.markFieldTouched('clients');
  }

  onProductTypesChange(values: (string | number)[]): void {
    this.discount.update(d => ({ ...d, productTypes: values.map(String) }));
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
    if (this.isSaving()) return;

    const data = this.discount();
    const payload: Partial<Discount> = {
      name: data.name.trim(),
      isActive: data.active,
      // Signed decimal string: "-20.0000" for a 20 % discount, "20.0000" for a 20 % markup
      adjustmentPercent: data.adjustmentPercent.toFixed(4),
      clients: data.clients.map(id => `/api/v1/clients/${id}`),
      productTypes: data.productTypes
    };

    const isCreating = !this.isEditMode();
    const operation = isCreating
      ? this.discountService.createDiscount(payload)
      : this.discountService.updateDiscount(this.discountId!, payload);

    this.isSaving.set(true);
    operation.pipe(finalize(() => { this.isSaving.set(false); this.cdr.markForCheck(); })).subscribe({
      next: (result) => {
        this.toastService.success('Saved successfully');
        if (navigateToList) {
          this.router.navigate(['/admin/discounts/list']);
        } else if (isCreating && result?.id) {
          this.router.navigate(['/admin/discounts', result.id, 'edit']);
        }
      },
      error: (error) => {
        this.logger.error('Error saving discount:', error);
        this.toastService.error(this.describeSaveError(error));
      }
    });
  }

  /** Surface the API's 422 violation messages / detail instead of a generic message. */
  private describeSaveError(error: unknown): string {
    const body = (error as { error?: Partial<ValidationError> } | null)?.error;
    const messages = (body?.violations ?? []).map(v => v.message).filter(Boolean);
    if (messages.length > 0) return [...new Set(messages)].join(' ');
    return body?.detail || 'Failed to save discount';
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
        this.logger.error('Error linking product:', err);
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
          this.logger.error('Error removing product:', err);
          this.toastService.error('Failed to remove product');
        }
      });
    } else {
      this.products.update(list => list.filter(p => p.id !== product.id));
    }
    this.closeDropdown();
  }
}
