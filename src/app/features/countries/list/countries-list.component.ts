import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, ViewChild, TemplateRef, AfterViewInit, OnInit, inject, DestroyRef } from '@angular/core';
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
import { Country } from '@core/models/country.model';
import { CountryService } from '@core/services/http/country.service';
import { AlertService } from '@services/alert.service';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';
import { ColumnSelectorComponent, ColumnDefinition } from '@shared/components/column-selector/column-selector.component';
import { ColumnSettingsService } from '@core/services/column-settings.service';

@Component({
  selector: 'app-countries-list',
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
  templateUrl: './countries-list.component.html',
  styleUrls: ['./countries-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CountriesListComponent implements OnInit, AfterViewInit {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private countryService = inject(CountryService);
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

  // Computed: selected countries count
  selectedCount = computed(() => this.countries().filter(c => c.selected).length);

  // Computed: has any selected
  hasSelected = computed(() => this.selectedCount() > 0);

  // Column selector
  readonly COLUMN_STORAGE_KEY = 'countries';
  columnDefs: ColumnDefinition[] = [];
  private allColumns: TableColumn[] = [];

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
  countries = signal<Country[]>([]);

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(query => {
      this.searchQuery.set(query);
      this.currentPage.set(1);
      this.loadCountries();
    });
  }

  ngOnInit(): void {
    this.loadCountries();
  }

  private loadCountries(): void {
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

    this.countryService.getCountries(params).subscribe({
      next: (response) => {
        const items = (response.member || []).map(c => ({ ...c, selected: false }));
        this.countries.set(items);
        this.totalItems.set(response.totalItems || 0);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load countries:', error);
        this.countries.set([]);
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
      { key: 'name', label: 'Name', visible: true, locked: true },
      { key: 'code', label: 'Code', visible: true }
    ];

    this.columnDefs = this.columnSettingsService.loadColumns(this.COLUMN_STORAGE_KEY, defaultColumnDefs);

    this.allColumns = [
      { key: 'checkbox', label: '', sortable: false, width: '56px', template: this.checkboxTemplate, headerTemplate: this.checkboxHeaderTemplate },
      { key: 'name', label: 'Name', sortable: true },
      { key: 'code', label: 'Code', sortable: true, width: '192px' },
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
    this.loadCountries();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadCountries();
  }

  onAddCountry(): void {
    this.router.navigate(['/admin/countries/new']);
  }

  toggleDropdown(countryId: number, event: Event | void): void {
    if (event) {
      (event as Event).stopPropagation();
    }
    if (this.openDropdownId() === countryId) {
      this.openDropdownId.set(null);
    } else {
      this.openDropdownId.set(countryId);
    }
  }

  closeDropdown(): void {
    this.openDropdownId.set(null);
    this.isHeaderDropdownOpen.set(false);
  }

  onActionClick(event: { action: TableAction; row: unknown }): void {
    const country = event.row as Country;
    switch (event.action.id) {
      case 'edit':
        this.onEdit(country);
        break;
      case 'delete':
        this.onDelete(country);
        break;
    }
  }

  onEdit(country: Country): void {
    this.router.navigate(['/admin/countries', country.id, 'edit']);
    this.closeDropdown();
  }

  async onDelete(country: Country): Promise<void> {
    const confirmed = await this.alertService.confirm(`Are you sure you want to delete "${country.name}"?`, 'Delete');
    if (!confirmed) {
      this.closeDropdown();
      return;
    }
    this.countryService.deleteCountry(String(country.id)).subscribe({
      next: () => {
        this.loadCountries();
      },
      error: (error) => console.error('Error deleting country:', error)
    });
    this.closeDropdown();
  }

  async onBulkDelete(): Promise<void> {
    const selected = this.countries().filter(c => c.selected);
    if (selected.length === 0) return;
    const confirmed = await this.alertService.confirm(`Are you sure you want to delete ${selected.length} country/countries?`, 'Delete');
    if (!confirmed) return;

    const deleteOps = selected.map(c =>
      this.countryService.deleteCountry(String(c.id)).toPromise()
    );
    Promise.all(deleteOps).then(() => {
      this.selectAll.set(false);
      this.loadCountries();
    }).catch(error => {
      console.error('Error bulk deleting countries:', error);
      this.loadCountries();
    });
  }

  onHeaderDropdownToggle(isOpen: boolean): void {
    this.isHeaderDropdownOpen.set(isOpen);
    if (isOpen) {
      this.openDropdownId.set(null);
    }
  }

  onSelectAll(): void {
    const updated = this.countries().map(c => ({ ...c, selected: true }));
    this.countries.set(updated);
    this.selectAll.set(true);
  }

  onSelectNone(): void {
    const updated = this.countries().map(c => ({ ...c, selected: false }));
    this.countries.set(updated);
    this.selectAll.set(false);
  }

  toggleCountrySelection(country: Country): void {
    const updated = this.countries().map(c =>
      c.id === country.id ? { ...c, selected: !c.selected } : c
    );
    this.countries.set(updated);
    this.selectAll.set(updated.every(c => c.selected));
  }
}
