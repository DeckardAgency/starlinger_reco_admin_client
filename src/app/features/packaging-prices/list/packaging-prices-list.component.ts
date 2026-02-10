import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, ViewChild, TemplateRef, AfterViewInit, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

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
    MobileFooterComponent
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

  @ViewChild('checkboxTemplate') checkboxTemplate!: TemplateRef<any>;
  @ViewChild('checkboxHeaderTemplate') checkboxHeaderTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;
  @ViewChild('sizeFromTemplate') sizeFromTemplate!: TemplateRef<any>;
  @ViewChild('sizeToTemplate') sizeToTemplate!: TemplateRef<any>;
  @ViewChild('priceTemplate') priceTemplate!: TemplateRef<any>;

  // Search state
  searchQuery = signal('');

  // Loading state
  isLoading = signal(false);

  // Sort state
  sortColumn = signal<string | null>(null);
  sortDirection = signal<'asc' | 'desc' | null>(null);

  // Dropdown state
  openDropdownId = signal<string | null>(null);

  // Header dropdown state
  isHeaderDropdownOpen = signal(false);

  // Selection state
  selectAll = signal(false);

  selectedCount = computed(() => this.packagingPrices().filter(pp => pp.selected).length);
  hasSelected = computed(() => this.selectedCount() > 0);

  // Table columns
  columns: TableColumn[] = [];

  // Table actions for dropdown
  tableActions: TableAction[] = [
    { id: 'edit', label: 'Edit', icon: 'pencil' },
    { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' }
  ];

  // Data
  packagingPrices = signal<PackagingPrice[]>([]);

  // Filtered and sorted packaging prices
  filteredPackagingPrices = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const sortCol = this.sortColumn();
    const sortDir = this.sortDirection();
    let result = this.packagingPrices();

    if (query) {
      result = result.filter(pp =>
        (pp.name || '').toLowerCase().includes(query) ||
        String(pp.id).includes(query)
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
  totalItems = computed(() => this.filteredPackagingPrices().length);

  ngOnInit(): void {
    this.loadPackagingPrices();
  }

  private loadPackagingPrices(): void {
    this.isLoading.set(true);
    this.packagingPriceService.getPackagingPrices().subscribe({
      next: (response) => {
        const prices = response.member.map((pp: PackagingPrice) => ({
          ...pp,
          selected: false
        }));
        this.packagingPrices.set(prices);
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
    this.columns = [
      { key: 'checkbox', label: '', sortable: false, width: '56px', template: this.checkboxTemplate, headerTemplate: this.checkboxHeaderTemplate },
      { key: 'name', label: 'Name', sortable: true },
      { key: 'sizeFrom', label: 'Size from', sortable: true, template: this.sizeFromTemplate },
      { key: 'sizeTo', label: 'Size to', sortable: true, template: this.sizeToTemplate },
      { key: 'priceBase', label: 'Price base', sortable: true, template: this.priceTemplate },
      { key: 'actions', label: '', sortable: false, width: '64px', template: this.actionsTemplate }
    ];
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
  }

  onSortChange(event: SortEvent): void {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
  }

  onAddPackagingPrice(): void {
    this.router.navigate(['/admin/packaging-prices/new']);
  }

  toggleDropdown(packagingPriceId: string): void {
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
    this.packagingPriceService.deletePackagingPrice(packagingPrice.id).subscribe({
      next: () => {
        this.packagingPrices.update(list => list.filter(pp => pp.id !== packagingPrice.id));
        this.cdr.markForCheck();
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
      this.packagingPriceService.deletePackagingPrice(pp.id).toPromise()
    );

    Promise.all(deletePromises).then(() => {
      this.packagingPrices.update(list => list.filter(pp => !pp.selected));
      this.selectAll.set(false);
      this.cdr.markForCheck();
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
