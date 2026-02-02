import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, inject, OnInit } from '@angular/core';
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

const EMPTY_PACKAGING_PRICE: PackagingPrice = {
  id: '',
  name: '',
  sizeFrom: 0,
  sizeTo: 0,
  priceBase: 0
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

  isEditMode = signal(false);
  packagingPriceId = signal<string | null>(null);
  packagingPrice = signal<PackagingPrice>(EMPTY_PACKAGING_PRICE);
  isLoading = signal(false);

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
          id: packagingPrice.id || id,
          name: packagingPrice.name || '',
          sizeFrom: packagingPrice.sizeFrom || 0,
          sizeTo: packagingPrice.sizeTo || 0,
          priceBase: packagingPrice.priceBase || 0
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

  onSizeFromChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.packagingPrice.update(pp => ({ ...pp, sizeFrom: parseFloat(input.value) || 0 }));
  }

  onSizeToChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.packagingPrice.update(pp => ({ ...pp, sizeTo: parseFloat(input.value) || 0 }));
  }

  onPriceBaseChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.packagingPrice.update(pp => ({ ...pp, priceBase: parseFloat(input.value) || 0 }));
  }

  onSave(): void {
    const data = this.packagingPrice();
    const operation = this.isEditMode()
      ? this.packagingPriceService.updatePackagingPrice(this.packagingPriceId()!, data)
      : this.packagingPriceService.createPackagingPrice(data);

    operation.subscribe({
      next: () => this.router.navigate(['/admin/packaging-prices/list']),
      error: (error) => console.error('Error saving packaging price:', error)
    });
  }

  onDiscard(): void {
    this.router.navigate(['/admin/packaging-prices/list']);
  }

  goBack(): void {
    this.router.navigate(['/admin/packaging-prices/list']);
  }
}

