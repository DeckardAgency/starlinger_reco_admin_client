import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, ViewChild, TemplateRef, AfterViewInit, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms/data-table/data-table.component';
import { DeliveryPrice } from '@core/models/delivery-price.model';
import { DeliveryPriceService } from '@core/services/http/delivery-price.service';
import { AlertService } from '@services/alert.service';

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
    BadgeComponent
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

  // Table columns
  columns: TableColumn[] = [];

  // Table actions
  tableActions: TableAction[] = [
    { id: 'edit', label: 'Edit', icon: 'pencil' },
    { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' }
  ];

  // Pagination
  currentPage = signal(1);
  itemsPerPage = signal(17);

  // Data
  deliveryPrices = signal<DeliveryPrice[]>([]);

  // Filtered and sorted delivery prices
  filteredDeliveryPrices = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const sortCol = this.sortColumn();
    const sortDir = this.sortDirection();
    let result = this.deliveryPrices();

    if (query) {
      result = result.filter(dp =>
        (dp.name || '').toLowerCase().includes(query) ||
        String(dp.id).includes(query)
      );
    }

    if (sortCol && sortDir) {
      result = [...result].sort((a, b) => {
        const aVal = (a as unknown as Record<string, unknown>)[sortCol];
        const bVal = (b as unknown as Record<string, unknown>)[sortCol];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return sortDir === 'asc' ? 1 : -1;
        if (bVal == null) return sortDir === 'asc' ? -1 : 1;
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  });

  // Total count
  totalItems = computed(() => this.filteredDeliveryPrices().length);

  ngOnInit(): void {
    this.loadDeliveryPrices();
  }

  private loadDeliveryPrices(): void {
    this.isLoading.set(true);

    this.deliveryPriceService.getDeliveryPrices(1, 100).subscribe({
      next: (response) => {
        const items = (response.member || []).map(dp => ({ ...dp, selected: false }));
        this.deliveryPrices.set(items);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load delivery prices:', error);
        this.deliveryPrices.set([]);
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
    this.columns = [
      { key: 'checkbox', label: '', sortable: false, width: '56px', template: this.checkboxTemplate, headerTemplate: this.checkboxHeaderTemplate },
      { key: 'name', label: 'ID', sortable: false },
      { key: 'deliveryType', label: 'Delivery type', sortable: false, template: this.deliveryTypeTemplate },
      { key: 'sizeFrom', label: 'Size from', sortable: false },
      { key: 'priceBase', label: 'Price base', sortable: false, template: this.priceTemplate },
      { key: 'stepStartsAt', label: 'Step starts at', sortable: false },
      { key: 'forEveryNextSize', label: 'For every next size', sortable: false },
      { key: 'priceBaseStep', label: 'Price base step', sortable: false },
      { key: 'actions', label: '', sortable: false, width: '64px', template: this.actionsTemplate }
    ];
  }

  onSearchQueryChange(query: string): void {
    this.searchQuery.set(query);
    this.onSearch();
  }

  onSearch(): void {
    console.log('Searching:', this.searchQuery);
  }

  onSortChange(event: SortEvent): void {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
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
        this.deliveryPrices.update(list => list.filter(dp => dp.id !== deliveryPrice.id));
        this.cdr.markForCheck();
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
      this.deliveryPrices.update(list => list.filter(dp => !dp.selected));
      this.selectAll.set(false);
      this.cdr.markForCheck();
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

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }
}
