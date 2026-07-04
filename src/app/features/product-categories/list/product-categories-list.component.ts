import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, ViewChild, TemplateRef, AfterViewInit, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, of, switchMap, catchError } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms/data-table/data-table.component';
import { BadgeComponent } from '@app/ui-kit/atoms/badge/badge.component';
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import {
  ListHeaderComponent,
  TableFooterComponent,
  TableActionsDropdownComponent,
  TableCheckboxSelectionComponent,
  TableAction
} from '@app/ui-kit/molecules';
import { ProductCategory } from '@core/models/product-category.model';
import { ProductCategoryService } from '@core/services/http/product-category.service';
import { AlertService } from '@services/alert.service';
import { ToastService } from '@app/ui-kit/organisms/toast-container/toast-container.component';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';
import { ColumnSelectorComponent, ColumnDefinition } from '@shared/components/column-selector/column-selector.component';
import { ColumnSettingsService } from '@core/services/column-settings.service';

interface ProductCategoryRow extends ProductCategory {
  selected?: boolean;
}

@Component({
  selector: 'app-product-categories-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DataTableComponent,
    BadgeComponent,
    BreadcrumbsComponent,
    ListHeaderComponent,
    TableFooterComponent,
    TableActionsDropdownComponent,
    TableCheckboxSelectionComponent,
    MobileFooterComponent,
    ColumnSelectorComponent
  ],
  templateUrl: './product-categories-list.component.html',
  styleUrls: ['./product-categories-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductCategoriesListComponent implements OnInit, AfterViewInit {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private productCategoryService = inject(ProductCategoryService);
  private alertService = inject(AlertService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  private columnSettingsService = inject(ColumnSettingsService);

  private searchSubject = new Subject<string>();
  private loadRequest$ = new Subject<void>();

  @ViewChild('checkboxTemplate') checkboxTemplate!: TemplateRef<any>;
  @ViewChild('checkboxHeaderTemplate') checkboxHeaderTemplate!: TemplateRef<any>;
  @ViewChild('activeTemplate') activeTemplate!: TemplateRef<any>;
  @ViewChild('homepageTemplate') homepageTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;

  // Search state
  searchQuery = signal('');

  // Loading state
  isLoading = signal(true);

  // Sort state
  sortColumn = signal<string | null>(null);
  sortDirection = signal<'asc' | 'desc' | null>(null);

  // Dropdown state
  openDropdownId = signal<number | null>(null);

  // Header dropdown state (for select all)
  isHeaderDropdownOpen = signal(false);

  // Selection state
  selectAll = signal(false);

  // Computed: selected count
  selectedCount = computed(() => this.productCategories().filter(p => p.selected).length);

  // Computed: has any selected
  hasSelected = computed(() => this.selectedCount() > 0);

  // Column selector
  readonly COLUMN_STORAGE_KEY = 'product-categories';
  columnDefs: ColumnDefinition[] = [];
  private allColumns: TableColumn[] = [];

  // Table columns
  columns: TableColumn[] = [];

  // Table actions for dropdown
  tableActions: TableAction[] = [
    { id: 'edit', label: 'Edit', icon: 'pencil' },
    { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' }
  ];

  // Pagination
  currentPage = signal(1);
  itemsPerPage = signal(30);
  totalItems = signal(0);

  // Computed pagination display
  showingFrom = computed(() => this.totalItems() === 0 ? 0 : (this.currentPage() - 1) * this.itemsPerPage() + 1);
  showingTo = computed(() => Math.min(this.currentPage() * this.itemsPerPage(), this.totalItems()));

  // Data from API
  productCategories = signal<ProductCategoryRow[]>([]);

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(query => {
      this.searchQuery.set(query);
      this.currentPage.set(1);
      this.loadProductCategories();
    });

    // Single request pipeline: switchMap cancels any in-flight request when a
    // new load is triggered, so stale responses can never overwrite newer ones.
    this.loadRequest$.pipe(
      switchMap(() => this.productCategoryService.getProductCategories(this.buildLoadParams()).pipe(
        catchError(error => {
          console.error('Failed to load product categories:', error);
          return of(null);
        })
      )),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(response => {
      if (response) {
        const items = (response.member || []).map(p => ({ ...p, selected: false }));
        this.productCategories.set(items);
        this.totalItems.set(response.totalItems || 0);
      } else {
        this.productCategories.set([]);
        this.totalItems.set(0);
      }
      this.isLoading.set(false);
      this.cdr.markForCheck();
    });
  }

  ngOnInit(): void {
    this.loadProductCategories();
  }

  private loadProductCategories(): void {
    this.isLoading.set(true);
    this.loadRequest$.next();
  }

  private buildLoadParams(): Record<string, string | number | boolean> {
    const params: Record<string, string | number | boolean> = {
      page: this.currentPage(),
      itemsPerPage: this.itemsPerPage()
    };

    const query = this.searchQuery().trim();
    if (query) {
      params['name'] = query;
    }

    const sortCol = this.sortColumn();
    const sortDir = this.sortDirection();
    if (sortCol && sortDir) {
      params[`order[${sortCol}]`] = sortDir;
    }

    return params;
  }

  ngAfterViewInit(): void {
    this.initColumns();
    this.cdr.detectChanges();
  }

  private initColumns(): void {
    const defaultColumnDefs: ColumnDefinition[] = [
      { key: 'id', label: 'ID', visible: true },
      { key: 'name', label: 'Name', visible: true, locked: true },
      { key: 'productGroupCode', label: 'Code', visible: true },
      { key: 'totalProducts', label: 'Products', visible: true },
      { key: 'isActive', label: 'Active', visible: true },
      { key: 'showOnHomepage', label: 'Homepage', visible: true }
    ];

    this.columnDefs = this.columnSettingsService.loadColumns(this.COLUMN_STORAGE_KEY, defaultColumnDefs);

    this.allColumns = [
      { key: 'checkbox', label: '', sortable: false, width: '56px', template: this.checkboxTemplate, headerTemplate: this.checkboxHeaderTemplate },
      { key: 'id', label: 'ID', sortable: true, width: '112px' },
      { key: 'name', label: 'Name', sortable: true },
      { key: 'productGroupCode', label: 'Code', sortable: true, width: '120px' },
      { key: 'totalProducts', label: 'Products', sortable: true, width: '100px' },
      { key: 'isActive', label: 'Active', sortable: true, width: '100px', template: this.activeTemplate },
      { key: 'showOnHomepage', label: 'Homepage', sortable: true, width: '120px', template: this.homepageTemplate },
      { key: 'actions', label: '', sortable: false, width: '64px', template: this.actionsTemplate }
    ];

    this.applyColumnVisibility();
  }

  onColumnsChange(columns: ColumnDefinition[]): void {
    this.columnDefs = columns;
    this.columnSettingsService.saveColumns(this.COLUMN_STORAGE_KEY, columns);
    this.applyColumnVisibility();
    this.cdr.markForCheck();
  }

  private applyColumnVisibility(): void {
    const visibleKeys = new Set(this.columnDefs.filter(c => c.visible).map(c => c.key));
    this.columns = this.allColumns.filter(col =>
      col.key === 'actions' || col.key === 'checkbox' || visibleKeys.has(col.key)
    );
  }

  onSearchChange(query: string): void {
    this.searchSubject.next(query);
  }

  onSortChange(event: SortEvent): void {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
    this.currentPage.set(1);
    this.loadProductCategories();
  }

  onAddProductCategory(): void {
    this.router.navigate(['/admin/product-categories/new']);
  }

  toggleDropdown(id: number, event: Event | void): void {
    if (event) {
      (event as Event).stopPropagation();
    }
    if (this.openDropdownId() === id) {
      this.openDropdownId.set(null);
    } else {
      this.openDropdownId.set(id);
    }
  }

  closeDropdown(): void {
    this.openDropdownId.set(null);
    this.isHeaderDropdownOpen.set(false);
  }

  onActionClick(event: { action: TableAction; row: unknown }): void {
    const productCategory = event.row as ProductCategoryRow;
    switch (event.action.id) {
      case 'edit':
        this.onEdit(productCategory);
        break;
      case 'delete':
        this.onDelete(productCategory);
        break;
    }
  }

  onEdit(productCategory: ProductCategoryRow): void {
    this.router.navigate(['/admin/product-categories', productCategory.id, 'edit']);
    this.closeDropdown();
  }

  async onDelete(productCategory: ProductCategoryRow): Promise<void> {
    const confirmed = await this.alertService.confirm(`Are you sure you want to delete "${productCategory.name}"?`, 'Delete');
    if (confirmed) {
      this.productCategoryService.deleteProductCategory(String(productCategory.id)).subscribe({
        next: () => {
          this.loadProductCategories();
        },
        error: (error) => {
          console.error('Failed to delete product category:', error);
          this.toastService.error('Failed to delete product category');
        }
      });
    }
    this.closeDropdown();
  }

  async onBulkDelete(): Promise<void> {
    const selected = this.productCategories().filter(p => p.selected);
    const confirmed = await this.alertService.confirm(`Are you sure you want to delete ${selected.length} product category(ies)?`, 'Delete');
    if (confirmed) {
      selected.forEach(p => {
        this.productCategoryService.deleteProductCategory(String(p.id)).subscribe({
          next: () => {
            this.loadProductCategories();
          }
        });
      });
    }
    this.selectAll.set(false);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadProductCategories();
  }

  onHeaderDropdownToggle(isOpen: boolean): void {
    this.isHeaderDropdownOpen.set(isOpen);
    if (isOpen) {
      this.openDropdownId.set(null);
    }
  }

  onSelectAll(): void {
    const updated = this.productCategories().map(p => ({ ...p, selected: true }));
    this.productCategories.set(updated);
    this.selectAll.set(true);
  }

  onSelectNone(): void {
    const updated = this.productCategories().map(p => ({ ...p, selected: false }));
    this.productCategories.set(updated);
    this.selectAll.set(false);
  }

  toggleSelection(productCategory: ProductCategoryRow): void {
    const updated = this.productCategories().map(p =>
      p.id === productCategory.id ? { ...p, selected: !p.selected } : p
    );
    this.productCategories.set(updated);
    this.selectAll.set(updated.every(p => p.selected));
  }
}
