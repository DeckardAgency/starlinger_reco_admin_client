import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed, ViewChild, TemplateRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
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
import { DiscountService } from '@core/services/http/discount.service';

interface DiscountDetail {
  id: string;
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
  id: '',
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
    DataTableComponent
  ],
  templateUrl: './discounts-edit.component.html',
  styleUrls: ['./discounts-edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiscountsEditComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();
  private discountId: string | null = null;

  @ViewChild('productActionsTemplate') productActionsTemplate!: TemplateRef<any>;

  // Form state
  discount = signal<DiscountDetail>({ ...EMPTY_DISCOUNT });
  isEditMode = signal(false);
  isLoading = signal(false);

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

  // Account options (mock data)
  accountGroupOptions = [
    { value: 'group1', label: 'VIP Clients' },
    { value: 'group2', label: 'Standard Clients' },
    { value: 'group3', label: 'Wholesale Partners' }
  ];

  accountOptions = [
    { value: 'acc1', label: 'Recycling team Gmbh' },
    { value: 'acc2', label: 'Rodomsko recycling' },
    { value: 'acc3', label: 'General recycling group' },
    { value: 'acc4', label: 'ABC Industries' },
    { value: 'acc5', label: 'XYZ Manufacturing' }
  ];

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
    private discountService: DiscountService
  ) {}

  ngOnInit(): void {
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
          id: discount.id || id,
          name: discount.name || '',
          active: discount.isActive || false,
          dateFrom: discount.dateValidFrom || '',
          dateTo: discount.dateValidTo || '',
          discountPercent: parseFloat(discount.discountPercent || '0') || 0,
          priority: discount.priority || 0,
          accountGroups: discountAny.accountGroups || [],
          accounts: discountAny.accounts || []
        });
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

  // Navigation
  onBack(): void {
    this.router.navigate(['/admin/discounts/list']);
  }

  // Form handlers
  onActiveChange(active: boolean): void {
    this.discount.update(d => ({ ...d, active }));
  }

  onNameChange(value: string): void {
    this.discount.update(d => ({ ...d, name: value }));
  }

  onDateFromChange(value: string): void {
    this.discount.update(d => ({ ...d, dateFrom: value }));
  }

  onDateToChange(value: string): void {
    this.discount.update(d => ({ ...d, dateTo: value }));
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
    return this.accountGroupOptions.find(o => o.value === value)?.label || value;
  }

  getAccountLabel(value: string): string {
    return this.accountOptions.find(o => o.value === value)?.label || value;
  }

  // Save actions
  onSave(): void {
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

    const operation = this.isEditMode()
      ? this.discountService.updateDiscount(this.discountId!, apiData)
      : this.discountService.createDiscount(apiData);

    operation.subscribe({
      next: () => this.router.navigate(['/admin/discounts/list']),
      error: (error) => console.error('Error saving discount:', error)
    });
  }

  onSaveAndContinue(): void {
    console.log('Save and continue:', this.discount());
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
