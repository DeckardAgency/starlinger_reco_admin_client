import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed, ViewChild, TemplateRef, ElementRef, AfterViewInit, ChangeDetectorRef, inject, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subject, Observable, from, of } from 'rxjs';
import { takeUntil, filter, finalize, map, mergeMap, tap, catchError } from 'rxjs/operators';
import { HttpClient, HttpEventType, HttpResponse } from '@angular/common/http';

import { BreadcrumbsComponent, BreadcrumbItem } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { BadgeComponent } from '@app/ui-kit/atoms/badge/badge.component';
import { ToggleComponent } from '@app/ui-kit/atoms/toggle/toggle.component';
import { FormFieldComponent } from '@app/ui-kit/molecules/form-field/form-field.component';
import { SelectComponent, SelectOption } from '@app/ui-kit/atoms/select/select.component';
import { TabsComponent, TabItem } from '@app/ui-kit/molecules/tabs/tabs.component';
import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms/data-table/data-table.component';
import { ModalComponent } from '@app/ui-kit/organisms/modal/modal.component';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { TableFooterComponent } from '@app/ui-kit/molecules/table-footer/table-footer.component';
import { TextEditorComponent } from '@shared/components/text-editor/text-editor.component';
import { TableActionsDropdownComponent, TableAction, ActionClickEvent } from '@app/ui-kit/molecules/table-actions-dropdown/table-actions-dropdown.component';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';
import { FileUploadComponent, RejectedFile } from '@app/ui-kit/molecules/file-upload/file-upload.component';
import { ProductService } from '@core/services/http/product.service';
import { ProductCategoryService } from '@core/services/http/product-category.service';
import { ProductProductLinkService } from '@core/services/http/product-product-link.service';
import { Product, MediaItem, ProductProductLink, ProductLinkRelationType, PRODUCT_LINK_RELATION_TYPES } from '@core/models';
import { MediaService } from '@core/services/http/media.service';
import { environment } from '@env/environment';
import { ToastService } from '@app/ui-kit/organisms/toast-container/toast-container.component';
import { LoggerService } from '@core/services/logger.service';

interface ProductDetail {
  id: number;
  code: string;
  name: string;
  active: boolean;
  url: string;
  quantity: number;
  quantityStep: number;
  quoteItemLimit: number;
  fixedQuantity: number;
  weight: string;
  productGroup: string;
  productType: string;
  catalogCode: string;
  basePrice: number;
  currency: string;
  shortDescription: string;
}

interface RelatedProduct {
  id: number;
  productId: string;
  code: string;
  name: string;
  status: 'active' | 'inactive';
  available: boolean;
}

/** A row of the alternative/replacement tables: `id` is the LINK id, the product itself is `childProductId`. */
interface LinkedProduct extends RelatedProduct {
  childProductId: number;
  relationType: ProductLinkRelationType;
  sortOrder: number;
}

/** Tab id → relation type managed by that tab. */
const LINK_TAB_TYPES: Record<string, ProductLinkRelationType> = {
  alternativeParts: 'alternative',
  replacementParts: 'replacement'
};
const EMPTY_ID_SET: ReadonlySet<number> = new Set<number>();

// Mirrors the backend media limits (CreateMediaItemAction): image MIME whitelist, 5 MB per file.
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES_PER_UPLOAD = 50;
const MAX_CONCURRENT_UPLOADS = 3;

interface GalleryImage {
  id: number;
  name: string;
  url: string;
  isPrimary?: boolean;
}

interface ProductDocument {
  id: number;
  fileType: string;
  name: string;
  size: string;
}

const EMPTY_PRODUCT: ProductDetail = {
  id: 0,
  code: '',
  name: '',
  active: false,
  url: '',
  quantity: 0,
  quantityStep: 1,
  quoteItemLimit: 0,
  fixedQuantity: 0,
  weight: '',
  productGroup: '',
  productType: '',
  catalogCode: '',
  basePrice: 0,
  currency: '',
  shortDescription: ''
};

