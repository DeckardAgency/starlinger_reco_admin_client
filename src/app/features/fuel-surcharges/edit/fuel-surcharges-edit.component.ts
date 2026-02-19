import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FormFieldComponent } from '@app/ui-kit/molecules/form-field/form-field.component';
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { DetailHeaderComponent } from '@app/ui-kit/molecules/detail-header/detail-header.component';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';
import { SelectComponent } from '@app/ui-kit/atoms/select/select.component';
import { ToastService } from '@app/ui-kit/organisms/toast-container/toast-container.component';
import { FuelSurchargeService } from '@core/services/http/fuel-surcharge.service';

interface FuelSurchargeDetail {
  id: number;
  name: string;
  sizeFrom: string;
  sizeTo: string;
  priceBase: string;
}

const EMPTY_FUEL_SURCHARGE: FuelSurchargeDetail = {
  id: 0,
  name: '',
  sizeFrom: '',
  sizeTo: '',
  priceBase: ''
};

interface SelectOption {
  value: string;
  label: string;
}

const SIZE_FROM_OPTIONS: SelectOption[] = [
  { value: '0', label: '0' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
  { value: '150', label: '150' },
  { value: '200', label: '200' },
  { value: '250', label: '250' },
  { value: '300', label: '300' },
  { value: '400', label: '400' },
  { value: '500', label: '500' },
  { value: '1000', label: '1000' }
];

@Component({
  selector: 'app-fuel-surcharges-edit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    FormFieldComponent,
    BreadcrumbsComponent,
    DetailHeaderComponent,
    MobileFooterComponent,
    SelectComponent
  ],
  templateUrl: './fuel-surcharges-edit.component.html',
  styleUrls: ['./fuel-surcharges-edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FuelSurchargesEditComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private fuelSurchargeService = inject(FuelSurchargeService);
  private toastService = inject(ToastService);

  private fuelSurchargeId: string | null = null;

  fuelSurcharge = signal<FuelSurchargeDetail>({ ...EMPTY_FUEL_SURCHARGE });
  isEditMode = signal(false);
  isLoading = signal(false);

  sizeFromOptions = signal<SelectOption[]>(SIZE_FROM_OPTIONS);
  selectedSizeFrom = '';

  // Validation state
  touched = signal<Record<string, boolean>>({});
  errors = computed(() => {
    const fs = this.fuelSurcharge();
    const errs: Record<string, string> = {};
    if (!fs.priceBase?.trim()) errs['priceBase'] = 'Price base is required';
    return errs;
  });
  isValid = computed(() => Object.keys(this.errors()).length === 0);

  constructor() {
    this.route.params.pipe(takeUntilDestroyed()).subscribe(params => {
      const id = params['id'];
      if (id && id !== 'new') {
        this.fuelSurchargeId = id;
        this.isEditMode.set(true);
        this.loadFuelSurcharge(id);
      } else {
        this.isEditMode.set(false);
        this.fuelSurcharge.set({ ...EMPTY_FUEL_SURCHARGE });
      }
    });
  }

  ngOnInit(): void {}

  private loadFuelSurcharge(id: string): void {
    this.isLoading.set(true);

    this.fuelSurchargeService.getFuelSurchargeById(id).subscribe({
      next: (fuelSurcharge) => {
        this.fuelSurcharge.set({
          id: fuelSurcharge.id || Number(id),
          name: fuelSurcharge.name || '',
          sizeFrom: fuelSurcharge.sizeFrom || '',
          sizeTo: fuelSurcharge.sizeTo || '',
          priceBase: fuelSurcharge.priceBase || ''
        });
        this.selectedSizeFrom = fuelSurcharge.sizeFrom || '';
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading fuel surcharge:', error);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/fuel-surcharges/list']);
  }

  // Validation helpers
  markAllTouched(): void {
    this.touched.set({ priceBase: true });
  }

  markFieldTouched(field: string): void {
    this.touched.update(t => ({ ...t, [field]: true }));
  }

  getError(field: string): string {
    return this.touched()[field] ? (this.errors()[field] || '') : '';
  }

  // Form handlers
  onNameChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.fuelSurcharge.update(fs => ({ ...fs, name: input.value }));
  }

  onSizeFromChange(value: string | number): void {
    this.selectedSizeFrom = String(value);
    this.fuelSurcharge.update(fs => ({ ...fs, sizeFrom: String(value) }));
  }

  clearSizeFrom(): void {
    this.selectedSizeFrom = '';
    this.fuelSurcharge.update(fs => ({ ...fs, sizeFrom: '' }));
  }

  onSizeToChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.fuelSurcharge.update(fs => ({ ...fs, sizeTo: input.value }));
  }

  onPriceBaseChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.fuelSurcharge.update(fs => ({ ...fs, priceBase: input.value }));
    this.markFieldTouched('priceBase');
  }

  // Save actions
  onSave(): void {
    this.saveFuelSurcharge(true);
  }

  onSaveAndContinue(): void {
    this.saveFuelSurcharge(false);
  }

  private saveFuelSurcharge(navigateToList: boolean): void {
    this.markAllTouched();
    if (!this.isValid()) {
      this.cdr.markForCheck();
      return;
    }

    const formData = this.fuelSurcharge();

    const payload: Record<string, unknown> = {
      name: formData.name || null,
      sizeFrom: formData.sizeFrom ? String(formData.sizeFrom) : null,
      sizeTo: formData.sizeTo ? String(formData.sizeTo) : null,
      priceBase: formData.priceBase ? String(formData.priceBase) : null
    };

    const isCreating = !this.isEditMode();
    const operation = isCreating
      ? this.fuelSurchargeService.createFuelSurcharge(payload as any)
      : this.fuelSurchargeService.updateFuelSurcharge(this.fuelSurchargeId!, payload as any);

    operation.subscribe({
      next: (result) => {
        this.toastService.success('Saved successfully');
        if (navigateToList) {
          this.router.navigate(['/admin/fuel-surcharges/list']);
        } else if (isCreating && result?.id) {
          this.router.navigate(['/admin/fuel-surcharges', result.id, 'edit']);
        }
      },
      error: (error) => {
        console.error('Error saving fuel surcharge:', error);
        this.toastService.error('Failed to save fuel surcharge');
      }
    });
  }
}
