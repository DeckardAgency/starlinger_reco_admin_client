import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed, ViewChild, TemplateRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';
import { ProductService } from '@core/services/http/product.service';
import { Product } from '@core/models';
import {
  mockProductAvailable,
  mockProductRelated,
  mockProductGallery,
  mockProductDocuments,
  mockProductAppliedDiscounts
} from '@core/mocks/mock-data';

interface ProductDetail {
  id: string;
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
  id: string;
  productId: string;
  code: string;
  name: string;
  status: 'active' | 'inactive';
  available: boolean;
  sortOrder?: number;
}

interface GalleryImage {
  id: string;
  name: string;
  url: string;
  isPrimary?: boolean;
}

interface ProductDocument {
  id: string;
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
  id: '',
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
    MobileFooterComponent
  ],
  templateUrl: './products-edit.component.html',
  styleUrls: ['./products-edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductsEditComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();

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
  activeImageDropdown = signal<string | null>(null);

  // Product documents
  productDocuments = signal<ProductDocument[]>([]);
  selectedDocumentIds = signal<Set<string>>(new Set());

  // Applied discounts
  appliedDiscounts = signal<AppliedDiscount[]>([]);

  // Related products
  availableProducts = signal<RelatedProduct[]>([]);
  relatedProducts = signal<RelatedProduct[]>([]);
  selectedProductIds = signal<Set<string>>(new Set());
  selectedRelatedProductIds = signal<Set<string>>(new Set());

  // Search and pagination
  searchQuery = signal('');
  currentPage = signal(1);
  totalItems = signal(197);
  itemsPerPage = 13;

  // Sorting
  sortColumn = signal<string | null>(null);
  sortDirection = signal<'asc' | 'desc' | null>(null);

  // Dropdowns
  openDropdownId = signal<string | null>(null);
  isHeaderDropdownOpen = signal(false);
  isRelatedHeaderDropdownOpen = signal(false);
  isDocHeaderDropdownOpen = signal(false);
  activeDocActionId = signal<string | null>(null);

  // Rename modal
  isRenameModalOpen = signal(false);
  renameValue = signal('');
  renameItemId = signal<string | null>(null);
  renameItemType = signal<'image' | 'document' | null>(null);

  // Options
  productGroupOptions: SelectOption[] = [
    { value: 'electrical', label: 'Electrical component' },
    { value: 'mechanical', label: 'Mechanical component' },
    { value: 'hydraulic', label: 'Hydraulic component' },
    { value: 'pneumatic', label: 'Pneumatic component' }
  ];

  currencyOptions: SelectOption[] = [
    { value: 'EUR', label: 'Euro' },
    { value: 'USD', label: 'US Dollar' },
    { value: 'GBP', label: 'British Pound' }
  ];

  taxOptions: SelectOption[] = [
    { value: 'PDV20', label: 'PDV20' },
    { value: 'PDV25', label: 'PDV25' },
    { value: 'PDV0', label: 'PDV0' }
  ];

  // Select model values
  productGroupValue = '';
  taxPercentValue = '';
  currencyValue = '';

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
    private productService: ProductService
  ) {}

  ngOnInit(): void {
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
    this.loadRelatedProducts();
    this.loadGalleryImages();
    this.loadProductDocuments();
    this.loadAppliedDiscounts();
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
        this.cdr.markForCheck();
      },
      error: () => {
        this.product.set({ ...EMPTY_PRODUCT, id });
        this.cdr.markForCheck();
      }
    });
  }

  private mapApiProductToDetail(p: Product): ProductDetail {
    return {
      id: p.id,
      code: p.partNo ?? '',
      name: p.name ?? '',
      active: (p as { isActive?: boolean }).isActive ?? true,
      readyForShop: (p as { readyForShop?: boolean }).readyForShop ?? true,
      url: p.slug ?? '',
      quantity: 0,
      quantityStep: 1,
      quoteItemLimit: 0,
      fixedQuantity: 0,
      weight: p.weight ?? '',
      productGroup: '',
      catalogCode: '',
      basePrice: p.price ?? 0,
      retailPrice: p.price ?? 0,
      taxPercent: '',
      currency: 'EUR',
      discountPercent: 0,
      discountPrice: 0,
      shortDescription: p.shortDescription ?? ''
    };
  }

  private loadAvailableProducts(): void {
    // In real app this would be an API call
    this.availableProducts.set([...mockProductAvailable] as RelatedProduct[]);
  }

  private loadRelatedProducts(): void {
    // In real app this would be an API call
    this.relatedProducts.set([...mockProductRelated] as RelatedProduct[]);
  }

  private loadGalleryImages(): void {
    // In real app this would be an API call
    this.galleryImages.set([...mockProductGallery] as GalleryImage[]);
  }

  private loadProductDocuments(): void {
    // In real app this would be an API call
    this.productDocuments.set([...mockProductDocuments] as ProductDocument[]);
  }

  private loadAppliedDiscounts(): void {
    // In real app this would be an API call
    this.appliedDiscounts.set([...mockProductAppliedDiscounts] as AppliedDiscount[]);
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
  toggleProductSelection(productId: string): void {
    const current = this.selectedProductIds();
    const newSet = new Set(current);
    if (newSet.has(productId)) {
      newSet.delete(productId);
    } else {
      newSet.add(productId);
    }
    this.selectedProductIds.set(newSet);
  }

  toggleRelatedProductSelection(productId: string): void {
    const current = this.selectedRelatedProductIds();
    const newSet = new Set(current);
    if (newSet.has(productId)) {
      newSet.delete(productId);
    } else {
      newSet.add(productId);
    }
    this.selectedRelatedProductIds.set(newSet);
  }

  isProductSelected(productId: string): boolean {
    return this.selectedProductIds().has(productId);
  }

  toggleAllProducts(): void {
    const products = this.availableProducts();
    const selected = this.selectedProductIds();
    if (selected.size === products.length) {
      this.selectedProductIds.set(new Set());
    } else {
      this.selectedProductIds.set(new Set(products.map(p => p.id)));
    }
  }

  isAllProductsSelected(): boolean {
    const products = this.availableProducts();
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
    const products = this.availableProducts();
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
  toggleDocAction(event: Event, docId: string): void {
    event.stopPropagation();
    if (this.activeDocActionId() === docId) {
      this.activeDocActionId.set(null);
    } else {
      this.activeDocActionId.set(docId);
    }
  }

  closeDocAction(): void {
    this.activeDocActionId.set(null);
  }

  renameDocument(docId: string): void {
    const doc = this.productDocuments().find(d => d.id === docId);
    if (doc) {
      this.renameItemId.set(docId);
      this.renameItemType.set('document');
      this.renameValue.set(doc.name);
      this.isRenameModalOpen.set(true);
    }
    this.activeDocActionId.set(null);
  }

  downloadDocument(docId: string): void {
    console.log('Download document:', docId);
    this.activeDocActionId.set(null);
  }

  deleteDocument(docId: string): void {
    this.productDocuments.update(docs => docs.filter(d => d.id !== docId));
    this.activeDocActionId.set(null);
  }

  // Related products actions
  addSelectedProducts(): void {
    const selected = this.selectedProductIds();
    const available = this.availableProducts();
    const related = this.relatedProducts();

    const newRelated = available
      .filter(p => selected.has(p.id) && !related.find(r => r.id === p.id))
      .map((p, i) => ({ ...p, sortOrder: related.length + i + 1 }));

    this.relatedProducts.set([...related, ...newRelated]);
    this.selectedProductIds.set(new Set());
  }

  addProduct(product: RelatedProduct): void {
    const related = this.relatedProducts();
    if (!related.find(r => r.id === product.id)) {
      this.relatedProducts.set([...related, { ...product, sortOrder: related.length + 1 }]);
    }
  }

  removeProduct(product: RelatedProduct): void {
    this.relatedProducts.update(products => products.filter(p => p.id !== product.id));
  }

  removeSelectedRelatedProducts(): void {
    const selectedIds = this.selectedRelatedProductIds();
    this.relatedProducts.update(products => products.filter(p => !selectedIds.has(p.id)));
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
  }

  // Search
  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
  }

  // Save actions
  onSaveAndContinue(): void {
    console.log('Save and continue:', this.product());
  }

  onSave(): void {
    const product = this.product();
    const data = {
      partNo: product.code,
      name: product.name,
      slug: product.url,
      price: product.basePrice,
      weight: product.weight,
      shortDescription: product.shortDescription,
      isActive: product.active
    };

    const operation = this.isEditMode() && product.id
      ? this.productService.updateProduct(product.id, data)
      : this.productService.createProduct(data);

    operation.subscribe({
      next: () => this.router.navigate(['/admin/products/list']),
      error: (error) => console.error('Error saving product:', error)
    });
  }

  // Helpers
  getStatusBadgeVariant(status: string): 'success' | 'danger' | 'warning' | 'info' | 'default' {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'danger';
      default: return 'default';
    }
  }

  getProductGroupLabel(value: string): string {
    const option = this.productGroupOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  }

  // Gallery methods
  toggleImageDropdown(imageId: string, event: Event): void {
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

  makeImagePrimary(imageId: string): void {
    this.galleryImages.update(images =>
      images.map(img => ({ ...img, isPrimary: img.id === imageId }))
    );
    this.activeImageDropdown.set(null);
  }

  renameImage(imageId: string): void {
    const image = this.galleryImages().find(img => img.id === imageId);
    if (image) {
      this.renameItemId.set(imageId);
      this.renameItemType.set('image');
      this.renameValue.set(image.name);
      this.isRenameModalOpen.set(true);
    }
    this.activeImageDropdown.set(null);
  }

  downloadImage(imageId: string): void {
    console.log('Download image:', imageId);
    this.activeImageDropdown.set(null);
  }

  deleteImage(imageId: string): void {
    this.galleryImages.update(images => images.filter(img => img.id !== imageId));
    this.activeImageDropdown.set(null);
  }

  uploadImage(): void {
    console.log('Upload image');
  }

  downloadAllImages(): void {
    console.log('Download all images');
  }

  deleteAllImages(): void {
    this.galleryImages.set([]);
  }

  // Document methods
  toggleDocumentSelection(docId: string): void {
    const current = this.selectedDocumentIds();
    const newSet = new Set(current);
    if (newSet.has(docId)) {
      newSet.delete(docId);
    } else {
      newSet.add(docId);
    }
    this.selectedDocumentIds.set(newSet);
  }

  isDocumentSelected(docId: string): boolean {
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
    console.log('Add document');
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
  }

  confirmRename(): void {
    const itemId = this.renameItemId();
    const itemType = this.renameItemType();
    const newName = this.renameValue();

    if (!itemId || !newName) return;

    if (itemType === 'image') {
      this.galleryImages.update(images =>
        images.map(img => img.id === itemId ? { ...img, name: newName } : img)
      );
    } else if (itemType === 'document') {
      this.productDocuments.update(docs =>
        docs.map(doc => doc.id === itemId ? { ...doc, name: newName } : doc)
      );
    }

    this.cancelRename();
  }
}