@Component({
  selector: 'app-products-edit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    BreadcrumbsComponent,
    BadgeComponent,
    ToggleComponent,
    FormFieldComponent,
    SelectComponent,
    TabsComponent,
    DataTableComponent,
    ModalComponent,
    IconComponent,
    TableFooterComponent,
    TextEditorComponent,
    MobileFooterComponent,
    TableActionsDropdownComponent,
    FileUploadComponent
  ],
  templateUrl: './products-edit.component.html',
  styleUrls: ['./products-edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductsEditComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();
  private toastService = inject(ToastService);

  // State
  product = signal<ProductDetail>(EMPTY_PRODUCT);
  isEditMode = signal(false);
  isSaving = signal(false);
  private lastSaveAt = 0;
  activeTab = signal('shortDescription');

  // Breadcrumb items
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Products', route: '/admin/products' },
    { label: 'Product detail', route: '' }
  ];

  // Rich text editor
  editorContent = signal('');
  textFormat = signal('Normal');
  textSize = signal('Size');

  // Gallery
  galleryImages = signal<GalleryImage[]>([]);
  activeImageDropdown = signal<number | null>(null);
  primaryImageId = signal<number | null>(null);

  // Gallery upload (dropzone + drop-anywhere on the grid)
  readonly imageAccept = IMAGE_MIME_TYPES.join(',');
  readonly maxImageSize = MAX_IMAGE_SIZE;
  readonly maxImagesPerUpload = MAX_IMAGES_PER_UPLOAD;
  readonly imageUploadHint = `JPEG, PNG, GIF or WebP, up to ${MAX_IMAGE_SIZE / 1024 / 1024} MB per image`;
  isDraggingOverGallery = signal(false);
  /** Non-null while an upload batch is running; `percent` aggregates the byte progress of all files. */
  uploadProgress = signal<{ done: number; total: number; percent: number } | null>(null);

  // Product documents
  productDocuments = signal<ProductDocument[]>([]);
  selectedDocumentIds = signal<Set<number>>(new Set());

  // Alternative / replacement parts. Links are loaded once per product and split by relationType;
  // the template shows ONE table bound to the active tab's list and selection.
  availableProducts = signal<RelatedProduct[]>([]);
  alternativeLinks = signal<LinkedProduct[]>([]);
  replacementLinks = signal<LinkedProduct[]>([]);
  private readonly linksByType: Record<ProductLinkRelationType, WritableSignal<LinkedProduct[]>> = {
    alternative: this.alternativeLinks,
    replacement: this.replacementLinks
  };
  private readonly selectedLinkIdsByType: Record<ProductLinkRelationType, WritableSignal<Set<number>>> = {
    alternative: signal(new Set<number>()),
    replacement: signal(new Set<number>())
  };
  /** Relation type the active tab manages — null on the non-link tabs (hides the available-products area). */
  activeRelationType = computed<ProductLinkRelationType | null>(() => LINK_TAB_TYPES[this.activeTab()] ?? null);
  activeRelationLabel = computed(() => {
    const type = this.activeRelationType();
    return PRODUCT_LINK_RELATION_TYPES.find(t => t.value === type)?.label ?? '';
  });
  activeLinks = computed(() => {
    const type = this.activeRelationType();
    return type ? this.linksByType[type]() : [];
  });
  activeSelectedLinkIds = computed<ReadonlySet<number>>(() => {
    const type = this.activeRelationType();
    return type ? this.selectedLinkIdsByType[type]() : EMPTY_ID_SET;
  });
  addLinkLabel = computed(() => `Add as ${this.activeRelationLabel().toLowerCase()}`);
  addSelectedLinksLabel = computed(() => `Add selected as ${this.activeRelationLabel().toLowerCase()}`);
  /** Products already linked with EITHER type — excluded from the available list (unique (parent, child) on the backend). */
  linkedChildProductIds = computed(() =>
    new Set([...this.alternativeLinks(), ...this.replacementLinks()].map(l => l.childProductId))
  );
  filteredAvailableProducts = computed(() => {
    const linked = this.linkedChildProductIds();
    const currentProductId = this.product().id;
    return this.availableProducts().filter(p => !linked.has(p.id) && p.id !== currentProductId);
  });
  selectedProductIds = signal<Set<number>>(new Set());

  // Search and pagination
  searchQuery = signal('');
  currentPage = signal(1);
  totalItems = signal(197);
  itemsPerPage = 13;

  // Sorting
  sortColumn = signal<string | null>(null);
  sortDirection = signal<'asc' | 'desc' | null>(null);

  // Dropdowns
  openDropdownId = signal<number | null>(null);
  isHeaderDropdownOpen = signal(false);
  isRelatedHeaderDropdownOpen = signal(false);
  isDocHeaderDropdownOpen = signal(false);
  activeDocActionId = signal<number | null>(null);

  documentActions: TableAction[] = [
    { id: 'rename', label: 'Rename', icon: 'edit' },
    { id: 'download', label: 'Download', icon: 'download' },
    { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' }
  ];

  // Rename modal
  isRenameModalOpen = signal(false);
  renameValue = signal('');
  renameExtension = signal('');
  renameItemId = signal<number | null>(null);
  renameItemType = signal<'image' | 'document' | null>(null);

  // Options
  productGroupOptions = signal<SelectOption[]>([]);

  currencyOptions: SelectOption[] = [
    { value: 'EUR', label: 'Euro' },
    { value: 'USD', label: 'US Dollar' },
    { value: 'GBP', label: 'British Pound' }
  ];

  productTypeOptions: SelectOption[] = [
    { value: 'VT', label: 'VT' },
    { value: 'ET', label: 'ET' }
  ];

  // Select model values
  productGroupValue = '';
  currencyValue = '';
  productTypeValue = '';

  // Validation state
  touched = signal<Record<string, boolean>>({});
  errors = computed(() => {
    const product = this.product();
    const errs: Record<string, string> = {};
    if (!product.name?.trim()) errs['name'] = 'Name is required';
    return errs;
  });
  isValid = computed(() => Object.keys(this.errors()).length === 0);

  markAllTouched(): void {
    this.touched.set({ name: true });
  }

  markFieldTouched(field: string): void {
    this.touched.update(t => ({ ...t, [field]: true }));
  }

  getError(field: string): string {
    return this.touched()[field] ? (this.errors()[field] || '') : '';
  }

  // Tabs
  editorTabs: TabItem[] = [
    { id: 'shortDescription', label: 'Short description' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'documents', label: 'Product documents' },
    { id: 'alternativeParts', label: 'Alternative parts' },
    { id: 'replacementParts', label: 'Replacement parts' }
  ];

  // Table columns
  availableProductColumns: TableColumn[] = [];
  relatedProductColumns: TableColumn[] = [];

  @ViewChild('checkboxTemplate') checkboxTemplate!: TemplateRef<any>;
  @ViewChild('checkboxHeaderTemplate') checkboxHeaderTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;
  @ViewChild('availableTemplate') availableTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;
  @ViewChild('relatedCheckboxTemplate') relatedCheckboxTemplate!: TemplateRef<any>;
  @ViewChild('relatedCheckboxHeaderTemplate') relatedCheckboxHeaderTemplate!: TemplateRef<any>;
  @ViewChild('sortOrderTemplate') sortOrderTemplate!: TemplateRef<any>;
  @ViewChild('removeActionsTemplate') removeActionsTemplate!: TemplateRef<any>;

  // Document table templates
  @ViewChild('docCheckboxHeaderTemplate') docCheckboxHeaderTemplate!: TemplateRef<any>;
  @ViewChild('docCheckboxTemplate') docCheckboxTemplate!: TemplateRef<any>;
  @ViewChild('docActionsTemplate') docActionsTemplate!: TemplateRef<any>;

  // File input refs
  @ViewChild('documentFileInput') documentFileInput!: ElementRef<HTMLInputElement>;

  // Document table columns
  documentColumns: TableColumn[] = [];

  // Computed
  totalPages = computed(() => Math.ceil(this.totalItems() / this.itemsPerPage));
  showingFrom = computed(() => (this.currentPage() - 1) * this.itemsPerPage + 1);
  showingTo = computed(() => Math.min(this.currentPage() * this.itemsPerPage, this.totalItems()));

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private productService: ProductService,
    private productCategoryService: ProductCategoryService,
    private productProductLinkService: ProductProductLinkService,
    private mediaService: MediaService,
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    this.loadProductCategories();

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id');
      if (id && id !== 'new') {
        this.isEditMode.set(true);
        this.loadProduct(id);
      } else {
        this.isEditMode.set(false);
        this.resetForm();
      }
    });

    this.loadAvailableProducts();
  }

  private loadProductCategories(): void {
    this.productCategoryService.getAllProductCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const options = response.member
            .filter(pg => pg.isActive !== false)
            .map(pg => ({ value: pg.id, label: pg.name }));
          this.productGroupOptions.set(options);
          this.cdr.markForCheck();
        },
        error: (err) => this.logger.error('Error loading product categories:', err)
      });
  }

  ngAfterViewInit(): void {
    this.initColumns();
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initColumns(): void {
    this.availableProductColumns = [
      { key: 'checkbox', label: '', width: '56px', headerTemplate: this.checkboxHeaderTemplate, template: this.checkboxTemplate },
      { key: 'productId', label: 'Product ID', width: '112px' },
      { key: 'code', label: 'Code', width: '128px' },
      { key: 'name', label: 'Name', sortable: true },
      { key: 'status', label: 'Status', width: '96px', template: this.statusTemplate },
      { key: 'available', label: 'Available', width: '96px', template: this.availableTemplate },
      { key: 'actions', label: '', width: '196px', template: this.actionsTemplate }
    ];

    this.relatedProductColumns = [
      { key: 'checkbox', label: '', width: '56px', headerTemplate: this.relatedCheckboxHeaderTemplate, template: this.relatedCheckboxTemplate },
      { key: 'productId', label: 'Product ID', width: '112px' },
      { key: 'code', label: 'Code', width: '128px' },
      { key: 'name', label: 'Product', sortable: true },
      { key: 'status', label: 'Status', width: '96px', template: this.statusTemplate },
      { key: 'sortOrder', label: 'Sort order', width: '128px', template: this.sortOrderTemplate },
      { key: 'actions', label: '', width: '134px', template: this.removeActionsTemplate }
    ];

    this.documentColumns = [
      { key: 'checkbox', label: '', width: '56px', headerTemplate: this.docCheckboxHeaderTemplate, template: this.docCheckboxTemplate },
      { key: 'fileType', label: 'File type', width: '112px' },
      { key: 'name', label: 'Name' },
      { key: 'size', label: 'Size', width: '149px' },
      { key: 'actions', label: '', width: '72px', template: this.docActionsTemplate }
    ];
  }

  private loadProduct(id: string): void {
    this.productService.getProductById(id).subscribe({
      next: (apiProduct) => {
        const productData = this.mapApiProductToDetail(apiProduct);
        this.product.set(productData);
        this.productGroupValue = productData.productGroup;
        this.currencyValue = productData.currency;
        this.productTypeValue = productData.productType;

        // Track featured image
        const featuredId = (apiProduct as any).featuredImage?.id || null;
        this.primaryImageId.set(featuredId);

        // Load gallery images from product response
        this.galleryImages.set(
          (apiProduct.imageGallery || []).map((m: MediaItem) => ({
            id: m.id,
            name: m.filename || '',
            url: m.filePath ? `${environment.apiBaseUrl}${m.filePath}` : '',
            isPrimary: m.id === featuredId
          }))
        );

        // Load documents from product response
        this.productDocuments.set(
          (apiProduct.documents || []).map((m: MediaItem) => ({
            id: m.id,
            fileType: (m.mimeType || '').split('/').pop()?.toUpperCase() || 'FILE',
            name: m.filename || '',
            size: '-'
          }))
        );

        // Load alternative / replacement links
        this.loadProductLinks(id);

        this.cdr.markForCheck();
      },
      error: () => {
        this.product.set({ ...EMPTY_PRODUCT, id: Number(id) });
        this.cdr.markForCheck();
      }
    });
  }

  private mapApiProductToDetail(p: Product): ProductDetail {
    return {
      id: p.id,
      code: p.partNo ?? '',
      name: p.name ?? '',
      active: p.isActive ?? true,
      url: p.slug ?? '',
      quantity: p.qty ?? 0,
      quantityStep: p.qtyStep ?? 1,
      quoteItemLimit: p.quoteItemLimit ?? 0,
      fixedQuantity: p.fixedQty ?? 0,
      weight: p.weight ?? '',
      productGroup: String(p.productGroupId ?? ''),
      productType: p.productType ?? '',
      catalogCode: p.catalogCode ?? '',
      basePrice: p.price ?? 0,
      currency: p.currency ?? 'EUR',
      shortDescription: p.shortDescription ?? ''
    };
  }

  private loadAvailableProducts(): void {
    const query = this.searchQuery();
    const obs = query
      ? this.productService.searchProducts(query)
      : this.productService.getProducts({ page: this.currentPage(), itemsPerPage: this.itemsPerPage });

    obs.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.availableProducts.set((response.member || []).map(p => this.toRelatedProduct(p)));
          this.totalItems.set(response.totalItems || 0);
          this.cdr.markForCheck();
        },
        error: (err) => this.logger.error('Error loading available products:', err)
      });
  }

  /** One request for all links of the product, one batch request for their child products, then split by type. */
  private loadProductLinks(productId: string): void {
    this.productProductLinkService.getByParentProductId(productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const links = response.member || [];
          if (links.length === 0) {
            this.setLinks([]);
            return;
          }
          const childIds = [...new Set(links.map(l => l.childProductId))];
          this.productService.getProductsByIds(childIds)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (resp) => {
                const byId = new Map<number, RelatedProduct>();
                (resp.member || []).forEach(p => byId.set(p.id, this.toRelatedProduct(p)));
                this.setLinks(links.map(link => this.toLinkedProduct(link, byId.get(link.childProductId))));
              },
              error: (err) => this.logger.error('Error loading linked product details:', err)
            });
        },
        error: (err) => this.logger.error('Error loading product links:', err)
      });
  }

  private setLinks(rows: LinkedProduct[]): void {
    const byOrd = (a: LinkedProduct, b: LinkedProduct) => a.sortOrder - b.sortOrder;
    this.alternativeLinks.set(rows.filter(r => r.relationType === 'alternative').sort(byOrd));
    this.replacementLinks.set(rows.filter(r => r.relationType === 'replacement').sort(byOrd));
    this.cdr.markForCheck();
  }

  private toRelatedProduct(p: Product): RelatedProduct {
    return {
      id: p.id,
      productId: p.partNo || String(p.id),
      code: p.partNo || '',
      name: p.name || '',
      status: p.isActive ? 'active' : 'inactive',
      available: p.isActive ?? true
    };
  }

  private toLinkedProduct(link: ProductProductLink, product: RelatedProduct | undefined): LinkedProduct {
    const base: RelatedProduct = product ?? {
      id: link.childProductId,
      productId: String(link.childProductId),
      code: '-',
      name: 'Unknown product',
      status: 'inactive',
      available: false
    };
    return {
      ...base,
      id: link.id,
      childProductId: link.childProductId,
      relationType: link.relationType,
      sortOrder: link.ord ?? 0
    };
  }


  private resetForm(): void {
    this.product.set({ ...EMPTY_PRODUCT });
    this.editorContent.set('');
    this.selectedProductIds.set(new Set());
    this.setLinks([]);
    this.productGroupValue = '';
    this.currencyValue = '';
    this.productTypeValue = '';
  }

  // Navigation
  goBack(): void {
    this.router.navigate(['/admin/products/list']);
  }

  // Toggle handlers
  onActiveChange(value: boolean): void {
    this.product.update(p => ({ ...p, active: value }));
  }

  // Field update handlers
  updateProduct(field: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.product.update(p => ({ ...p, [field]: value }));
  }

  updateProductNumber(field: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const parsed = parseFloat(input.value);
    const numValue = isNaN(parsed) ? 0 : Math.max(0, parsed);
    // The model is clamped to >= 0, but a bare [value] binding won't re-write the
    // input once the model is already 0 — so a typed negative like "-11" stays
    // visible. Snap the display back when the user entered a negative. (Valid
    // positive/partial input such as "10." is left alone so decimals still type.)
    if (!isNaN(parsed) && parsed < 0 && input.value !== String(numValue)) {
      input.value = String(numValue);
    }
    this.product.update(p => ({ ...p, [field]: numValue }));
  }

  // Currency handlers
  onCurrencyChange(value: string | number): void {
    this.currencyValue = String(value);
    this.product.update(p => ({ ...p, currency: String(value) }));
  }

  clearCurrency(): void {
    this.currencyValue = '';
    this.product.update(p => ({ ...p, currency: '' }));
  }

  // Tab handler
  onTabChange(tabId: string): void {
    this.activeTab.set(tabId);
  }

  // Rich text editor
  onFormatClick(format: string): void {
    this.logger.debug('Format:', format);
    // Implement rich text formatting
  }

  onTextFormatChange(format: string): void {
    this.textFormat.set(format);
  }

  onTextSizeChange(size: string): void {
    this.textSize.set(size);
  }

  // Product selection
  toggleProductSelection(productId: number): void {
    const current = this.selectedProductIds();
    const newSet = new Set(current);
    if (newSet.has(productId)) {
      newSet.delete(productId);
    } else {
      newSet.add(productId);
    }
    this.selectedProductIds.set(newSet);
  }

  toggleLinkSelection(linkId: number): void {
    const type = this.activeRelationType();
    if (!type) return;
    this.selectedLinkIdsByType[type].update(ids => {
      const s = new Set(ids);
      if (s.has(linkId)) s.delete(linkId); else s.add(linkId);
      return s;
    });
  }

  isProductSelected(productId: number): boolean {
    return this.selectedProductIds().has(productId);
  }

  toggleAllProducts(): void {
    const products = this.filteredAvailableProducts();
    const selected = this.selectedProductIds();
    if (selected.size === products.length) {
      this.selectedProductIds.set(new Set());
    } else {
      this.selectedProductIds.set(new Set(products.map(p => p.id)));
    }
  }

  isAllProductsSelected(): boolean {
    const products = this.filteredAvailableProducts();
    return products.length > 0 && this.selectedProductIds().size === products.length;
  }

  // Header dropdown methods
  toggleHeaderDropdown(event: Event): void {
    event.stopPropagation();
    this.isHeaderDropdownOpen.set(!this.isHeaderDropdownOpen());
    this.isRelatedHeaderDropdownOpen.set(false);
  }

  toggleRelatedHeaderDropdown(event: Event): void {
    event.stopPropagation();
    this.isRelatedHeaderDropdownOpen.set(!this.isRelatedHeaderDropdownOpen());
    this.isHeaderDropdownOpen.set(false);
  }

  selectAllProducts(): void {
    const products = this.filteredAvailableProducts();
    this.selectedProductIds.set(new Set(products.map(p => p.id)));
    this.isHeaderDropdownOpen.set(false);
  }

  selectNoneProducts(): void {
    this.selectedProductIds.set(new Set());
    this.isHeaderDropdownOpen.set(false);
  }

  selectAllLinks(): void {
    const type = this.activeRelationType();
    if (type) this.selectedLinkIdsByType[type].set(new Set(this.activeLinks().map(l => l.id)));
    this.isRelatedHeaderDropdownOpen.set(false);
  }

  selectNoneLinks(): void {
    const type = this.activeRelationType();
    if (type) this.selectedLinkIdsByType[type].set(new Set());
    this.isRelatedHeaderDropdownOpen.set(false);
  }

  // Document header dropdown methods
  toggleDocHeaderDropdown(event: Event): void {
    event.stopPropagation();
    this.isDocHeaderDropdownOpen.set(!this.isDocHeaderDropdownOpen());
    this.isHeaderDropdownOpen.set(false);
    this.isRelatedHeaderDropdownOpen.set(false);
  }

  selectAllDocuments(): void {
    const docs = this.productDocuments();
    this.selectedDocumentIds.set(new Set(docs.map(d => d.id)));
    this.isDocHeaderDropdownOpen.set(false);
  }

  selectNoneDocuments(): void {
    this.selectedDocumentIds.set(new Set());
    this.isDocHeaderDropdownOpen.set(false);
  }

  // Document row actions
  toggleDocAction(event: Event, docId: number): void {
    event.stopPropagation();
    if (this.activeDocActionId() === docId) {
      this.activeDocActionId.set(null);
    } else {
      this.activeDocActionId.set(docId);
    }
  }

  toggleDocActionById(docId: number): void {
    this.activeDocActionId.set(this.activeDocActionId() === docId ? null : docId);
  }

  closeDocAction(): void {
    this.activeDocActionId.set(null);
  }

  onDocActionClick(event: ActionClickEvent): void {
    const row = event.row as ProductDocument;
    switch (event.actionId) {
      case 'rename': this.renameDocument(row.id); break;
      case 'download': this.downloadDocument(row.id); break;
      case 'delete': this.deleteDocument(row.id); break;
    }
  }

  renameDocument(docId: number): void {
    const doc = this.productDocuments().find(d => d.id === docId);
    if (doc) {
      const { name, ext } = this.splitFilename(doc.name);
      this.renameItemId.set(docId);
      this.renameItemType.set('document');
      this.renameValue.set(name);
      this.renameExtension.set(ext);
      this.isRenameModalOpen.set(true);
    }
    this.activeDocActionId.set(null);
  }

  downloadDocument(docId: number): void {
    this.mediaService.getMediaItem(String(docId))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (media) => {
          if (media.filePath) {
            const url = media.filePath;
            this.triggerDownload(url, media.filename || 'document');
          }
        },
        error: (err) => this.logger.error('Error downloading document:', err)
      });
    this.activeDocActionId.set(null);
  }

  deleteDocument(docId: number): void {
    this.mediaService.deleteMediaItem(String(docId))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.productDocuments.update(docs => docs.filter(d => d.id !== docId));
          this.updateProductMedia();
          this.cdr.markForCheck();
        },
        error: (err) => this.logger.error('Error deleting document:', err)
      });
    this.activeDocActionId.set(null);
  }

  deleteSelectedDocuments(): void {
    const selectedIds = this.selectedDocumentIds();
    if (selectedIds.size === 0) return;

    selectedIds.forEach(docId => {
      this.mediaService.deleteMediaItem(String(docId))
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          error: (err) => this.logger.error('Error deleting document:', err)
        });
    });
    this.productDocuments.update(docs => docs.filter(d => !selectedIds.has(d.id)));
    this.selectedDocumentIds.set(new Set());
    this.updateProductMedia();
    this.cdr.markForCheck();
  }

  // Alternative / replacement parts — add actions always target the ACTIVE tab's relation type
  addSelectedProducts(): void {
    const selected = this.selectedProductIds();
    this.addLinks(this.filteredAvailableProducts().filter(p => selected.has(p.id)));
    this.selectedProductIds.set(new Set());
  }

  addProduct(product: RelatedProduct): void {
    this.addLinks([product]);
  }

  private addLinks(products: RelatedProduct[]): void {
    const relationType = this.activeRelationType();
    const parentProductId = this.product().id;
    if (!relationType || !parentProductId) return;

    const linked = this.linkedChildProductIds();
    const links = this.linksByType[relationType];
    // ord is display-only: append after the highest ord of this type.
    const nextOrd = links().reduce((max, l) => Math.max(max, l.sortOrder), 0) + 1;

    products.filter(p => !linked.has(p.id)).forEach((product, i) => {
      this.productProductLinkService.createLink({
        parentProductId,
        childProductId: product.id,
        relationType,
        ord: nextOrd + i
      }).pipe(takeUntil(this.destroy$)).subscribe({
        next: (link) => {
          links.update(rows => [...rows, this.toLinkedProduct(link, product)]);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.logger.error('Error adding product link:', err);
          this.toastService.error(`Could not add ${product.name || product.code}: ${this.errorDetail(err)}`);
        }
      });
    });
  }

  removeLink(link: LinkedProduct): void {
    this.removeLinks([link.id], link.relationType);
  }

  removeSelectedLinks(): void {
    const type = this.activeRelationType();
    if (!type) return;
    this.removeLinks([...this.selectedLinkIdsByType[type]()], type);
  }

  private removeLinks(linkIds: number[], relationType: ProductLinkRelationType): void {
    const links = this.linksByType[relationType];
    const selected = this.selectedLinkIdsByType[relationType];
    linkIds.forEach(linkId => {
      this.productProductLinkService.deleteLink(String(linkId))
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            links.update(rows => rows.filter(r => r.id !== linkId));
            selected.update(ids => { const s = new Set(ids); s.delete(linkId); return s; });
            this.cdr.markForCheck();
          },
          error: (err) => {
            this.logger.error('Error removing product link:', err);
            this.toastService.error(`Could not remove link: ${this.errorDetail(err)}`);
          }
        });
    });
  }

  private errorDetail(error: any): string {
    return error?.error?.detail || error?.error?.message || error?.message || 'Unknown error';
  }

  // Sort
  onSort(event: SortEvent): void {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
  }

  // Pagination
  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadAvailableProducts();
  }

  // Search
  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
    this.loadAvailableProducts();
  }

  // Save actions
  onSave(): void {
    this.saveProduct(false);
  }

  onSaveAndContinue(): void {
    this.saveProduct(true);
  }

  private saveProduct(navigateToList: boolean): void {
    this.markAllTouched();
    if (!this.isValid()) {
      this.logger.warn('[ProductSave] Validation failed:', this.errors());
      this.toastService.error('Please fix validation errors before saving');
      this.cdr.markForCheck();
      return;
    }
    // Double-submit guard: block while a save is in flight AND for a short cooldown
    // afterwards, so a rapid second click can't fire a second save once the (fast)
    // first request has already returned and re-enabled the button.
    if (this.isSaving() || (Date.now() - this.lastSaveAt) < 1200) return;
    this.lastSaveAt = Date.now();

    const product = this.product();
    const mediaIriPrefix = `${environment.apiPath}/media_items/`;
    const primaryId = this.primaryImageId();

    const data: Record<string, unknown> = {
      name: product.name,
      partNo: product.code,
      slug: product.url || undefined,
      isActive: product.active,
      qty: product.quantity ?? null,
      qtyStep: product.quantityStep ?? null,
      quoteItemLimit: product.quoteItemLimit ?? null,
      fixedQty: product.fixedQuantity ?? null,
      weight: product.weight || null,
      productGroupId: product.productGroup ? parseInt(product.productGroup, 10) : null,
      productType: product.productType || null,
      catalogCode: product.catalogCode || null,
      price: product.basePrice ?? 0,
      currency: product.currency || null,
      shortDescription: product.shortDescription || null,
      imageGallery: this.galleryImages().map(img => mediaIriPrefix + img.id),
      documents: this.productDocuments().map(doc => mediaIriPrefix + doc.id),
      featuredImage: primaryId ? mediaIriPrefix + primaryId : null
    };

    const isCreating = !this.isEditMode() || !product.id;
    this.logger.debug('[ProductSave]', isCreating ? 'Creating' : `Updating id=${product.id}`, data);

    const operation = isCreating
      ? this.productService.createProduct(data)
      : this.productService.updateProduct(String(product.id), data);

    this.isSaving.set(true);
    operation.pipe(finalize(() => { this.isSaving.set(false); this.cdr.markForCheck(); })).subscribe({
      next: (result) => {
        this.toastService.success('Saved successfully');
        if (navigateToList) {
          this.router.navigate(['/admin/products/list']);
        } else if (isCreating && result?.id) {
          this.router.navigate(['/admin/products', result.id, 'edit']);
        } else if (!isCreating && product.id) {
          this.loadProduct(String(product.id));
        }
      },
      error: (error) => {
        this.logger.error('[ProductSave] Error:', error);
        this.toastService.error(`Failed to save: ${this.errorDetail(error)}`);
      }
    });
  }

  // Product category handlers
  onProductGroupChange(value: string | number): void {
    this.productGroupValue = String(value);
    this.product.update(p => ({ ...p, productGroup: String(value) }));
  }

  clearProductGroup(): void {
    this.productGroupValue = '';
    this.product.update(p => ({ ...p, productGroup: '' }));
  }

  // Product type handlers
  onProductTypeChange(value: string | number): void {
    this.productTypeValue = String(value);
    this.product.update(p => ({ ...p, productType: String(value) }));
  }

  clearProductType(): void {
    this.productTypeValue = '';
    this.product.update(p => ({ ...p, productType: '' }));
  }

  // Helpers
  getStatusBadgeVariant(status: string): 'success' | 'danger' | 'warning' | 'info' | 'default' {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'danger';
      default: return 'default';
    }
  }

  // Media persistence - link media items to product via IRI references
  private updateProductMedia(): void {
    const productId = this.product().id;
    if (!productId) return;

    const mediaIriPrefix = `${environment.apiPath}/media_items/`;
    const imageGallery = this.galleryImages().map(img => mediaIriPrefix + img.id);
    const documents = this.productDocuments().map(doc => mediaIriPrefix + doc.id);

    const data: Record<string, unknown> = { imageGallery, documents };
    const primaryId = this.primaryImageId();
    if (primaryId) {
      data['featuredImage'] = mediaIriPrefix + primaryId;
    } else {
      data['featuredImage'] = null;
    }

    this.productService.updateProduct(String(productId), data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => this.logger.error('Error updating product media:', err)
      });
  }

  // Gallery methods
  trackByImageId(_index: number, image: GalleryImage): number {
    return image.id;
  }

  toggleImageDropdown(imageId: number, event: Event): void {
    event.stopPropagation();
    if (this.activeImageDropdown() === imageId) {
      this.activeImageDropdown.set(null);
    } else {
      this.activeImageDropdown.set(imageId);
    }
  }

  closeImageDropdown(): void {
    this.activeImageDropdown.set(null);
  }

  // Editor methods
  onEditorInput(content: string): void {
    this.editorContent.set(content || '');
    this.product.update(p => ({ ...p, shortDescription: content }));
  }

  makeImagePrimary(imageId: number): void {
    this.primaryImageId.set(imageId);
    this.galleryImages.update(images =>
      images.map(img => ({ ...img, isPrimary: img.id === imageId }))
    );
    this.activeImageDropdown.set(null);
    this.updateProductMedia();
  }

  renameImage(imageId: number): void {
    const image = this.galleryImages().find(img => img.id === imageId);
    if (image) {
      const { name, ext } = this.splitFilename(image.name);
      this.renameItemId.set(imageId);
      this.renameItemType.set('image');
      this.renameValue.set(name);
      this.renameExtension.set(ext);
      this.isRenameModalOpen.set(true);
    }
    this.activeImageDropdown.set(null);
  }

  downloadImage(imageId: number): void {
    const image = this.galleryImages().find(img => img.id === imageId);
    if (image?.url) {
      this.triggerDownload(image.url, image.name);
    }
    this.activeImageDropdown.set(null);
  }

  private triggerDownload(url: string, filename: string): void {
    this.mediaService.downloadFile(url)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
        },
        error: (err) => this.logger.error('Error downloading file:', err)
      });
  }

  deleteImage(imageId: number): void {
    // If deleting the primary image, clear it
    if (this.primaryImageId() === imageId) {
      this.primaryImageId.set(null);
    }
    this.mediaService.deleteMediaItem(String(imageId))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.galleryImages.update(images => images.filter(img => img.id !== imageId));
          this.updateProductMedia();
          this.cdr.markForCheck();
        },
        error: (err) => this.logger.error('Error deleting image:', err)
      });
    this.activeImageDropdown.set(null);
  }

  // Gallery upload — shared by the dropzone (filesSelected) and the drop-anywhere grid area.
  uploadImages(files: File[]): void {
    if (!this.product().id) {
      this.toastService.warning('Save the product first to upload images');
      return;
    }
    if (this.uploadProgress()) {
      this.toastService.warning('An upload is still running — please wait for it to finish');
      return;
    }
    const valid = this.validateImageFiles(files);
    if (valid.length === 0) return;

    const totalBytes = valid.reduce((sum, f) => sum + f.size, 0);
    const loadedBytes = new Map<File, number>();
    const updatePercent = () => {
      const loaded = [...loadedBytes.values()].reduce((sum, n) => sum + n, 0);
      const percent = totalBytes ? Math.round((loaded / totalBytes) * 100) : 100;
      this.uploadProgress.update(p => p && { ...p, percent });
      this.cdr.markForCheck();
    };
    let uploadedAny = false;
    this.uploadProgress.set({ done: 0, total: valid.length, percent: 0 });

    from(valid).pipe(
      mergeMap(file => this.uploadImage(file, loaded => { loadedBytes.set(file, loaded); updatePercent(); }), MAX_CONCURRENT_UPLOADS),
      takeUntil(this.destroy$),
      finalize(() => {
        this.uploadProgress.set(null);
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: ({ file, media }) => {
        if (media) {
          uploadedAny = true;
          this.galleryImages.update(images => [...images, {
            id: media.id,
            name: media.filename || file.name,
            url: media.filePath ? `${environment.apiBaseUrl}${media.filePath}` : '',
            isPrimary: false
          }]);
        }
        loadedBytes.set(file, file.size);
        this.uploadProgress.update(p => p && { ...p, done: p.done + 1 });
        updatePercent();
      },
      complete: () => {
        if (uploadedAny) this.updateProductMedia();
      }
    });
  }

  /** Uploads one file; resolves with media=null on failure (after a toast) so the batch keeps going. */
  private uploadImage(file: File, onProgress: (loaded: number) => void): Observable<{ file: File; media: MediaItem | null }> {
    return this.mediaService.uploadFile(file).pipe(
      tap(event => {
        if (event.type === HttpEventType.UploadProgress) onProgress(event.loaded);
      }),
      filter((event): event is HttpResponse<MediaItem> => event.type === HttpEventType.Response),
      map(event => ({ file, media: event.body })),
      catchError(err => {
        this.logger.error('Error uploading image:', err);
        this.toastService.error(`Failed to upload ${file.name}: ${this.errorDetail(err)}`);
        return of({ file, media: null });
      })
    );
  }

  /** Client-side mirror of the backend limits: per-file toast for wrong type / over 5 MB, the rest is uploaded. */
  private validateImageFiles(files: File[]): File[] {
    return files.filter(file => {
      if (!IMAGE_MIME_TYPES.includes(file.type)) {
        this.toastService.error(`${file.name}: unsupported file type${file.type ? ` (${file.type})` : ''}. Allowed: JPEG, PNG, GIF, WebP`);
        return false;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        this.toastService.error(`${file.name}: ${(file.size / 1024 / 1024).toFixed(1)} MB exceeds the ${MAX_IMAGE_SIZE / 1024 / 1024} MB limit`);
        return false;
      }
      return true;
    });
  }

  /** Files the dropzone itself refused (over its size cap, or beyond maxFiles in one selection). */
  onImagesRejected(rejected: RejectedFile[]): void {
    const skipped = rejected.filter(r => r.reason === 'count').length;
    if (skipped > 0) {
      this.toastService.error(`Only ${MAX_IMAGES_PER_UPLOAD} images can be uploaded at once — ${skipped} file${skipped === 1 ? ' was' : 's were'} skipped`);
    }
    this.validateImageFiles(rejected.filter(r => r.reason === 'size').map(r => r.file));
  }

  // Drop-anywhere on the gallery grid. Non-file drags (text, links) are ignored so they keep default behaviour.
  private static hasFiles(event: DragEvent): boolean {
    return Array.from(event.dataTransfer?.types ?? []).includes('Files');
  }

  onGalleryDragOver(event: DragEvent): void {
    if (!ProductsEditComponent.hasFiles(event)) return;
    event.preventDefault(); // required for the drop event to fire
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    this.isDraggingOverGallery.set(!!this.product().id);
  }

  onGalleryDragLeave(event: DragEvent): void {
    // dragleave also fires when moving between child elements — only clear when really leaving the area
    const related = event.relatedTarget as Node | null;
    if (related && (event.currentTarget as HTMLElement).contains(related)) return;
    this.isDraggingOverGallery.set(false);
  }

  onGalleryDrop(event: DragEvent): void {
    this.isDraggingOverGallery.set(false);
    if (!ProductsEditComponent.hasFiles(event)) return;
    event.preventDefault();
    const files = Array.from(event.dataTransfer?.files ?? []);
    if (files.length > 0) this.uploadImages(files);
  }

  async downloadAllImages(): Promise<void> {
    const images = this.galleryImages().filter(img => img.url);
    if (images.length === 0) return;

    // Load jszip lazily: it is only needed for this rarely-used ZIP download,
    // so keep it out of the main bundle.
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();
    let fetched = 0;

    images.forEach(image => {
      this.mediaService.downloadFile(image.url)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (blob) => {
            zip.file(image.name || `image-${image.id}`, blob);
            fetched++;
            if (fetched === images.length) {
              zip.generateAsync({ type: 'blob' }).then(zipBlob => {
                const blobUrl = URL.createObjectURL(zipBlob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = 'gallery-images.zip';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);
              });
            }
          },
          error: (err) => this.logger.error(`Error fetching image ${image.name}:`, err)
        });
    });
  }

  deleteAllImages(): void {
    const images = this.galleryImages();
    this.primaryImageId.set(null);
    images.forEach(image => {
      this.mediaService.deleteMediaItem(String(image.id))
        .pipe(takeUntil(this.destroy$))
        .subscribe({ error: (err) => this.logger.error('Error deleting image:', err) });
    });
    this.galleryImages.set([]);
    this.updateProductMedia();
  }

  // Document methods
  toggleDocumentSelection(docId: number): void {
    const current = this.selectedDocumentIds();
    const newSet = new Set(current);
    if (newSet.has(docId)) {
      newSet.delete(docId);
    } else {
      newSet.add(docId);
    }
    this.selectedDocumentIds.set(newSet);
  }

  isDocumentSelected(docId: number): boolean {
    return this.selectedDocumentIds().has(docId);
  }

  toggleAllDocuments(): void {
    const docs = this.productDocuments();
    const selected = this.selectedDocumentIds();
    if (selected.size === docs.length) {
      this.selectedDocumentIds.set(new Set());
    } else {
      this.selectedDocumentIds.set(new Set(docs.map(d => d.id)));
    }
  }

  isAllDocumentsSelected(): boolean {
    const docs = this.productDocuments();
    return docs.length > 0 && this.selectedDocumentIds().size === docs.length;
  }

  addDocument(): void {
    this.documentFileInput?.nativeElement?.click();
  }

  onDocumentFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const productId = this.product().id;
    if (!productId) return;

    const files = Array.from(input.files);
    let uploaded = 0;

    files.forEach(file => {
      this.mediaService.uploadFile(file)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (httpEvent) => {
            if (httpEvent.type === HttpEventType.Response && httpEvent.body) {
              const media = httpEvent.body;
              this.productDocuments.update(docs => [...docs, {
                id: media.id,
                fileType: (media.mimeType || '').split('/').pop()?.toUpperCase() || 'FILE',
                name: media.filename || file.name,
                size: '-'
              }]);
              uploaded++;
              if (uploaded === files.length) {
                this.updateProductMedia();
              }
              this.cdr.markForCheck();
            }
          },
          error: (err) => this.logger.error('Error uploading document:', err)
        });
    });

    input.value = '';
  }

  // Rename modal methods
  onRenameInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.renameValue.set(target.value);
  }

  cancelRename(): void {
    this.isRenameModalOpen.set(false);
    this.renameItemId.set(null);
    this.renameItemType.set(null);
    this.renameValue.set('');
    this.renameExtension.set('');
  }

  confirmRename(): void {
    const itemId = this.renameItemId();
    const itemType = this.renameItemType();
    const baseName = this.renameValue();
    const ext = this.renameExtension();

    if (!itemId || !baseName) return;

    const fullName = ext ? `${baseName}.${ext}` : baseName;

    // Update local state
    if (itemType === 'image') {
      this.galleryImages.update(images =>
        images.map(img => img.id === itemId ? { ...img, name: fullName } : img)
      );
    } else if (itemType === 'document') {
      this.productDocuments.update(docs =>
        docs.map(doc => doc.id === itemId ? { ...doc, name: fullName } : doc)
      );
    }

    // Persist to API
    this.mediaService.updateMediaItem(String(itemId), { filename: fullName } as any)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => this.logger.error('Error renaming media item:', err)
      });

    this.cancelRename();
  }

  private splitFilename(filename: string): { name: string; ext: string } {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot <= 0) return { name: filename, ext: '' };
    return { name: filename.substring(0, lastDot), ext: filename.substring(lastDot + 1) };
  }
}

