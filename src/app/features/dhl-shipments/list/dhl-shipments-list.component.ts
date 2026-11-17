import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, ViewChild, TemplateRef, AfterViewInit, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, of, switchMap, catchError } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms/data-table/data-table.component';
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { ListHeaderComponent, TableFooterComponent } from '@app/ui-kit/molecules';
import { TabsComponent, TabItem } from '@app/ui-kit/molecules/tabs/tabs.component';
import { BadgeComponent, BadgeVariant } from '@app/ui-kit/atoms/badge/badge.component';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { ToastService } from '@app/ui-kit/organisms/toast-container/toast-container.component';
import { LoggerService } from '@core/services/logger.service';
import { DhlShipment } from '@core/models/dhl-shipment.model';
import { DhlShipmentService } from '@core/services/http/dhl-shipment.service';

/**
 * Every DHL Express request made from the order pages — booked, refused by DHL
 * (failed) and cancelled — newest first. The warehouse's "delivery requests"
 * overview: see at a glance what is going out, print labels again, and spot
 * requests DHL refused so they can be corrected on the order.
 */
@Component({
  selector: 'app-dhl-shipments-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DataTableComponent,
    BreadcrumbsComponent,
    ListHeaderComponent,
    TableFooterComponent,
    TabsComponent,
    BadgeComponent,
    IconComponent
  ],
  templateUrl: './dhl-shipments-list.component.html',
  styleUrls: ['./dhl-shipments-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DhlShipmentsListComponent implements OnInit, AfterViewInit {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private dhlService = inject(DhlShipmentService);
  private toastService = inject(ToastService);
  private logger = inject(LoggerService);

  @ViewChild('orderTemplate') orderTemplate!: TemplateRef<any>;
  @ViewChild('awbTemplate') awbTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;
  @ViewChild('plannedTemplate') plannedTemplate!: TemplateRef<any>;
  @ViewChild('packagesTemplate') packagesTemplate!: TemplateRef<any>;
  @ViewChild('pickupTemplate') pickupTemplate!: TemplateRef<any>;
  @ViewChild('createdTemplate') createdTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;

  searchQuery = signal('');
  private searchSubject = new Subject<string>();
  private loadRequest$ = new Subject<void>();

  currentPage = signal(1);
  itemsPerPage = signal(30);
  totalItems = signal(0);
  isLoading = signal(true);

  // The API only sorts this collection by createdAt
  sortColumn = signal<string | null>('createdAt');
  sortDirection = signal<'asc' | 'desc' | null>('desc');

  activeTab = signal('all');
  tabs: TabItem[] = [
    { id: 'all', label: 'All' },
    { id: 'booked', label: 'Booked' },
    { id: 'failed', label: 'Failed' },
    { id: 'cancelled', label: 'Cancelled' }
  ];

  shipments = signal<DhlShipment[]>([]);
  columns: TableColumn[] = [];

  showingFrom = computed(() => this.totalItems() === 0 ? 0 : (this.currentPage() - 1) * this.itemsPerPage() + 1);
  showingTo = computed(() => Math.min(this.currentPage() * this.itemsPerPage(), this.totalItems()));

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(query => {
      this.searchQuery.set(query);
      this.currentPage.set(1);
      this.load();
    });

    this.loadRequest$.pipe(
      switchMap(() => this.dhlService.list(this.buildParams()).pipe(
        catchError(error => {
          this.logger.error('[DHL] Failed to load shipments', error);
          return of(null);
        })
      )),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(response => {
      this.shipments.set(response?.member ?? []);
      this.totalItems.set(response?.totalItems ?? 0);
      this.isLoading.set(false);
      this.cdr.markForCheck();
    });
  }

  ngOnInit(): void {
    this.load();
  }

  ngAfterViewInit(): void {
    this.columns = [
      { key: 'createdAt', label: 'Requested', sortable: true, width: '150px', template: this.createdTemplate },
      { key: 'orderNumber', label: 'Order', sortable: false, template: this.orderTemplate },
      { key: 'awb', label: 'Waybill', sortable: false, width: '150px', template: this.awbTemplate },
      { key: 'status', label: 'Status', sortable: false, template: this.statusTemplate },
      { key: 'plannedShippingAt', label: 'Shipping', sortable: false, width: '150px', template: this.plannedTemplate },
      { key: 'packages', label: 'Packages', sortable: false, width: '120px', template: this.packagesTemplate },
      { key: 'pickup', label: 'Courier pickup', sortable: false, width: '150px', template: this.pickupTemplate },
      { key: 'actions', label: '', sortable: false, width: '220px', template: this.actionsTemplate }
    ];
    this.cdr.detectChanges();
  }

  private load(): void {
    this.isLoading.set(true);
    this.loadRequest$.next();
  }

  private buildParams(): Record<string, string | number | boolean> {
    const params: Record<string, string | number | boolean> = {
      page: this.currentPage(),
      itemsPerPage: this.itemsPerPage(),
      'order[createdAt]': this.sortDirection() ?? 'desc',
    };
    if (this.activeTab() !== 'all') {
      params['status'] = this.activeTab();
    }
    const query = this.searchQuery().trim();
    if (query) {
      params['order.orderNumber'] = query;
    }
    return params;
  }

  onSearchChange(query: string): void {
    this.searchSubject.next(query);
  }

  onTabChange(tabId: string): void {
    this.activeTab.set(tabId);
    this.currentPage.set(1);
    this.load();
  }

  onSortChange(event: SortEvent): void {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
    this.currentPage.set(1);
    this.load();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.load();
  }

  // --- rows -----------------------------------------------------------------

  orderId(row: DhlShipment): number | null {
    const id = Number(String(row.order ?? '').split('/').pop());
    return Number.isFinite(id) && id > 0 ? id : null;
  }

  openOrder(row: DhlShipment): void {
    const id = this.orderId(row);
    if (id) this.router.navigate(['/admin/shop-orders', id, 'edit']);
  }

  printLabel(row: DhlShipment): void {
    this.dhlService.downloadDocument(row.id, 'label').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 60000);
      },
      error: (err) => {
        this.logger.error('[DHL] Label download failed', err);
        this.toastService.error('Could not download the label.');
      },
    });
  }

  hasLabel(row: DhlShipment): boolean {
    return row.status === 'booked' && (row.documentTypes ?? []).includes('label');
  }

  trackingUrl(awb: string | null): string | null {
    return awb ? `https://www.dhl.com/global-en/home/tracking/tracking-express.html?submit=1&tracking-id=${encodeURIComponent(awb)}` : null;
  }

  statusLabel(status: DhlShipment['status']): string {
    return status === 'booked' ? 'Booked' : status === 'failed' ? 'Request failed' : 'Cancelled';
  }

  statusVariant(status: DhlShipment['status']): BadgeVariant {
    return status === 'booked' ? 'success' : status === 'failed' ? 'danger' : 'secondary';
  }

  orderStatusLabel(status: string | null): string {
    return (status ?? '').replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
  }

  pickupText(row: DhlShipment): string {
    if (row.pickupConfirmationNumber && !row.pickupCancelledAt) return `Booked · ${row.pickupConfirmationNumber}`;
    if (row.pickupCancelledAt) return 'Cancelled';
    if (row.pickupError) return 'Not booked';
    return '—';
  }

  formatDateTime(value: string | null | undefined): string {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
