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
import { DeliveryTypeService } from '@core/services/http/delivery-type.service';

interface FuelSurchargeDetail {
  id: number;
  date: string;
  fuelSurcharge: string;
  deliveryTypeId: string;
  name: string;
}

const EMPTY_FUEL_SURCHARGE: FuelSurchargeDetail = {
  id: 0,
  date: '',
  fuelSurcharge: '',
  deliveryTypeId: '',
  name: ''
};

interface SelectOption {
  value: string;
  label: string;
}

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
  private deliveryTypeService = inject(DeliveryTypeService);
  private toastService = inject(ToastService);

  private fuelSurchargeId: string | null = null;

  fuelSurcharge = signal<FuelSurchargeDetail>({ ...EMPTY_FUEL_SURCHARGE });
  isEditMode = signal(false);
  isLoading = signal(false);

  deliveryTypeOptions = signal<SelectOption[]>([]);
  selectedDeliveryType = '';

  // Validation state
  touched = signal<Record<string, boolean>>({});
  errors = computed(() => {
    const fs = this.fuelSurcharge();
    const errs: Record<string, string> = {};
    if (!fs.date) errs['date'] = 'Date is required';
    if (!fs.fuelSurcharge?.trim()) errs['fuelSurcharge'] = 'Surcharge value is required';
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

  ngOnInit(): void {
    this.loadDeliveryTypes();
  }

  private loadDeliveryTypes(): void {
    this.deliveryTypeService.getDeliveryTypes({ itemsPerPage: 100 }).subscribe({
      next: (response) => {
        this.deliveryTypeOptions.set(
          (response.member || []).map(dt => ({
            value: String(dt.id),
            label: dt.name || `Type ${dt.id}`
          }))
        );
        this.cdr.markForCheck();
      }
    });
  }

  private loadFuelSurcharge(id: string): void {
    this.isLoading.set(true);

    this.fuelSurchargeService.getFuelSurchargeById(id).subscribe({
      next: (fuelSurcharge) => {
        // deliveryType comes as IRI string like "/api/v1/delivery_types/1" or as object
        let deliveryTypeId = '';
        if (fuelSurcharge.deliveryType) {
          if (typeof fuelSurcharge.deliveryType === 'string') {
            const match = fuelSurcharge.deliveryType.match(/\/(\d+)$/);
            deliveryTypeId = match ? match[1] : '';
          } else if (typeof fuelSurcharge.deliveryType === 'object' && fuelSurcharge.deliveryType.id) {
            deliveryTypeId = String(fuelSurcharge.deliveryType.id);
          }
        }

        // date comes as ISO string "2024-06-01T00:00:00+00:00" — extract date part
        const dateStr = fuelSurcharge.date ? fuelSurcharge.date.split('T')[0] : '';

        this.fuelSurcharge.set({
          id: fuelSurcharge.id || Number(id),
          date: dateStr,
          fuelSurcharge: fuelSurcharge.fuelSurcharge || '',
          deliveryTypeId,
          name: fuelSurcharge.name || ''
        });
        this.selectedDeliveryType = deliveryTypeId;
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
    this.touched.set({ date: true, fuelSurcharge: true });
  }

  markFieldTouched(field: string): void {
    this.touched.update(t => ({ ...t, [field]: true }));
  }

  getError(field: string): string {
    return this.touched()[field] ? (this.errors()[field] || '') : '';
  }

  // Form handlers
  onDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.fuelSurcharge.update(fs => ({ ...fs, date: input.value }));
    this.markFieldTouched('date');
  }

  onFuelSurchargeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.fuelSurcharge.update(fs => ({ ...fs, fuelSurcharge: input.value }));
    this.markFieldTouched('fuelSurcharge');
  }

  onDeliveryTypeChange(value: string | number): void {
    this.selectedDeliveryType = String(value);
    this.fuelSurcharge.update(fs => ({ ...fs, deliveryTypeId: String(value) }));
  }

  clearDeliveryType(): void {
    this.selectedDeliveryType = '';
    this.fuelSurcharge.update(fs => ({ ...fs, deliveryTypeId: '' }));
  }

  onNameChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.fuelSurcharge.update(fs => ({ ...fs, name: input.value }));
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
      date: formData.date || null,
      fuelSurcharge: formData.fuelSurcharge ? String(formData.fuelSurcharge) : null,
      name: formData.name || null,
      deliveryType: formData.deliveryTypeId ? `/api/v1/delivery_types/${formData.deliveryTypeId}` : null
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
