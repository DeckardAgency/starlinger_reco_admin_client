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
import { FuelSurcharge } from '@core/models/fuel-surcharge.model';
import { FuelSurchargeService } from '@core/services/http/fuel-surcharge.service';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';

@Component({
  selector: 'app-fuel-surcharges-list',
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
  templateUrl: './fuel-surcharges-list.component.html',
  styleUrls: ['./fuel-surcharges-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FuelSurchargesListComponent implements OnInit, AfterViewInit {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private fuelSurchargeService = inject(FuelSurchargeService);

  @ViewChild('checkboxTemplate') checkboxTemplate!: TemplateRef<any>;
  @ViewChild('checkboxHeaderTemplate') checkboxHeaderTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;
  @ViewChild('fuelSurchargeTemplate') fuelSurchargeTemplate!: TemplateRef<any>;

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

  selectedCount = computed(() => this.fuelSurcharges().filter(fs => fs.selected).length);
  hasSelected = computed(() => this.selectedCount() > 0);

  // Table columns
  columns: TableColumn[] = [];

  // Table actions for dropdown
  tableActions: TableAction[] = [
    { id: 'edit', label: 'Edit', icon: 'pencil' },
    { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' }
  ];

  // Data
  fuelSurcharges = signal<FuelSurcharge[]>([]);

  // Filtered and sorted fuel surcharges
  filteredFuelSurcharges = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const sortCol = this.sortColumn();
    const sortDir = this.sortDirection();
    let result = this.fuelSurcharges();

    if (query) {
      result = result.filter(fs =>
        fs.name.toLowerCase().includes(query) ||
        String(fs.id).includes(query)
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
  totalItems = computed(() => this.filteredFuelSurcharges().length);

  ngOnInit(): void {
    this.loadFuelSurcharges();
  }

  private loadFuelSurcharges(): void {
    this.isLoading.set(true);
    this.fuelSurchargeService.getFuelSurcharges().subscribe({
      next: (response) => {
        this.fuelSurcharges.set(response.member.map((fs: FuelSurcharge) => ({ ...fs, selected: false })));
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading fuel surcharges:', error);
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
      { key: 'id', label: 'id', sortable: true, width: '112px' },
      { key: 'name', label: 'Name', sortable: true },
      { key: 'date', label: 'Date', sortable: true },
      { key: 'fuelSurcharge', label: 'Fuel surcharge', sortable: true, template: this.fuelSurchargeTemplate },
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

  onAddFuelSurcharge(): void {
    this.router.navigate(['/admin/fuel-surcharges/new']);
  }

  toggleDropdown(fuelSurchargeId: string): void {
    if (this.openDropdownId() === fuelSurchargeId) {
      this.openDropdownId.set(null);
    } else {
      this.openDropdownId.set(fuelSurchargeId);
    }
  }

  closeDropdown(): void {
    this.openDropdownId.set(null);
    this.isHeaderDropdownOpen.set(false);
  }

  onActionClick(event: { action: TableAction; row: unknown }): void {
    const fuelSurcharge = event.row as FuelSurcharge;
    switch (event.action.id) {
      case 'edit':
        this.onEdit(fuelSurcharge);
        break;
      case 'delete':
        this.onDelete(fuelSurcharge);
        break;
    }
  }

  onEdit(fuelSurcharge: FuelSurcharge): void {
    this.router.navigate(['/admin/fuel-surcharges', fuelSurcharge.id, 'edit']);
    this.closeDropdown();
  }

  onDelete(fuelSurcharge: FuelSurcharge): void {
    console.log('Delete fuel surcharge:', fuelSurcharge);
    this.closeDropdown();
  }

  onBulkDelete(): void {
    const selected = this.fuelSurcharges().filter(fs => fs.selected);
    console.log('Bulk delete fuel surcharges:', selected);
    const remaining = this.fuelSurcharges().filter(fs => !fs.selected);
    this.fuelSurcharges.set(remaining);
    this.selectAll.set(false);
  }

  onHeaderDropdownToggle(isOpen: boolean): void {
    this.isHeaderDropdownOpen.set(isOpen);
    if (isOpen) {
      this.openDropdownId.set(null);
    }
  }

  onSelectAll(): void {
    const updated = this.fuelSurcharges().map(fs => ({ ...fs, selected: true }));
    this.fuelSurcharges.set(updated);
    this.selectAll.set(true);
  }

  onSelectNone(): void {
    const updated = this.fuelSurcharges().map(fs => ({ ...fs, selected: false }));
    this.fuelSurcharges.set(updated);
    this.selectAll.set(false);
  }

  toggleFuelSurchargeSelection(fuelSurcharge: FuelSurcharge): void {
    const updated = this.fuelSurcharges().map(fs =>
      fs.id === fuelSurcharge.id ? { ...fs, selected: !fs.selected } : fs
    );
    this.fuelSurcharges.set(updated);
    this.selectAll.set(updated.every(fs => fs.selected));
  }

  formatFuelSurcharge(value: number): string {
    return value.toFixed(4).replace('.', ',');
  }

  onExport(): void {
    console.log('Export fuel surcharges');
  }
}
