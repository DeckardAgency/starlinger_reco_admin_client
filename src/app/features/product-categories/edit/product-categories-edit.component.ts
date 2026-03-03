import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { FormFieldComponent } from '@app/ui-kit/molecules/form-field/form-field.component';
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { DetailHeaderComponent } from '@app/ui-kit/molecules/detail-header/detail-header.component';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';
import { ProductCategoryService } from '@core/services/http/product-category.service';
import { ToastService } from '@app/ui-kit/organisms/toast-container/toast-container.component';

interface ProductCategoryDetail {
  id: number;
  name: string;
  productGroupCode: string;
  description: string;
  isActive: boolean;
  showOnHomepage: boolean;
  sortOrder: number;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
}

const EMPTY_PRODUCT_CATEGORY: ProductCategoryDetail = {
  id: 0,
  name: '',
  productGroupCode: '',
  description: '',
  isActive: true,
  showOnHomepage: false,
  sortOrder: 0,
  metaTitle: '',
  metaDescription: '',
  metaKeywords: ''
};

@Component({
  selector: 'app-product-categories-edit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    FormFieldComponent,
    BreadcrumbsComponent,
    DetailHeaderComponent,
    MobileFooterComponent
  ],
  templateUrl: './product-categories-edit.component.html',
  styleUrls: ['./product-categories-edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductCategoriesEditComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private productCategoryId: string | null = null;
  private toastService = inject(ToastService);

  // Form state
  productCategory = signal<ProductCategoryDetail>({ ...EMPTY_PRODUCT_CATEGORY });
  isEditMode = signal(false);
  isLoading = signal(false);
  isSaving = signal(false);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private productCategoryService: ProductCategoryService
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.productCategoryId = params['id'] || null;
      this.isEditMode.set(!!this.productCategoryId && this.productCategoryId !== 'new');

      if (this.isEditMode()) {
        this.loadProductCategory(this.productCategoryId!);
      } else {
        this.productCategory.set({ ...EMPTY_PRODUCT_CATEGORY });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProductCategory(id: string): void {
    this.isLoading.set(true);

    this.productCategoryService.getProductCategoryById(id).subscribe({
      next: (pc) => {
        this.productCategory.set({
          id: pc.id || Number(id),
          name: pc.name || '',
          productGroupCode: pc.productGroupCode || '',
          description: pc.description || '',
          isActive: pc.isActive ?? true,
          showOnHomepage: pc.showOnHomepage ?? false,
          sortOrder: pc.sortOrder || 0,
          metaTitle: pc.metaTitle || '',
          metaDescription: pc.metaDescription || '',
          metaKeywords: pc.metaKeywords || ''
        });
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading product category:', error);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  // Navigation
  goBack(): void {
    this.router.navigate(['/admin/product-categories/list']);
  }

  // Form handlers
  onNameChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.productCategory.update(pc => ({ ...pc, name: value }));
  }

  onCodeChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.productCategory.update(pc => ({ ...pc, productGroupCode: value }));
  }

  onDescriptionChange(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.productCategory.update(pc => ({ ...pc, description: value }));
  }

  onSortOrderChange(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value, 10) || 0;
    this.productCategory.update(pc => ({ ...pc, sortOrder: value }));
  }

  onMetaTitleChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.productCategory.update(pc => ({ ...pc, metaTitle: value }));
  }

  onMetaDescriptionChange(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.productCategory.update(pc => ({ ...pc, metaDescription: value }));
  }

  onMetaKeywordsChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.productCategory.update(pc => ({ ...pc, metaKeywords: value }));
  }

  onIsActiveChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.productCategory.update(pc => ({ ...pc, isActive: checked }));
  }

  onShowOnHomepageChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.productCategory.update(pc => ({ ...pc, showOnHomepage: checked }));
  }

  // Save actions
  onSave(): void {
    this.saveProductCategory(false);
  }

  onSaveAndContinue(): void {
    this.saveProductCategory(true);
  }

  private saveProductCategory(navigateToList: boolean): void {
    this.isSaving.set(true);
    const formData = this.productCategory();
    const isCreating = !this.isEditMode();

    // Exclude id when creating (let backend generate it)
    const { id, ...createData } = formData;
    const data = isCreating ? createData : formData;

    const operation = isCreating
      ? this.productCategoryService.createProductCategory(data)
      : this.productCategoryService.updateProductCategory(this.productCategoryId!, data);

    operation.subscribe({
      next: (result) => {
        this.isSaving.set(false);
        this.toastService.success('Saved successfully');
        if (navigateToList) {
          this.router.navigate(['/admin/product-categories/list']);
        } else if (isCreating && result?.id) {
          this.router.navigate(['/admin/product-categories', result.id, 'edit']);
        } else if (!isCreating && this.productCategoryId) {
          this.loadProductCategory(this.productCategoryId);
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error saving product category:', error);
        this.isSaving.set(false);
        this.toastService.error('Failed to save product category');
        this.cdr.markForCheck();
      }
    });
  }
}
