import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, ViewChild, TemplateRef, AfterViewInit, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

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
import { ProductGroup } from '@core/models/product-group.model';
import { ProductGroupService } from '@core/services/http/product-group.service';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';

interface ProductGroupRow extends ProductGroup {
  selected?: boolean;
}

@Component({
  selector: 'app-product-groups-list',
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
    MobileFooterComponent
  ],
  templateUrl: './product-groups-list.component.html',
  styleUrls: ['./product-groups-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductGroupsListComponent implements OnInit, AfterViewInit {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private productGroupService = inject(ProductGroupService);

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
  openDropdownId = signal<string | null>(null);

  // Header dropdown state (for select all)
  isHeaderDropdownOpen = signal(false);

  // Selection state
  selectAll = signal(false);

  // Computed: selected count
  selectedCount = computed(() => this.productGroups().filter(p => p.selected).length);

  // Computed: has any selected
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
  itemsPerPage = signal(20);

  // Data from API
  productGroups = signal<ProductGroupRow[]>([]);

  // Filtered and sorted product groups
  filteredProductGroups = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const sortCol = this.sortColumn();
    const sortDir = this.sortDirection();
    let result = this.productGroups();

    // Filter
    if (query) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        (p.productGroupCode && p.productGroupCode.toLowerCase().includes(query)) ||
        String(p.id).includes(query)
      );
    }

    // Sort
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
  totalItems = computed(() => this.filteredProductGroups().length);

  ngOnInit(): void {
    this.loadProductGroups();
  }

  private loadProductGroups(): void {
    this.isLoading.set(true);

    this.productGroupService.getProductGroups(1, 200).subscribe({
      next: (response) => {
        const items = (response.member || []).map(p => ({ ...p, selected: false }));
        this.productGroups.set(items);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load product groups:', error);
        this.productGroups.set([]);
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
      { key: 'name', label: 'Name', sortable: true },
      { key: 'productGroupCode', label: 'Code', sortable: true, width: '120px' },
      { key: 'totalProducts', label: 'Products', sortable: true, width: '100px' },
      { key: 'isActive', label: 'Active', sortable: false, width: '100px', template: this.activeTemplate },
      { key: 'showOnHomepage', label: 'Homepage', sortable: false, width: '120px', template: this.homepageTemplate },
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

  onAddProductGroup(): void {
    this.router.navigate(['/admin/product-groups/new']);
  }

  toggleDropdown(id: string, event: Event | void): void {
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
    const productGroup = event.row as ProductGroupRow;
    switch (event.action.id) {
      case 'edit':
        this.onEdit(productGroup);
        break;
      case 'delete':
        this.onDelete(productGroup);
        break;
    }
  }

  onEdit(productGroup: ProductGroupRow): void {
    this.router.navigate(['/admin/product-groups', productGroup.id, 'edit']);
    this.closeDropdown();
  }

  onDelete(productGroup: ProductGroupRow): void {
    if (confirm(`Are you sure you want to delete "${productGroup.name}"?`)) {
      this.productGroupService.deleteProductGroup(productGroup.id).subscribe({
        next: () => {
          this.loadProductGroups();
        },
        error: (error) => {
          console.error('Failed to delete product group:', error);
          alert('Failed to delete product group');
        }
      });
    }
    this.closeDropdown();
  }

  onBulkDelete(): void {
    const selected = this.productGroups().filter(p => p.selected);
    if (confirm(`Are you sure you want to delete ${selected.length} product group(s)?`)) {
      // Delete each selected item
      selected.forEach(p => {
        this.productGroupService.deleteProductGroup(p.id).subscribe({
          next: () => {
            const remaining = this.productGroups().filter(pg => pg.id !== p.id);
            this.productGroups.set(remaining);
          }
        });
      });
    }
    this.selectAll.set(false);
  }

  onHeaderDropdownToggle(isOpen: boolean): void {
    this.isHeaderDropdownOpen.set(isOpen);
    if (isOpen) {
      this.openDropdownId.set(null);
    }
  }

  onSelectAll(): void {
    const updated = this.productGroups().map(p => ({ ...p, selected: true }));
    this.productGroups.set(updated);
    this.selectAll.set(true);
  }

  onSelectNone(): void {
    const updated = this.productGroups().map(p => ({ ...p, selected: false }));
    this.productGroups.set(updated);
    this.selectAll.set(false);
  }

  toggleSelection(productGroup: ProductGroupRow): void {
    const updated = this.productGroups().map(p =>
      p.id === productGroup.id ? { ...p, selected: !p.selected } : p
    );
    this.productGroups.set(updated);
    this.selectAll.set(updated.every(p => p.selected));
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }
}
