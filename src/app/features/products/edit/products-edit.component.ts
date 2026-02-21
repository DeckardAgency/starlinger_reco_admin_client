import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed, ViewChild, TemplateRef, ElementRef, AfterViewInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { HttpClient, HttpEventType } from '@angular/common/http';

import { BreadcrumbsComponent, BreadcrumbItem } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { BadgeComponent } from '@app/ui-kit/atoms/badge/badge.component';
import { ToggleComponent } from '@app/ui-kit/atoms/toggle/toggle.component';
import { FormFieldComponent } from '@app/ui-kit/molecules/form-field/form-field.component';
import { SelectComponent, SelectOption } from '@app/ui-kit/atoms/select/select.component';
import { TabsComponent, TabItem } from '@app/ui-kit/molecules/tabs/tabs.component';
import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms/data-table/data-table.component';
import { PaginationComponent } from '@app/ui-kit/molecules/pagination/pagination.component';
import { ModalComponent } from '@app/ui-kit/organisms/modal/modal.component';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { TableFooterComponent } from '@app/ui-kit/molecules/table-footer/table-footer.component';
import { TextEditorComponent } from '@shared/components/text-editor/text-editor.component';
import { TableActionsDropdownComponent, TableAction, ActionClickEvent } from '@app/ui-kit/molecules/table-actions-dropdown/table-actions-dropdown.component';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';
import { ProductService } from '@core/services/http/product.service';
import { ProductGroupService } from '@core/services/http/product-group.service';
import { TaxTypeService } from '@core/services/http/tax-type.service';
import { ProductDiscountService } from '@core/services/http/product-discount.service';
import { ProductProductLinkService } from '@core/services/http/product-product-link.service';
import { Product, MediaItem } from '@core/models';
import { MediaService } from '@core/services/http/media.service';
import { environment } from '@env/environment';
import JSZip from 'jszip';
import { ToastService } from '@app/ui-kit/organisms/toast-container/toast-container.component';

interface ProductDetail {
  id: number;
  code: string;
  name: string;
  active: boolean;
  readyForShop: boolean;
  url: string;
  quantity: number;
  quantityStep: number;
  quoteItemLimit: number;
  fixedQuantity: number;
  weight: string;
  productGroup: string;
  catalogCode: string;
  basePrice: number;
  retailPrice: number;
  taxPercent: string;
  currency: string;
  discountPercent: number;
  discountPrice: number;
  shortDescription: string;
}

interface RelatedProduct {
  id: number;
  productId: string;
  code: string;
  name: string;
  status: 'active' | 'inactive';
  available: boolean;
  sortOrder?: number;
}

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

interface AppliedDiscount {
  id: string;
  dateValidFrom: string;
  dateValidTo: string;
  discountPriceBase: string;
  discountPercent: string;
  appliedTo: string;
}


