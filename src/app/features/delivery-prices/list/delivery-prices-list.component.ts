import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, ViewChild, TemplateRef, AfterViewInit, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms/data-table/data-table.component';
import { DeliveryPrice } from '@core/models/delivery-price.model';
import { DeliveryPriceService } from '@core/services/http/delivery-price.service';
import { AlertService } from '@services/alert.service';
import { ColumnSelectorComponent, ColumnDefinition } from '@shared/components/column-selector/column-selector.component';
import { ColumnSettingsService } from '@core/services/column-settings.service';

// Consolidated components
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { ListHeaderComponent } from '@app/ui-kit/molecules/list-header/list-header.component';
import { TableActionsDropdownComponent, TableAction } from '@app/ui-kit/molecules/table-actions-dropdown/table-actions-dropdown.component';
import { TableCheckboxSelectionComponent } from '@app/ui-kit/molecules/table-checkbox-selection/table-checkbox-selection.component';
import { TableFooterComponent } from '@app/ui-kit/molecules/table-footer/table-footer.component';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';
import { BadgeComponent } from '@app/ui-kit/atoms/badge/badge.component';

@Component({
  selector: 'app-delivery-prices-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DataTableComponent,
    BreadcrumbsComponent,
    ListHeaderComponent,
    TableActionsDropdownComponent,
    TableCheckboxSelectionComponent,
    TableFooterComponent,
    MobileFooterComponent,
    BadgeComponent,
    ColumnSelectorComponent
  ],
  templateUrl: './delivery-prices-list.component.html',
  styleUrls: ['./delivery-prices-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeliveryPricesListComponent implements OnInit, AfterViewInit {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private deliveryPriceService = inject(DeliveryPriceService);
  private alertService = inject(AlertService);
  private destroyRef = inject(DestroyRef);
  private columnSettingsService = inject(ColumnSettingsService);

  private searchSubject = new Subject<string>();

  @ViewChild('checkboxTemplate') checkboxTemplate!: TemplateRef<any>;
  @ViewChild('checkboxHeaderTemplate') checkboxHeaderTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;
  @ViewChild('priceTemplate') priceTemplate!: TemplateRef<any>;
  @ViewChild('deliveryTypeTemplate') deliveryTypeTemplate!: TemplateRef<any>;

  // Search state
  searchQuery = signal('');

  // Loading state
  isLoading = signal(true);

  // Sort state
  sortColumn = signal<string | null>(null);
  sortDirection = signal<'asc' | 'desc' | null>(null);

  // Dropdown state
  openDropdownId = signal<number | null>(null);

  // Header dropdown state
  isHeaderDropdownOpen = signal(false);

  // Selection state
  selectAll = signal(false);

  selectedCount = computed(() => this.deliveryPrices().filter(dp => dp.selected).length);
  hasSelected = computed(() => this.selectedCount() > 0);

  // Column selector
  readonly COLUMN_STORAGE_KEY = 'delivery-prices';
  columnDefs: ColumnDefinition[] = [];
  private allColumns: TableColumn[] = [];

  // Table columns
  columns: TableColumn[] = [];

  // Table actions
  tableActions: TableAction[] = [
    { id: 'edit', label: 'Edit', icon: 'pencil' },
    { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' }
  ];

  // Pagination
  currentPage = signal(1);
  itemsPerPage = signal(30);
  totalItems = signal(0);

  showingFrom = computed(() => this.totalItems() === 0 ? 0 : (this.currentPage() - 1) * this.itemsPerPage() + 1);
  showingTo = computed(() => Math.min(this.currentPage() * this.itemsPerPage(), this.totalItems()));

  // Data
  deliveryPrices = signal<DeliveryPrice[]>([]);

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(query => {
      this.searchQuery.set(query);
      this.currentPage.set(1);
      this.loadDeliveryPrices();
    });
  }

  ngOnInit(): void {
    this.loadDeliveryPrices();
  }

  private loadDeliveryPrices(): void {
    this.isLoading.set(true);

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

    this.deliveryPriceService.getDeliveryPrices(params).subscribe({
      next: (response) => {
        const items = (response.member || []).map(dp => ({ ...dp, selected: false }));
        this.deliveryPrices.set(items);
        this.totalItems.set(response.totalItems || 0);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load delivery prices:', error);
        this.deliveryPrices.set([]);
        this.totalItems.set(0);
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
      { key: 'name', label: 'ID', visible: true, locked: true },
      { key: 'deliveryType', label: 'Delivery type', visible: true },
      { key: 'sizeFrom', label: 'Size from', visible: true },
      { key: 'priceBase', label: 'Price base', visible: true },
      { key: 'stepStartsAt', label: 'Step starts at', visible: true },
      { key: 'forEveryNextSize', label: 'For every next size', visible: true },
      { key: 'priceBaseStep', label: 'Price base step', visible: true }
    ];

    this.columnDefs = this.columnSettingsService.loadColumns(this.COLUMN_STORAGE_KEY, defaultColumnDefs);

    this.allColumns = [
      { key: 'checkbox', label: '', sortable: false, width: '56px', template: this.checkboxTemplate, headerTemplate: this.checkboxHeaderTemplate },
      { key: 'name', label: 'ID', sortable: true },
      { key: 'deliveryType', label: 'Delivery type', sortable: false, template: this.deliveryTypeTemplate },
      { key: 'sizeFrom', label: 'Size from', sortable: true },
      { key: 'priceBase', label: 'Price base', sortable: true, template: this.priceTemplate },
      { key: 'stepStartsAt', label: 'Step starts at', sortable: true },
      { key: 'forEveryNextSize', label: 'For every next size', sortable: true },
      { key: 'priceBaseStep', label: 'Price base step', sortable: true },
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

  onSearchQueryChange(query: string): void {
    this.searchSubject.next(query);
  }

  onSortChange(event: SortEvent): void {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
    this.currentPage.set(1);
    this.loadDeliveryPrices();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadDeliveryPrices();
  }

  onAddDeliveryPrice(): void {
    this.router.navigate(['/admin/delivery-prices/new']);
  }

  toggleDropdown(deliveryPriceId: number): void {
    if (this.openDropdownId() === deliveryPriceId) {
      this.openDropdownId.set(null);
    } else {
      this.openDropdownId.set(deliveryPriceId);
    }
  }

  closeDropdown(): void {
    this.openDropdownId.set(null);
    this.isHeaderDropdownOpen.set(false);
  }

  onActionClick(event: { action: TableAction; row: unknown }): void {
    const deliveryPrice = event.row as DeliveryPrice;
    if (event.action.id === 'edit') {
      this.router.navigate(['/admin/delivery-prices', deliveryPrice.id, 'edit']);
    } else if (event.action.id === 'delete') {
      this.deleteDeliveryPrice(deliveryPrice);
      return;
    }
    this.closeDropdown();
  }

  private async deleteDeliveryPrice(deliveryPrice: DeliveryPrice): Promise<void> {
    const confirmed = await this.alertService.confirm(`Are you sure you want to delete this delivery price?`, 'Delete');
    if (!confirmed) {
      this.closeDropdown();
      return;
    }
    this.deliveryPriceService.deleteDeliveryPrice(String(deliveryPrice.id)).subscribe({
      next: () => {
        this.loadDeliveryPrices();
      },
      error: (error) => console.error('Error deleting delivery price:', error)
    });
    this.closeDropdown();
  }

  async onBulkDelete(): Promise<void> {
    const selected = this.deliveryPrices().filter(dp => dp.selected);
    if (selected.length === 0) return;
    const confirmed = await this.alertService.confirm(`Are you sure you want to delete ${selected.length} delivery price(s)?`, 'Delete');
    if (!confirmed) return;

    const deleteOps = selected.map(dp =>
      this.deliveryPriceService.deleteDeliveryPrice(String(dp.id)).toPromise()
    );
    Promise.all(deleteOps).then(() => {
      this.selectAll.set(false);
      this.loadDeliveryPrices();
    }).catch(error => {
      console.error('Error bulk deleting delivery prices:', error);
      this.loadDeliveryPrices();
    });
  }

  onHeaderDropdownToggle(isOpen: boolean): void {
    this.isHeaderDropdownOpen.set(isOpen);
    this.openDropdownId.set(null);
  }

  onSelectAll(): void {
    const updated = this.deliveryPrices().map(dp => ({ ...dp, selected: true }));
    this.deliveryPrices.set(updated);
    this.selectAll.set(true);
    this.isHeaderDropdownOpen.set(false);
  }

  onSelectNone(): void {
    const updated = this.deliveryPrices().map(dp => ({ ...dp, selected: false }));
    this.deliveryPrices.set(updated);
    this.selectAll.set(false);
    this.isHeaderDropdownOpen.set(false);
  }

  toggleDeliveryPriceSelection(deliveryPrice: DeliveryPrice): void {
    const updated = this.deliveryPrices().map(dp =>
      dp.id === deliveryPrice.id ? { ...dp, selected: !dp.selected } : dp
    );
    this.deliveryPrices.set(updated);
    this.selectAll.set(updated.every(dp => dp.selected));
  }

  formatPrice(value: string | number | null): string {
    if (value == null) return '0,00 €';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0,00 €';
    return num.toFixed(2).replace('.', ',') + ' €';
  }

  getDeliveryTypeName(deliveryType: unknown): string {
    if (!deliveryType) return '';
    if (typeof deliveryType === 'object' && deliveryType !== null && 'name' in deliveryType) {
      return (deliveryType as { name: string }).name;
    }
    return String(deliveryType);
  }
}
