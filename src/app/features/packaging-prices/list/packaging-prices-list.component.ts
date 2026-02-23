import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, ViewChild, TemplateRef, AfterViewInit, inject, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms/data-table/data-table.component';
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import {
  ListHeaderComponent,
  TableFooterComponent,
  TableActionsDropdownComponent,
  TableCheckboxSelectionComponent,
  TableAction
} from '@app/ui-kit/molecules';
import { PackagingPrice } from '@core/models/packaging-price.model';
import { PackagingPriceService } from '@core/services/http/packaging-price.service';
import { AlertService } from '@services/alert.service';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';
import { ColumnSelectorComponent, ColumnDefinition } from '@shared/components/column-selector/column-selector.component';
import { ColumnSettingsService } from '@core/services/column-settings.service';

@Component({
  selector: 'app-packaging-prices-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DataTableComponent,
    BreadcrumbsComponent,
    ListHeaderComponent,
    TableFooterComponent,
    TableActionsDropdownComponent,
    TableCheckboxSelectionComponent,
    MobileFooterComponent,
    ColumnSelectorComponent
  ],
  templateUrl: './packaging-prices-list.component.html',
  styleUrls: ['./packaging-prices-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PackagingPricesListComponent implements AfterViewInit, OnInit {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private packagingPriceService = inject(PackagingPriceService);
  private alertService = inject(AlertService);
  private destroyRef = inject(DestroyRef);
  private columnSettingsService = inject(ColumnSettingsService);

  @ViewChild('checkboxTemplate') checkboxTemplate!: TemplateRef<any>;
  @ViewChild('checkboxHeaderTemplate') checkboxHeaderTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;
  @ViewChild('sizeFromTemplate') sizeFromTemplate!: TemplateRef<any>;
  @ViewChild('sizeToTemplate') sizeToTemplate!: TemplateRef<any>;
  @ViewChild('priceTemplate') priceTemplate!: TemplateRef<any>;

  // Search state
  searchQuery = signal('');
  private searchSubject = new Subject<string>();

  // Pagination state
  currentPage = signal(1);
  itemsPerPage = signal(30);
  totalItems = signal(0);

  // Loading state
  isLoading = signal(false);

  // Sort state
  sortColumn = signal<string | null>(null);
  sortDirection = signal<'asc' | 'desc' | null>(null);

  // Dropdown state
  openDropdownId = signal<number | null>(null);

  // Header dropdown state
  isHeaderDropdownOpen = signal(false);

  // Selection state
  selectAll = signal(false);

  selectedCount = computed(() => this.packagingPrices().filter(pp => pp.selected).length);
  hasSelected = computed(() => this.selectedCount() > 0);

  // Pagination display
  showingFrom = computed(() => this.totalItems() === 0 ? 0 : (this.currentPage() - 1) * this.itemsPerPage() + 1);
  showingTo = computed(() => Math.min(this.currentPage() * this.itemsPerPage(), this.totalItems()));

  // Column selector
  readonly COLUMN_STORAGE_KEY = 'packaging-prices';
  columnDefs: ColumnDefinition[] = [];
  private allColumns: TableColumn[] = [];

  // Table columns
  columns: TableColumn[] = [];

  // Table actions for dropdown
  tableActions: TableAction[] = [
    { id: 'edit', label: 'Edit', icon: 'pencil' },
    { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' }
  ];

  // Data
  packagingPrices = signal<PackagingPrice[]>([]);

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(query => {
      this.searchQuery.set(query);
      this.currentPage.set(1);
      this.loadPackagingPrices();
    });
  }

  ngOnInit(): void {
    this.loadPackagingPrices();
  }

  private loadPackagingPrices(): void {
    this.isLoading.set(true);

    const params: Record<string, string | number | boolean> = {
      page: this.currentPage(),
      itemsPerPage: this.itemsPerPage(),
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

    this.packagingPriceService.getPackagingPrices(params).subscribe({
      next: (response) => {
        const prices = (response.member || []).map((pp: PackagingPrice) => ({
          ...pp,
          selected: false
        }));
        this.packagingPrices.set(prices);
        this.totalItems.set(response.totalItems || 0);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading packaging prices:', error);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  ngAfterViewInit(): void {
    this.initColumns();
    this.cdr.detectChanges();
  }

  private initColumns(): void {
    const defaultColumnDefs: ColumnDefinition[] = [
      { key: 'name', label: 'Name', visible: true, locked: true },
      { key: 'sizeFrom', label: 'Size from', visible: true },
      { key: 'sizeTo', label: 'Size to', visible: true },
      { key: 'priceBase', label: 'Price base', visible: true }
    ];

    this.columnDefs = this.columnSettingsService.loadColumns(this.COLUMN_STORAGE_KEY, defaultColumnDefs);

    this.allColumns = [
      { key: 'checkbox', label: '', sortable: false, width: '56px', template: this.checkboxTemplate, headerTemplate: this.checkboxHeaderTemplate },
      { key: 'name', label: 'Name', sortable: true },
      { key: 'sizeFrom', label: 'Size from', sortable: true, template: this.sizeFromTemplate },
      { key: 'sizeTo', label: 'Size to', sortable: true, template: this.sizeToTemplate },
      { key: 'priceBase', label: 'Price base', sortable: true, template: this.priceTemplate },
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
    this.loadPackagingPrices();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadPackagingPrices();
  }

  onAddPackagingPrice(): void {
    this.router.navigate(['/admin/packaging-prices/new']);
  }

  toggleDropdown(packagingPriceId: number): void {
    if (this.openDropdownId() === packagingPriceId) {
      this.openDropdownId.set(null);
    } else {
      this.openDropdownId.set(packagingPriceId);
    }
  }

  closeDropdown(): void {
    this.openDropdownId.set(null);
    this.isHeaderDropdownOpen.set(false);
  }

  onActionClick(event: { action: TableAction; row: unknown }): void {
    const packagingPrice = event.row as PackagingPrice;
    switch (event.action.id) {
      case 'edit':
        this.onEdit(packagingPrice);
        break;
      case 'delete':
        this.onDelete(packagingPrice);
        break;
    }
  }

  onEdit(packagingPrice: PackagingPrice): void {
    this.router.navigate(['/admin/packaging-prices', packagingPrice.id, 'edit']);
    this.closeDropdown();
  }

  async onDelete(packagingPrice: PackagingPrice): Promise<void> {
    const confirmed = await this.alertService.confirm(`Are you sure you want to delete "${packagingPrice.name || 'this item'}"?`, 'Delete');
    if (!confirmed) {
      this.closeDropdown();
      return;
    }
    this.packagingPriceService.deletePackagingPrice(String(packagingPrice.id)).subscribe({
      next: () => {
        this.loadPackagingPrices();
      },
      error: (error) => {
        console.error('Error deleting packaging price:', error);
      }
    });
    this.closeDropdown();
  }

  async onBulkDelete(): Promise<void> {
    const selected = this.packagingPrices().filter(pp => pp.selected);
    if (selected.length === 0) return;
    const confirmed = await this.alertService.confirm(`Are you sure you want to delete ${selected.length} packaging price(s)?`, 'Delete');
    if (!confirmed) return;

    const deletePromises = selected.map(pp =>
      this.packagingPriceService.deletePackagingPrice(String(pp.id)).toPromise()
    );

    Promise.all(deletePromises).then(() => {
      this.selectAll.set(false);
      this.loadPackagingPrices();
    }).catch(error => {
      console.error('Error bulk deleting packaging prices:', error);
      this.loadPackagingPrices();
    });
  }

  onHeaderDropdownToggle(isOpen: boolean): void {
    this.isHeaderDropdownOpen.set(isOpen);
    if (isOpen) {
      this.openDropdownId.set(null);
    }
  }

  onSelectAll(): void {
    const updated = this.packagingPrices().map(pp => ({ ...pp, selected: true }));
    this.packagingPrices.set(updated);
    this.selectAll.set(true);
  }

  onSelectNone(): void {
    const updated = this.packagingPrices().map(pp => ({ ...pp, selected: false }));
    this.packagingPrices.set(updated);
    this.selectAll.set(false);
  }

  togglePackagingPriceSelection(packagingPrice: PackagingPrice): void {
    const updated = this.packagingPrices().map(pp =>
      pp.id === packagingPrice.id ? { ...pp, selected: !pp.selected } : pp
    );
    this.packagingPrices.set(updated);
    this.selectAll.set(updated.every(pp => pp.selected));
  }

  formatSize(value: string | null): string {
    if (value == null || value === '') return '-';
    const num = parseFloat(value);
    return isNaN(num) ? value : String(num);
  }

  formatPrice(value: string | null): string {
    if (value == null) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '0,00 €';
    return num.toFixed(2).replace('.', ',') + ' €';
  }
}
