import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, ViewChild, TemplateRef, AfterViewInit, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, forkJoin } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms/data-table/data-table.component';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { ListHeaderComponent } from '@app/ui-kit/molecules/list-header/list-header.component';
import { TableFooterComponent } from '@app/ui-kit/molecules/table-footer/table-footer.component';
import { TableCheckboxSelectionComponent } from '@app/ui-kit/molecules/table-checkbox-selection/table-checkbox-selection.component';
import { TableActionsDropdownComponent, TableAction, ActionClickEvent } from '@app/ui-kit/molecules/table-actions-dropdown/table-actions-dropdown.component';
import { ProductService } from '@core/services/http/product.service';
import { AlertService } from '@services/alert.service';
import { Product as ApiProduct } from '@core/models';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';
import { ColumnSelectorComponent, ColumnDefinition } from '@shared/components/column-selector/column-selector.component';
import { ColumnSettingsService } from '@core/services/column-settings.service';

interface Product {
  id: number;
  code: string;
  name: string;
  shortDescription: string;
  qty: number;
  qtyStep: number;
  selected?: boolean;
}

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DataTableComponent,
    IconComponent,
    BreadcrumbsComponent,
    ListHeaderComponent,
    TableFooterComponent,
    TableCheckboxSelectionComponent,
    TableActionsDropdownComponent,
    MobileFooterComponent,
    ColumnSelectorComponent
  ],
  templateUrl: './products-list.component.html',
  styleUrls: ['./products-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductsListComponent implements OnInit, AfterViewInit {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private productService = inject(ProductService);
  private alertService = inject(AlertService);
  private destroyRef = inject(DestroyRef);
  private columnSettingsService = inject(ColumnSettingsService);

  private searchSubject = new Subject<string>();

  @ViewChild('checkboxTemplate') checkboxTemplate!: TemplateRef<any>;
  @ViewChild('checkboxHeaderTemplate') checkboxHeaderTemplate!: TemplateRef<any>;
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

  // Computed: selected products count
  selectedCount = computed(() => this.products().filter(p => p.selected).length);

  // Computed: has any selected
  hasSelected = computed(() => this.selectedCount() > 0);

  readonly COLUMN_STORAGE_KEY = 'products';
  columnDefs: ColumnDefinition[] = [];
  private allColumns: TableColumn[] = [];
  columns: TableColumn[] = [];

  // Table actions
  tableActions: TableAction[] = [
    { id: 'edit', label: 'Edit', icon: 'edit' },
    { id: 'clone', label: 'Clone', icon: 'copy' },
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
  products = signal<Product[]>([]);

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(query => {
      this.searchQuery.set(query);
      this.currentPage.set(1);
      this.loadProducts();
    });
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  ngAfterViewInit(): void {
    this.initColumns();
    this.cdr.detectChanges();
  }

  private loadProducts(): void {
    this.isLoading.set(true);

    const params: Record<string, string | number | boolean> = {
      page: this.currentPage(),
      itemsPerPage: this.itemsPerPage()
    };

    const query = this.searchQuery().trim();
    if (query) {
      params['search'] = query;
    }

    const sortCol = this.sortColumn();
    const sortDir = this.sortDirection();
    if (sortCol && sortDir) {
      params[`order[${sortCol}]`] = sortDir;
    }

    this.productService.getProducts(params).subscribe({
      next: (response) => {
        const items = (response.member || []).map(p => this.mapApiProductToDisplay(p));
        this.products.set(items);
        this.totalItems.set(response.totalItems || 0);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load products:', error);
        this.products.set([]);
        this.totalItems.set(0);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  private mapApiProductToDisplay(p: ApiProduct): Product {
    return {
      id: p.id,
      code: p.partNo || '',
      name: p.name,
      shortDescription: p.shortDescription || '',
      qty: 1,
      qtyStep: 1,
      selected: false
    };
  }

  private initColumns(): void {
    const defaultColumnDefs: ColumnDefinition[] = [
      { key: 'id', label: 'Product ID', visible: true, locked: true },
      { key: 'code', label: 'Code', visible: true },
      { key: 'name', label: 'Name', visible: true, locked: true },
      { key: 'shortDescription', label: 'Short description', visible: true },
      { key: 'qty', label: 'Qty', visible: true },
      { key: 'qtyStep', label: 'Qty step', visible: true }
    ];

    this.columnDefs = this.columnSettingsService.loadColumns(this.COLUMN_STORAGE_KEY, defaultColumnDefs);

    this.allColumns = [
      { key: 'checkbox', label: '', sortable: false, width: '56px', template: this.checkboxTemplate, headerTemplate: this.checkboxHeaderTemplate },
      { key: 'id', label: 'Product ID', sortable: true, width: '112px' },
      { key: 'code', label: 'Code', sortable: true, width: '128px' },
      { key: 'name', label: 'Name', sortable: true, width: '266px' },
      { key: 'shortDescription', label: 'Short description', sortable: true },
      { key: 'qty', label: 'Qty', sortable: true, width: '96px' },
      { key: 'qtyStep', label: 'Qty step', sortable: true, width: '96px' },
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
      ['checkbox', 'actions'].includes(col.key) || visibleKeys.has(col.key)
    );
  }

  onSearchChange(query: string): void {
    this.searchSubject.next(query);
  }

  onSortChange(event: SortEvent): void {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
    this.currentPage.set(1);
    this.loadProducts();
  }

  onExport(): void {
    this.productService.exportToExcel(
      this.sortColumn() || undefined,
      this.sortDirection() || undefined,
      this.searchQuery() || undefined
    ).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `products-${new Date().toISOString().slice(0, 10)}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Export failed:', err)
    });
  }

  onAddProduct(): void {
    this.router.navigate(['/admin/products/new']);
  }

  toggleDropdown(productId: number): void {
    if (this.openDropdownId() === productId) {
      this.openDropdownId.set(null);
    } else {
      this.openDropdownId.set(productId);
    }
  }

  closeDropdown(): void {
    this.openDropdownId.set(null);
    this.isHeaderDropdownOpen.set(false);
  }

  onActionClick(event: ActionClickEvent): void {
    const product = event.row as Product;
    switch (event.actionId) {
      case 'edit':
        this.onEdit(product);
        break;
      case 'clone':
        this.onClone(product);
        break;
      case 'delete':
        this.onDelete(product);
        break;
    }
  }

  onEdit(product: Product): void {
    this.router.navigate(['/admin/products', product.id, 'edit']);
    this.closeDropdown();
  }

  onClone(product: Product): void {
    this.closeDropdown();
    this.productService.getProductById(String(product.id)).subscribe({
      next: (fullProduct) => {
        const cloneData: Record<string, unknown> = {
          name: `Copy of ${fullProduct.name}`,
          partNo: fullProduct.partNo ? `${fullProduct.partNo}-copy` : '',
          slug: fullProduct.slug ? `${fullProduct.slug}-copy` : undefined,
          isActive: false,
          qty: fullProduct.qty,
          qtyStep: fullProduct.qtyStep,
          quoteItemLimit: fullProduct.quoteItemLimit,
          fixedQty: fullProduct.fixedQty,
          weight: fullProduct.weight || null,
          productGroupId: fullProduct.productGroupId || null,
          productType: fullProduct.productType || null,
          catalogCode: fullProduct.catalogCode || null,
          price: fullProduct.price,
          currency: fullProduct.currency || null,
          shortDescription: fullProduct.shortDescription || null
        };

        this.productService.createProduct(cloneData as any).subscribe({
          next: (newProduct) => {
            this.router.navigate(['/admin/products', newProduct.id, 'edit']);
          },
          error: (err) => console.error('Error cloning product:', err)
        });
      },
      error: (err) => console.error('Error fetching product for clone:', err)
    });
  }

  async onDelete(product: Product): Promise<void> {
    const confirmed = await this.alertService.confirm(`Are you sure you want to delete "${product.name}"?`, 'Delete');
    if (!confirmed) {
      this.closeDropdown();
      return;
    }
    this.productService.deleteProduct(String(product.id)).subscribe({
      next: () => {
        this.loadProducts();
      },
      error: (error) => console.error('Error deleting product:', error)
    });
    this.closeDropdown();
  }

  async onBulkDelete(): Promise<void> {
    const selected = this.products().filter(p => p.selected);
    const confirmed = await this.alertService.confirm(`Are you sure you want to delete ${selected.length} product(s)?`, 'Delete');
    if (confirmed && selected.length > 0) {
      // Delete in parallel and reload the list once, instead of one request +
      // one full reload per selected product.
      forkJoin(selected.map(p => this.productService.deleteProduct(String(p.id)))).subscribe({
        next: () => this.loadProducts(),
        error: (error) => console.error('Error deleting products:', error)
      });
    }
    this.selectAll.set(false);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadProducts();
  }

  onHeaderDropdownToggle(isOpen: boolean): void {
    this.isHeaderDropdownOpen.set(isOpen);
    this.openDropdownId.set(null);
  }

  onSelectAll(): void {
    const updated = this.products().map(p => ({ ...p, selected: true }));
    this.products.set(updated);
    this.selectAll.set(true);
    this.isHeaderDropdownOpen.set(false);
  }

  onSelectNone(): void {
    const updated = this.products().map(p => ({ ...p, selected: false }));
    this.products.set(updated);
    this.selectAll.set(false);
    this.isHeaderDropdownOpen.set(false);
  }

  toggleProductSelection(product: Product): void {
    const updated = this.products().map(p =>
      p.id === product.id ? { ...p, selected: !p.selected } : p
    );
    this.products.set(updated);
    this.selectAll.set(updated.every(p => p.selected));
  }
}