const EMPTY_PRODUCT: ProductDetail = {
  id: 0,
  code: '',
  name: '',
  active: false,
  readyForShop: false,
  url: '',
  quantity: 0,
  quantityStep: 1,
  quoteItemLimit: 0,
  fixedQuantity: 0,
  weight: '',
  productGroup: '',
  catalogCode: '',
  basePrice: 0,
  retailPrice: 0,
  taxPercent: '',
  currency: '',
  discountPercent: 0,
  discountPrice: 0,
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
    PaginationComponent,
    ModalComponent,
    IconComponent,
    TableFooterComponent,
    TextEditorComponent,
    MobileFooterComponent,
    TableActionsDropdownComponent
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

  // Product documents
  productDocuments = signal<ProductDocument[]>([]);
  selectedDocumentIds = signal<Set<number>>(new Set());

  // Applied discounts
  appliedDiscounts = signal<AppliedDiscount[]>([]);

  // Related products
  availableProducts = signal<RelatedProduct[]>([]);
  relatedProducts = signal<RelatedProduct[]>([]);
  relatedChildProductIds = signal<Set<number>>(new Set());
  private linkToProductMap = new Map<number, number>(); // link ID -> child product ID
  filteredAvailableProducts = computed(() => {
    const related = this.relatedChildProductIds();
    const currentProductId = this.product().id;
    return this.availableProducts().filter(p => !related.has(p.id) && p.id !== currentProductId);
  });
  selectedProductIds = signal<Set<number>>(new Set());
  selectedRelatedProductIds = signal<Set<number>>(new Set());

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

  taxOptions = signal<SelectOption[]>([]);

  // Select model values
  productGroupValue = '';
  taxPercentValue = '';
  currencyValue = '';

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
    { id: 'discounts', label: 'Applied discounts' }
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
  @ViewChild('imageFileInput') imageFileInput!: ElementRef<HTMLInputElement>;
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
    private productGroupService: ProductGroupService,
    private taxTypeService: TaxTypeService,
    private productDiscountService: ProductDiscountService,
    private productProductLinkService: ProductProductLinkService,
    private mediaService: MediaService
  ) {}

  ngOnInit(): void {
    this.loadProductGroups();
    this.loadTaxTypes();

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

  private loadProductGroups(): void {
    this.productGroupService.getProductGroups(1, 100)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const options = response.member
            .filter(pg => pg.isActive !== false)
            .map(pg => ({ value: pg.id, label: pg.name }));
          this.productGroupOptions.set(options);
          this.cdr.markForCheck();
        },
        error: (err) => console.error('Error loading product groups:', err)
      });
  }

  private loadTaxTypes(): void {
    this.taxTypeService.getTaxTypes(1, 100)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const options = response.member
            .filter((tt: any) => tt.isActive !== false)
            .map(tt => {
              const pct = parseFloat(String(tt.percent));
              const pctLabel = Number.isInteger(pct) ? pct.toString() : pct.toFixed(2).replace(/\.?0+$/, '');
              return { value: tt.id, label: `${tt.name} (${pctLabel}%)` };
            });
          this.taxOptions.set(options);
          this.cdr.markForCheck();
        },
        error: (err) => console.error('Error loading tax types:', err)
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
      { key: 'actions', label: '', width: '131px', template: this.actionsTemplate }
    ];

    this.relatedProductColumns = [
      { key: 'checkbox', label: '', width: '56px', headerTemplate: this.relatedCheckboxHeaderTemplate, template: this.relatedCheckboxTemplate },
      { key: 'productId', label: 'Product ID', width: '112px' },
      { key: 'code', label: 'Code', width: '128px' },
      { key: 'name', label: 'Related product', sortable: true },
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
        this.taxPercentValue = productData.taxPercent;
        this.currencyValue = productData.currency;

        // Track featured image
        const featuredId = (apiProduct as any).featuredImage?.id || null;
        this.primaryImageId.set(featuredId);

        // Load gallery images from product response
        this.galleryImages.set(
          (apiProduct.imageGallery || []).map((m: MediaItem) => ({
            id: m.id,
            name: m.filename || '',
            url: m.filePath || '',
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

        // Load applied discounts and related products
        this.loadAppliedDiscounts(id);
        this.loadRelatedProducts(id);

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
      readyForShop: p.readyForShop ?? false,
      url: p.slug ?? '',
      quantity: p.qty ?? 0,
      quantityStep: p.qtyStep ?? 1,
      quoteItemLimit: p.quoteItemLimit ?? 0,
      fixedQuantity: p.fixedQty ?? 0,
      weight: p.weight ?? '',
      productGroup: String(p.productGroupId ?? ''),
      catalogCode: p.catalogCode ?? '',
      basePrice: p.price ?? 0,
      retailPrice: p.retailPrice ?? 0,
      taxPercent: String(p.taxTypeId ?? ''),
      currency: p.currency ?? 'EUR',
      discountPercent: p.discountPercent ?? 0,
      discountPrice: p.discountPrice ?? 0,
      shortDescription: p.shortDescription ?? ''
    };
  }

  private loadAvailableProducts(): void {
    const query = this.searchQuery();
    const obs = query
      ? this.productService.searchProducts(query)
      : this.productService.getProducts(this.currentPage(), this.itemsPerPage);

    obs.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const products = (response.member || []).map(p => ({
            id: p.id,
            productId: p.partNo || String(p.id),
            code: p.partNo || '',
            name: p.name || '',
            status: (p.isActive ? 'active' : 'inactive') as 'active' | 'inactive',
            available: p.isActive ?? true
          }));
          this.availableProducts.set(products);
          this.totalItems.set(response.totalItems || 0);
          this.cdr.markForCheck();
        },
        error: (err) => console.error('Error loading available products:', err)
      });
  }

  private loadRelatedProducts(productId: string): void {
    this.productProductLinkService.getByParentProductId(productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const links = response.member || [];
          if (links.length === 0) {
            this.relatedProducts.set([]);
            this.relatedChildProductIds.set(new Set());
            this.cdr.markForCheck();
            return;
          }
          // Track all child product UUIDs for filtering
          const childIds = new Set(links.map(l => l.childProductId));
          this.relatedChildProductIds.set(childIds);
          this.linkToProductMap.clear();
          links.forEach(l => this.linkToProductMap.set(l.id, l.childProductId));
          // For each link, fetch the child product details
          const related: RelatedProduct[] = [];
          let loaded = 0;
          links.forEach(link => {
            this.productService.getProductById(String(link.childProductId))
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (p) => {
                  related.push({
                    id: link.id,
                    productId: p.partNo || String(p.id),
                    code: p.partNo || '',
                    name: p.name || '',
                    status: (p.isActive ? 'active' : 'inactive') as 'active' | 'inactive',
                    available: p.isActive ?? true,
                    sortOrder: link.ord ?? 0
                  });
                  loaded++;
                  if (loaded === links.length) {
                    this.relatedProducts.set(related.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
                    this.cdr.markForCheck();
                  }
                },
                error: () => {
                  related.push({
                    id: link.id,
                    productId: String(link.childProductId),
                    code: '-',
                    name: 'Unknown product',
                    status: 'inactive',
                    available: false,
                    sortOrder: link.ord ?? 0
                  });
                  loaded++;
                  if (loaded === links.length) {
                    this.relatedProducts.set(related.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
                    this.cdr.markForCheck();
                  }
                }
              });
          });
        },
        error: (err) => console.error('Error loading related products:', err)
      });
  }

  private loadAppliedDiscounts(productId: string): void {
    this.productDiscountService.getByProductId(productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const discounts = (response.member || []).map(d => ({
            id: String(d.id),
            dateValidFrom: d.dateValidFrom ? new Date(d.dateValidFrom).toLocaleString() : '-',
            dateValidTo: d.dateValidTo ? new Date(d.dateValidTo).toLocaleString() : '-',
            discountPriceBase: d.discountPriceBase ? `\u20AC ${d.discountPriceBase}` : '-',
            discountPercent: d.rebate ?? '-',
            appliedTo: d.appliedTo || '-'
          }));
          this.appliedDiscounts.set(discounts);
          this.cdr.markForCheck();
        },
        error: (err) => console.error('Error loading applied discounts:', err)
      });
  }

  private resetForm(): void {
    this.product.set({ ...EMPTY_PRODUCT });
    this.editorContent.set('');
    this.selectedProductIds.set(new Set());
    this.productGroupValue = '';
    this.taxPercentValue = '';
    this.currencyValue = '';
  }

  // Navigation
  goBack(): void {
    this.router.navigate(['/admin/products/list']);
  }

  // Toggle handlers
  onActiveChange(value: boolean): void {
    this.product.update(p => ({ ...p, active: value }));
  }

  onReadyForShopChange(value: boolean): void {
    this.product.update(p => ({ ...p, readyForShop: value }));
  }

  // Field update handlers
  updateProduct(field: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.product.update(p => ({ ...p, [field]: value }));
  }

  updateProductNumber(field: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.product.update(p => ({ ...p, [field]: value ? parseFloat(value) : 0 }));
  }

  // Tax type handlers
  onTaxTypeChange(value: string | number): void {
    this.taxPercentValue = String(value);
    this.product.update(p => ({ ...p, taxPercent: String(value) }));
  }

  clearTaxType(): void {
    this.taxPercentValue = '';
    this.product.update(p => ({ ...p, taxPercent: '' }));
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
    console.log('Format:', format);
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

  toggleRelatedProductSelection(productId: number): void {
    const current = this.selectedRelatedProductIds();
    const newSet = new Set(current);
    if (newSet.has(productId)) {
      newSet.delete(productId);
    } else {
      newSet.add(productId);
    }
    this.selectedRelatedProductIds.set(newSet);
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

  selectAllRelatedProducts(): void {
    const products = this.relatedProducts();
    this.selectedRelatedProductIds.set(new Set(products.map(p => p.id)));
    this.isRelatedHeaderDropdownOpen.set(false);
  }

  selectNoneRelatedProducts(): void {
    this.selectedRelatedProductIds.set(new Set());
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
        error: (err) => console.error('Error downloading document:', err)
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
        error: (err) => console.error('Error deleting document:', err)
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
          error: (err) => console.error('Error deleting document:', err)
        });
    });
    this.productDocuments.update(docs => docs.filter(d => !selectedIds.has(d.id)));
    this.selectedDocumentIds.set(new Set());
    this.updateProductMedia();
    this.cdr.markForCheck();
  }

  // Related products actions
  addSelectedProducts(): void {
    const selected = this.selectedProductIds();
    const available = this.filteredAvailableProducts();
    const related = this.relatedProducts();
    const productId = this.product().id;
    if (!productId) return;

    const toAdd = available.filter(p => selected.has(p.id));

    toAdd.forEach((p, i) => {
      const childProductId = p.id;
      this.productProductLinkService.createLink({
        parentProductId: productId,
        childProductId,
        ord: related.length + i + 1
      }).pipe(takeUntil(this.destroy$)).subscribe({
        next: (link) => {
          this.relatedProducts.update(current => [
            ...current,
            { ...p, id: link.id, sortOrder: link.ord ?? current.length + 1 }
          ]);
          this.relatedChildProductIds.update(ids => { const s = new Set(ids); s.add(childProductId); return s; });
          this.linkToProductMap.set(link.id, childProductId);
          this.cdr.markForCheck();
        },
        error: (err) => console.error('Error adding related product:', err)
      });
    });

    this.selectedProductIds.set(new Set());
  }

  addProduct(product: RelatedProduct): void {
    const related = this.relatedProducts();
    const productId = this.product().id;
    const childProductId = product.id;
    if (!productId || this.relatedChildProductIds().has(childProductId)) return;

    this.productProductLinkService.createLink({
      parentProductId: productId,
      childProductId,
      ord: related.length + 1
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (link) => {
        this.relatedProducts.update(current => [
          ...current,
          { ...product, id: link.id, sortOrder: link.ord ?? current.length + 1 }
        ]);
        this.relatedChildProductIds.update(ids => { const s = new Set(ids); s.add(childProductId); return s; });
        this.linkToProductMap.set(link.id, childProductId);
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error adding related product:', err)
    });
  }

  removeProduct(product: RelatedProduct): void {
    const linkId = product.id;
    this.productProductLinkService.deleteLink(String(linkId))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const childId = this.linkToProductMap.get(linkId);
          this.relatedProducts.update(products => products.filter(p => p.id !== linkId));
          if (childId) {
            this.relatedChildProductIds.update(ids => { const s = new Set(ids); s.delete(childId); return s; });
            this.linkToProductMap.delete(linkId);
          }
          this.cdr.markForCheck();
        },
        error: (err) => console.error('Error removing related product:', err)
      });
  }

  removeSelectedRelatedProducts(): void {
    const selectedIds = this.selectedRelatedProductIds();
    selectedIds.forEach(linkId => {
      this.productProductLinkService.deleteLink(String(linkId))
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            const childId = this.linkToProductMap.get(linkId);
            this.relatedProducts.update(products => products.filter(p => p.id !== linkId));
            if (childId) {
              this.relatedChildProductIds.update(ids => { const s = new Set(ids); s.delete(childId); return s; });
              this.linkToProductMap.delete(linkId);
            }
            this.cdr.markForCheck();
          },
          error: (err) => console.error('Error removing related product:', err)
        });
    });
    this.selectedRelatedProductIds.set(new Set());
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
      this.cdr.markForCheck();
      return;
    }

    const product = this.product();
    const mediaIriPrefix = `${environment.apiPath}/media_items/`;
    const primaryId = this.primaryImageId();

    const data: Record<string, unknown> = {
      name: product.name,
      partNo: product.code,
      slug: product.url || undefined,
      isActive: product.active,
      readyForShop: product.readyForShop,
      qty: product.quantity || null,
      qtyStep: product.quantityStep || null,
      quoteItemLimit: product.quoteItemLimit || null,
      fixedQty: product.fixedQuantity || null,
      weight: product.weight || null,
      productGroupId: product.productGroup || null,
      catalogCode: product.catalogCode || null,
      price: product.basePrice,
      retailPrice: product.retailPrice || null,
      taxTypeId: product.taxPercent || null,
      currency: product.currency || null,
      discountPercent: product.discountPercent || null,
      discountPrice: product.discountPrice || null,
      shortDescription: product.shortDescription || null,
      imageGallery: this.galleryImages().map(img => mediaIriPrefix + img.id),
      documents: this.productDocuments().map(doc => mediaIriPrefix + doc.id),
      featuredImage: primaryId ? mediaIriPrefix + primaryId : null
    };

    const isCreating = !this.isEditMode() || !product.id;
    const operation = isCreating
      ? this.productService.createProduct(data)
      : this.productService.updateProduct(String(product.id), data);

    operation.subscribe({
      next: (result) => {
        this.toastService.success('Saved successfully');
        if (navigateToList) {
          this.router.navigate(['/admin/products/list']);
        } else if (isCreating && result?.id) {
          this.router.navigate(['/admin/products', result.id, 'edit']);
        } else if (!isCreating && product.id) {
          // Reload product data to confirm persistence
          this.loadProduct(String(product.id));
        }
      },
      error: (error) => {
        console.error('Error saving product:', error);
        this.toastService.error('Failed to save product');
      }
    });
  }

  // Product group handlers
  onProductGroupChange(value: string | number): void {
    this.productGroupValue = String(value);
    this.product.update(p => ({ ...p, productGroup: String(value) }));
  }

  clearProductGroup(): void {
    this.productGroupValue = '';
    this.product.update(p => ({ ...p, productGroup: '' }));
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
        error: (err) => console.error('Error updating product media:', err)
      });
  }

  // Gallery methods
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
        error: (err) => console.error('Error downloading file:', err)
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
        error: (err) => console.error('Error deleting image:', err)
      });
    this.activeImageDropdown.set(null);
  }

  uploadImage(): void {
    this.imageFileInput?.nativeElement?.click();
  }

  onImageFileSelected(event: Event): void {
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
              this.galleryImages.update(images => [...images, {
                id: media.id,
                name: media.filename || file.name,
                url: media.filePath || '',
                isPrimary: false
              }]);
              uploaded++;
              if (uploaded === files.length) {
                this.updateProductMedia();
              }
              this.cdr.markForCheck();
            }
          },
          error: (err) => console.error('Error uploading image:', err)
        });
    });

    input.value = '';
  }

  downloadAllImages(): void {
    const images = this.galleryImages().filter(img => img.url);
    if (images.length === 0) return;

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
          error: (err) => console.error(`Error fetching image ${image.name}:`, err)
        });
    });
  }

  deleteAllImages(): void {
    const images = this.galleryImages();
    this.primaryImageId.set(null);
    images.forEach(image => {
      this.mediaService.deleteMediaItem(String(image.id))
        .pipe(takeUntil(this.destroy$))
        .subscribe({ error: (err) => console.error('Error deleting image:', err) });
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
          error: (err) => console.error('Error uploading document:', err)
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
        error: (err) => console.error('Error renaming media item:', err)
      });

    this.cancelRename();
  }

  private splitFilename(filename: string): { name: string; ext: string } {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot <= 0) return { name: filename, ext: '' };
    return { name: filename.substring(0, lastDot), ext: filename.substring(lastDot + 1) };
  }
}

