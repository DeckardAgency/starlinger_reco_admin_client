import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, ViewChild, TemplateRef, AfterViewInit, OnInit, inject } from '@angular/core';
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
import { ToggleComponent } from '@app/ui-kit/atoms/toggle/toggle.component';
import { Warehouse } from '@core/models/warehouse.model';
import { WarehouseService } from '@core/services/http/warehouse.service';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';

@Component({
  selector: 'app-warehouses-list',
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
    ToggleComponent,
    MobileFooterComponent
  ],
  templateUrl: './warehouses-list.component.html',
  styleUrls: ['./warehouses-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WarehousesListComponent implements OnInit, AfterViewInit {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private warehouseService = inject(WarehouseService);

  @ViewChild('checkboxTemplate') checkboxTemplate!: TemplateRef<any>;
  @ViewChild('checkboxHeaderTemplate') checkboxHeaderTemplate!: TemplateRef<any>;
  @ViewChild('activeTemplate') activeTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;

  // Search state
  searchQuery = signal('');

  // Loading state
  isLoading = signal(true);

  // Sort state
  sortColumn = signal<string | null>(null);
  sortDirection = signal<'asc' | 'desc' | null>(null);

  // Dropdown state
  openDropdownId = signal<string | null>(null);

  // Header dropdown state
  isHeaderDropdownOpen = signal(false);

  // Selection state
  selectAll = signal(false);

  selectedCount = computed(() => this.warehouses().filter(w => w.selected).length);
  hasSelected = computed(() => this.selectedCount() > 0);

  // Table columns
  columns: TableColumn[] = [];

  // Table actions for dropdown
  tableActions: TableAction[] = [
    { id: 'edit', label: 'Edit', icon: 'pencil' },
    { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' }
  ];

  // Pagination
  currentPage = signal(1);
  itemsPerPage = signal(17);

  // Data
  warehouses = signal<Warehouse[]>([]);

  // Filtered and sorted warehouses
  filteredWarehouses = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const sortCol = this.sortColumn();
    const sortDir = this.sortDirection();
    let result = this.warehouses();

    if (query) {
      result = result.filter(w =>
        w.name.toLowerCase().includes(query) ||
        (w.address && w.address.toLowerCase().includes(query)) ||
        (w.city && w.city.toLowerCase().includes(query)) ||
        String(w.id).includes(query)
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
  totalItems = computed(() => this.filteredWarehouses().length);

  ngOnInit(): void {
    this.loadWarehouses();
  }

  private loadWarehouses(): void {
    this.isLoading.set(true);

    this.warehouseService.getWarehouses(1, 100).subscribe({
      next: (response) => {
        const items = (response.member || []).map(w => ({ ...w, selected: false, documents: w.documents || [] }));
        this.warehouses.set(items);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load warehouses:', error);
        this.warehouses.set([]);
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
      { key: 'id', label: 'ID', sortable: false, width: '112px' },
      { key: 'name', label: 'Name', sortable: false },
      { key: 'address', label: 'Address', sortable: false },
      { key: 'city', label: 'City', sortable: false },
      { key: 'active', label: 'Active', sortable: false, width: '192px', template: this.activeTemplate },
      { key: 'actions', label: '', sortable: false, width: '64px', template: this.actionsTemplate }
    ];
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    console.log('Searching:', this.searchQuery);
  }

  onSortChange(event: SortEvent): void {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
  }

  onAddWarehouse(): void {
    this.router.navigate(['/admin/warehouses/new']);
  }

  toggleDropdown(warehouseId: string, event: Event | void): void {
    if (event) {
      (event as Event).stopPropagation();
    }
    if (this.openDropdownId() === warehouseId) {
      this.openDropdownId.set(null);
    } else {
      this.openDropdownId.set(warehouseId);
    }
  }

  closeDropdown(): void {
    this.openDropdownId.set(null);
    this.isHeaderDropdownOpen.set(false);
  }

  onActionClick(event: { action: TableAction; row: unknown }): void {
    const warehouse = event.row as Warehouse;
    switch (event.action.id) {
      case 'edit':
        this.onEdit(warehouse);
        break;
      case 'delete':
        this.onDelete(warehouse);
        break;
    }
  }

  onEdit(warehouse: Warehouse): void {
    this.router.navigate(['/admin/warehouses', warehouse.id, 'edit']);
    this.closeDropdown();
  }

  onDelete(warehouse: Warehouse): void {
    console.log('Delete warehouse:', warehouse);
    this.closeDropdown();
  }

  onBulkDelete(): void {
    const selected = this.warehouses().filter(w => w.selected);
    console.log('Bulk delete warehouses:', selected);
    const remaining = this.warehouses().filter(w => !w.selected);
    this.warehouses.set(remaining);
    this.selectAll.set(false);
  }

  onHeaderDropdownToggle(isOpen: boolean): void {
    this.isHeaderDropdownOpen.set(isOpen);
    if (isOpen) {
      this.openDropdownId.set(null);
    }
  }

  onSelectAll(): void {
    const updated = this.warehouses().map(w => ({ ...w, selected: true }));
    this.warehouses.set(updated);
    this.selectAll.set(true);
  }

  onSelectNone(): void {
    const updated = this.warehouses().map(w => ({ ...w, selected: false }));
    this.warehouses.set(updated);
    this.selectAll.set(false);
  }

  toggleWarehouseSelection(warehouse: Warehouse): void {
    const updated = this.warehouses().map(w =>
      w.id === warehouse.id ? { ...w, selected: !w.selected } : w
    );
    this.warehouses.set(updated);
    this.selectAll.set(updated.every(w => w.selected));
  }

  toggleActive(warehouse: Warehouse, value: boolean): void {
    const updated = this.warehouses().map(w =>
      w.id === warehouse.id ? { ...w, active: value } : w
    );
    this.warehouses.set(updated);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }
}
