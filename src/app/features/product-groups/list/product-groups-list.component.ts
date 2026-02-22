import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, ViewChild, TemplateRef, AfterViewInit, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
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
import { ProductGroup } from '@core/models/product-group.model';
import { ProductGroupService } from '@core/services/http/product-group.service';
import { AlertService } from '@services/alert.service';
import { ToastService } from '@app/ui-kit/organisms/toast-container/toast-container.component';
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
  private alertService = inject(AlertService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  private searchSubject = new Subject<string>();

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
  itemsPerPage = signal(30);
  totalItems = signal(0);

  // Computed pagination display
  showingFrom = computed(() => this.totalItems() === 0 ? 0 : (this.currentPage() - 1) * this.itemsPerPage() + 1);
  showingTo = computed(() => Math.min(this.currentPage() * this.itemsPerPage(), this.totalItems()));

  // Data from API
  productGroups = signal<ProductGroupRow[]>([]);

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(query => {
      this.searchQuery.set(query);
      this.currentPage.set(1);
      this.loadProductGroups();
    });
  }

  ngOnInit(): void {
    this.loadProductGroups();
  }

  private loadProductGroups(): void {
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

    this.productGroupService.getProductGroups(params).subscribe({
      next: (response) => {
        const items = (response.member || []).map(p => ({ ...p, selected: false }));
        this.productGroups.set(items);
        this.totalItems.set(response.totalItems || 0);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load product groups:', error);
        this.productGroups.set([]);
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
    this.columns = [
      { key: 'checkbox', label: '', sortable: false, width: '56px', template: this.checkboxTemplate, headerTemplate: this.checkboxHeaderTemplate },
      { key: 'id', label: 'ID', sortable: true, width: '112px' },
      { key: 'name', label: 'Name', sortable: true },
      { key: 'productGroupCode', label: 'Code', sortable: true, width: '120px' },
      { key: 'totalProducts', label: 'Products', sortable: true, width: '100px' },
      { key: 'isActive', label: 'Active', sortable: true, width: '100px', template: this.activeTemplate },
      { key: 'showOnHomepage', label: 'Homepage', sortable: true, width: '120px', template: this.homepageTemplate },
      { key: 'actions', label: '', sortable: false, width: '64px', template: this.actionsTemplate }
    ];
  }

  onSearchChange(query: string): void {
    this.searchSubject.next(query);
  }

  onSortChange(event: SortEvent): void {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
    this.currentPage.set(1);
    this.loadProductGroups();
  }

  onAddProductGroup(): void {
    this.router.navigate(['/admin/product-groups/new']);
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

  async onDelete(productGroup: ProductGroupRow): Promise<void> {
    const confirmed = await this.alertService.confirm(`Are you sure you want to delete "${productGroup.name}"?`, 'Delete');
    if (confirmed) {
      this.productGroupService.deleteProductGroup(String(productGroup.id)).subscribe({
        next: () => {
          this.loadProductGroups();
        },
        error: (error) => {
          console.error('Failed to delete product group:', error);
          this.toastService.error('Failed to delete product group');
        }
      });
    }
    this.closeDropdown();
  }

  async onBulkDelete(): Promise<void> {
    const selected = this.productGroups().filter(p => p.selected);
    const confirmed = await this.alertService.confirm(`Are you sure you want to delete ${selected.length} product group(s)?`, 'Delete');
    if (confirmed) {
      selected.forEach(p => {
        this.productGroupService.deleteProductGroup(String(p.id)).subscribe({
          next: () => {
            this.loadProductGroups();
          }
        });
      });
    }
    this.selectAll.set(false);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadProductGroups();
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
}
