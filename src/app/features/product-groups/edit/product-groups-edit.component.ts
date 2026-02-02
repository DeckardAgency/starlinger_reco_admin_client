import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { FormFieldComponent } from '@app/ui-kit/molecules/form-field/form-field.component';
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { DetailHeaderComponent } from '@app/ui-kit/molecules/detail-header/detail-header.component';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';
import { ProductGroupService } from '@core/services/http/product-group.service';

interface ProductGroupDetail {
  id: string;
  name: string;
  productGroupCode: string;
  description: string;
  isActive: boolean;
  showOnHomepage: boolean;
  sortOrder: number;
  metaTitle: string;
  metaDescription: string;
}

const EMPTY_PRODUCT_GROUP: ProductGroupDetail = {
  id: '',
  name: '',
  productGroupCode: '',
  description: '',
  isActive: true,
  showOnHomepage: false,
  sortOrder: 0,
  metaTitle: '',
  metaDescription: ''
};

@Component({
  selector: 'app-product-groups-edit',
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
  templateUrl: './product-groups-edit.component.html',
  styleUrls: ['./product-groups-edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductGroupsEditComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private productGroupId: string | null = null;

  // Form state
  productGroup = signal<ProductGroupDetail>({ ...EMPTY_PRODUCT_GROUP });
  isEditMode = signal(false);
  isLoading = signal(false);
  isSaving = signal(false);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private productGroupService: ProductGroupService
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.productGroupId = params['id'] || null;
      this.isEditMode.set(!!this.productGroupId && this.productGroupId !== 'new');

      if (this.isEditMode()) {
        this.loadProductGroup(this.productGroupId!);
      } else {
        this.productGroup.set({ ...EMPTY_PRODUCT_GROUP });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProductGroup(id: string): void {
    this.isLoading.set(true);

    this.productGroupService.getProductGroupById(id).subscribe({
      next: (pg) => {
        this.productGroup.set({
          id: pg.id || id,
          name: pg.name || '',
          productGroupCode: pg.productGroupCode || '',
          description: pg.description || '',
          isActive: pg.isActive ?? true,
          showOnHomepage: pg.showOnHomepage ?? false,
          sortOrder: pg.sortOrder || 0,
          metaTitle: pg.metaTitle || '',
          metaDescription: pg.metaDescription || ''
        });
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading product group:', error);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  // Navigation
  goBack(): void {
    this.router.navigate(['/admin/product-groups/list']);
  }

  // Form handlers
  onNameChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.productGroup.update(pg => ({ ...pg, name: value }));
  }

  onCodeChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.productGroup.update(pg => ({ ...pg, productGroupCode: value }));
  }

  onDescriptionChange(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.productGroup.update(pg => ({ ...pg, description: value }));
  }

  onSortOrderChange(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value, 10) || 0;
    this.productGroup.update(pg => ({ ...pg, sortOrder: value }));
  }

  onMetaTitleChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.productGroup.update(pg => ({ ...pg, metaTitle: value }));
  }

  onMetaDescriptionChange(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.productGroup.update(pg => ({ ...pg, metaDescription: value }));
  }

  onIsActiveChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.productGroup.update(pg => ({ ...pg, isActive: checked }));
  }

  onShowOnHomepageChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.productGroup.update(pg => ({ ...pg, showOnHomepage: checked }));
  }

  // Save actions
  onSave(): void {
    this.isSaving.set(true);
    const data = this.productGroup();

    const operation = this.isEditMode()
      ? this.productGroupService.updateProductGroup(this.productGroupId!, data)
      : this.productGroupService.createProductGroup(data);

    operation.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.router.navigate(['/admin/product-groups/list']);
      },
      error: (error) => {
        console.error('Error saving product group:', error);
        this.isSaving.set(false);
        alert('Failed to save product group');
        this.cdr.markForCheck();
      }
    });
  }

  onSaveAndContinue(): void {
    this.isSaving.set(true);
    const data = this.productGroup();

    const operation = this.isEditMode()
      ? this.productGroupService.updateProductGroup(this.productGroupId!, data)
      : this.productGroupService.createProductGroup(data);

    operation.subscribe({
      next: (result) => {
        this.isSaving.set(false);
        if (!this.isEditMode() && result.id) {
          // If creating new, redirect to edit mode
          this.router.navigate(['/admin/product-groups', result.id, 'edit']);
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error saving product group:', error);
        this.isSaving.set(false);
        alert('Failed to save product group');
        this.cdr.markForCheck();
      }
    });
  }
}
