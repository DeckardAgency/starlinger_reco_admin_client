import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PackagingPrice } from '@core/models/packaging-price.model';
import { BreadcrumbsComponent, BreadcrumbItem } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { DetailHeaderComponent } from '@app/ui-kit/molecules/detail-header/detail-header.component';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';
import { FormFieldComponent } from '@app/ui-kit/molecules/form-field/form-field.component';
import { PackagingPriceService } from '@core/services/http/packaging-price.service';
import { ToastService } from '@app/ui-kit/organisms/toast-container/toast-container.component';

const EMPTY_PACKAGING_PRICE: PackagingPrice = {
  id: 0,
  name: '',
  sizeFrom: null,
  sizeTo: null,
  priceBase: ''
};

@Component({
  selector: 'app-packaging-prices-edit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    BreadcrumbsComponent,
    DetailHeaderComponent,
    MobileFooterComponent,
    FormFieldComponent
  ],
  templateUrl: './packaging-prices-edit.component.html',
  styleUrls: ['./packaging-prices-edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PackagingPricesEditComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private packagingPriceService = inject(PackagingPriceService);
  private toastService = inject(ToastService);

  isEditMode = signal(false);
  packagingPriceId = signal<string | null>(null);
  packagingPrice = signal<PackagingPrice>(EMPTY_PACKAGING_PRICE);
  isLoading = signal(false);

  // Validation state
  touched = signal<Record<string, boolean>>({});
  errors = computed(() => {
    const pp = this.packagingPrice();
    const errs: Record<string, string> = {};
    if (!pp.name || pp.name.trim() === '') {
      errs['name'] = 'Name is required';
    }
    if (!pp.priceBase || pp.priceBase.trim() === '') {
      errs['priceBase'] = 'Price base is required';
    } else if (parseFloat(pp.priceBase) < 0) {
      errs['priceBase'] = 'Price base must be zero or positive';
    }
    return errs;
  });
  isValid = computed(() => Object.keys(this.errors()).length === 0);

  // Breadcrumb items
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Packaging prices', route: '/admin/packaging-prices' },
    { label: 'Edit', route: '' }
  ];

  constructor() {
    this.route.params.pipe(takeUntilDestroyed()).subscribe(params => {
      const id = params['id'];
      if (id && id !== 'new') {
        this.packagingPriceId.set(id);
        this.isEditMode.set(true);
        this.loadPackagingPrice(id);
      } else {
        this.isEditMode.set(false);
        this.packagingPrice.set({ ...EMPTY_PACKAGING_PRICE });
      }
    });
  }

  ngOnInit(): void {}

  private loadPackagingPrice(id: string): void {
    this.isLoading.set(true);

    this.packagingPriceService.getPackagingPriceById(id).subscribe({
      next: (packagingPrice) => {
        this.packagingPrice.set({
          id: packagingPrice.id || Number(id),
          name: packagingPrice.name || '',
          sizeFrom: packagingPrice.sizeFrom ?? null,
          sizeTo: packagingPrice.sizeTo ?? null,
          priceBase: packagingPrice.priceBase || '0'
        });
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading packaging price:', error);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  onNameChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.packagingPrice.update(pp => ({ ...pp, name: input.value }));
  }

  onSizeFromChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    this.packagingPrice.update(pp => ({ ...pp, sizeFrom: value === '' ? null : value }));
  }

  onSizeToChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    this.packagingPrice.update(pp => ({ ...pp, sizeTo: value === '' ? null : value }));
  }

  onPriceBaseChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.packagingPrice.update(pp => ({ ...pp, priceBase: input.value }));
    this.markFieldTouched('priceBase');
  }

  // Validation helpers
  markAllTouched(): void {
    this.touched.set({ name: true, priceBase: true });
  }

  markFieldTouched(field: string): void {
    this.touched.update(t => ({ ...t, [field]: true }));
  }

  getError(field: string): string {
    return this.touched()[field] ? (this.errors()[field] || '') : '';
  }

  onSave(): void {
    this.markAllTouched();
    if (!this.isValid()) {
      this.cdr.markForCheck();
      return;
    }

    const data = this.packagingPrice();
    const payload: Record<string, unknown> = {
      name: data.name || null,
      sizeFrom: data.sizeFrom || null,
      sizeTo: data.sizeTo || null,
      priceBase: String(data.priceBase)
    };

    const operation = this.isEditMode()
      ? this.packagingPriceService.updatePackagingPrice(this.packagingPriceId()!, payload as any)
      : this.packagingPriceService.createPackagingPrice(payload as any);

    operation.subscribe({
      next: () => {
        this.toastService.success('Saved successfully');
        this.router.navigate(['/admin/packaging-prices/list']);
      },
      error: (error) => {
        console.error('Error saving packaging price:', error);
        this.toastService.error('Failed to save packaging price');
      }
    });
  }

  onDiscard(): void {
    this.router.navigate(['/admin/packaging-prices/list']);
  }

  goBack(): void {
    this.router.navigate(['/admin/packaging-prices/list']);
  }
}
