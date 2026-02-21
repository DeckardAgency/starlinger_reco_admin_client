import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, ViewChild, TemplateRef, AfterViewInit, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms/data-table/data-table.component';
import { BadgeComponent } from '@app/ui-kit/atoms/badge/badge.component';
import { Discount } from '@core/models/discount.model';
import { DiscountService } from '@core/services/http/discount.service';
import { AlertService } from '@services/alert.service';

// Consolidated components
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { ListHeaderComponent } from '@app/ui-kit/molecules/list-header/list-header.component';
import { TableActionsDropdownComponent, TableAction } from '@app/ui-kit/molecules/table-actions-dropdown/table-actions-dropdown.component';
import { TableCheckboxSelectionComponent } from '@app/ui-kit/molecules/table-checkbox-selection/table-checkbox-selection.component';
import { TableFooterComponent } from '@app/ui-kit/molecules/table-footer/table-footer.component';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';

interface DiscountRow extends Discount {
  status: 'active' | 'inactive';
  selected?: boolean;
}

@Component({
  selector: 'app-discounts-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DataTableComponent,
    BadgeComponent,
    BreadcrumbsComponent,
    ListHeaderComponent,
    TableActionsDropdownComponent,
    TableCheckboxSelectionComponent,
    TableFooterComponent,
    MobileFooterComponent
  ],
  templateUrl: './discounts-list.component.html',
  styleUrls: ['./discounts-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiscountsListComponent implements OnInit, AfterViewInit {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private discountService = inject(DiscountService);
  private alertService = inject(AlertService);

  @ViewChild('checkboxTemplate') checkboxTemplate!: TemplateRef<any>;
  @ViewChild('checkboxHeaderTemplate') checkboxHeaderTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;

  // Search state
  searchQuery = signal('');

  // Loading state
  isLoading = signal(false);

  // Sort state
  sortColumn = signal<string | null>(null);
  sortDirection = signal<'asc' | 'desc' | null>(null);

  // Dropdown state
  openDropdownId = signal<number | null>(null);

  // Header dropdown state (for select all)
  isHeaderDropdownOpen = signal(false);

  // Selection state
  selectAll = signal(false);

  // Computed: selected discounts count
  selectedCount = computed(() => this.discounts().filter(d => d.selected).length);

  // Computed: has any selected
  hasSelected = computed(() => this.selectedCount() > 0);

  // Table columns
  columns: TableColumn[] = [];

  // Table actions
  tableActions: TableAction[] = [
    { id: 'edit', label: 'Edit', icon: 'pencil' },
    { id: 'clone', label: 'Clone', icon: 'copy' },
    { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' }
  ];

  // Data from API
  discounts = signal<DiscountRow[]>([]);

  // Filtered and sorted discounts
  filteredDiscounts = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const sortCol = this.sortColumn();
    const sortDir = this.sortDirection();
    let result = this.discounts();

    if (query) {
      result = result.filter(d =>
        d.name.toLowerCase().includes(query) ||
        String(d.id).includes(query)
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
  totalCount = computed(() => this.filteredDiscounts().length);

  ngOnInit(): void {
    this.loadDiscounts();
  }

  ngAfterViewInit(): void {
    this.initColumns();
    this.cdr.detectChanges();
  }

  private loadDiscounts(): void {
    this.isLoading.set(true);
    this.discountService.getDiscounts().subscribe({
      next: (response) => {
        const discountRows: DiscountRow[] = (response.member || []).map(d => ({
          ...d,
          dateValidFrom: this.formatDate(d.dateValidFrom),
          dateValidTo: this.formatDate(d.dateValidTo),
          status: d.isActive ? 'active' as const : 'inactive' as const,
          selected: false
        }));
        this.discounts.set(discountRows);
        this.isLoading.set(false);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading discounts:', error);
        this.isLoading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  private formatDate(dateString: string | null): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }

  private initColumns(): void {
    this.columns = [
      { key: 'checkbox', label: '', sortable: false, width: '56px', template: this.checkboxTemplate, headerTemplate: this.checkboxHeaderTemplate },
      { key: 'id', label: 'Id', sortable: false, width: '68px' },
      { key: 'name', label: 'Name', sortable: false },
      { key: 'status', label: 'Status', sortable: false, width: '96px', template: this.statusTemplate },
      { key: 'priority', label: 'Priority', sortable: false, width: '96px' },
      { key: 'dateValidFrom', label: 'Date valid from', sortable: false, width: '180px' },
      { key: 'dateValidTo', label: 'Date valid to', sortable: false, width: '180px' },
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

  onAddDiscount(): void {
    this.router.navigate(['/admin/discounts/new']);
  }

  toggleDropdown(discountId: number): void {
    if (this.openDropdownId() === discountId) {
      this.openDropdownId.set(null);
    } else {
      this.openDropdownId.set(discountId);
    }
  }

  closeDropdown(): void {
    this.openDropdownId.set(null);
    this.isHeaderDropdownOpen.set(false);
  }

  onActionClick(event: { action: TableAction; row: unknown }): void {
    const discount = event.row as DiscountRow;
    if (event.action.id === 'edit') {
      this.router.navigate(['/admin/discounts', discount.id, 'edit']);
    } else if (event.action.id === 'clone') {
      console.log('Clone discount:', discount);
    } else if (event.action.id === 'delete') {
      this.deleteDiscount(discount);
      return;
    }
    this.closeDropdown();
  }

  private async deleteDiscount(discount: DiscountRow): Promise<void> {
    const confirmed = await this.alertService.confirm(`Are you sure you want to delete "${discount.name}"?`, 'Delete');
    if (!confirmed) {
      this.closeDropdown();
      return;
    }
    this.discountService.deleteDiscount(String(discount.id)).subscribe({
      next: () => {
        this.discounts.update(list => list.filter(d => d.id !== discount.id));
        this.cdr.markForCheck();
      },
      error: (error) => console.error('Error deleting discount:', error)
    });
    this.closeDropdown();
  }

  async onBulkDelete(): Promise<void> {
    const selected = this.discounts().filter(d => d.selected);
    if (selected.length === 0) return;
    const confirmed = await this.alertService.confirm(`Are you sure you want to delete ${selected.length} discount(s)?`, 'Delete');
    if (!confirmed) return;

    const deleteOps = selected.map(d =>
      this.discountService.deleteDiscount(String(d.id)).toPromise()
    );
    Promise.all(deleteOps).then(() => {
      this.discounts.update(list => list.filter(d => !d.selected));
      this.selectAll.set(false);
      this.cdr.markForCheck();
    }).catch(error => {
      console.error('Error bulk deleting discounts:', error);
      this.loadDiscounts();
    });
  }

  onHeaderDropdownToggle(isOpen: boolean): void {
    this.isHeaderDropdownOpen.set(isOpen);
    this.openDropdownId.set(null);
  }

  onSelectAll(): void {
    const updated = this.discounts().map(d => ({ ...d, selected: true }));
    this.discounts.set(updated);
    this.selectAll.set(true);
    this.isHeaderDropdownOpen.set(false);
  }

  onSelectNone(): void {
    const updated = this.discounts().map(d => ({ ...d, selected: false }));
    this.discounts.set(updated);
    this.selectAll.set(false);
    this.isHeaderDropdownOpen.set(false);
  }

  toggleDiscountSelection(discount: DiscountRow): void {
    const updated = this.discounts().map(d =>
      d.id === discount.id ? { ...d, selected: !d.selected } : d
    );
    this.discounts.set(updated);
    // Update selectAll based on all discounts being selected
    this.selectAll.set(updated.every(d => d.selected));
  }
}
