import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { FormFieldComponent } from '@app/ui-kit/molecules/form-field/form-field.component';
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { DetailHeaderComponent } from '@app/ui-kit/molecules/detail-header/detail-header.component';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { SelectComponent } from '@app/ui-kit/atoms/select/select.component';
import { ToastService } from '@app/ui-kit/organisms/toast-container/toast-container.component';
import { DeliveryPrice, DeliveryPriceDeliveryType } from '@core/models/delivery-price.model';
import { DeliveryPriceService } from '@core/services/http/delivery-price.service';
import { DeliveryTypeService } from '@core/services/http/delivery-type.service';
import { DHL_ZONES } from '@core/models/country.model';

interface DeliveryPriceDetail {
  id: string;
  name: string;
  deliveryType: string;
  dhlZone: string;
  sizeFrom: string;
  sizeTo: string;
  priceBase: string;
  stepStartsAt: string;
  forEveryNextSize: string;
  priceBaseStep: string;
}

const EMPTY_DELIVERY_PRICE: DeliveryPriceDetail = {
  id: '',
  name: '',
  deliveryType: '',
  dhlZone: '',
  sizeFrom: '',
  sizeTo: '',
  priceBase: '',
  stepStartsAt: '',
  forEveryNextSize: '',
  priceBaseStep: ''
};

// Options interface for dropdowns
interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-delivery-prices-edit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    FormFieldComponent,
    BreadcrumbsComponent,
    DetailHeaderComponent,
    MobileFooterComponent,
    IconComponent,
    SelectComponent
  ],
  templateUrl: './delivery-prices-edit.component.html',
  styleUrls: ['./delivery-prices-edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeliveryPricesEditComponent implements OnInit, OnDestroy {
  private toastService = inject(ToastService);
  private destroy$ = new Subject<void>();

  // Mode
  isEditMode = signal(false);
  deliveryPriceId: string | null = null;

  // Data
  deliveryPrice = signal<DeliveryPriceDetail>({ ...EMPTY_DELIVERY_PRICE });

  // Loading state
  isLoading = signal(false);

  // Validation state
  touched = signal<Record<string, boolean>>({});
  errors = computed(() => {
    const dp = this.deliveryPrice();
    const errs: Record<string, string> = {};
    if (!dp.name?.trim()) errs['name'] = 'Name is required';
    if (!dp.priceBase?.trim()) errs['priceBase'] = 'Price base is required';
    if (!dp.deliveryType) errs['deliveryType'] = 'Delivery type is required';
    return errs;
  });
  isValid = computed(() => Object.keys(this.errors()).length === 0);

  // Dropdown options
  dhlZoneOptions: SelectOption[] = DHL_ZONES.map(z => ({ value: z.value, label: z.label }));
  deliveryTypeOptions = signal<SelectOption[]>([]);

  // Selected values for select elements
  selectedDhlZone = '';
  selectedDeliveryType = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private deliveryPriceService: DeliveryPriceService,
    private deliveryTypeService: DeliveryTypeService
  ) {}

  ngOnInit(): void {
    this.loadDeliveryTypes();

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['id'] && params['id'] !== 'new') {
        this.isEditMode.set(true);
        this.deliveryPriceId = params['id'];
        this.loadDeliveryPrice(this.deliveryPriceId!);
      }
    });
  }

  private loadDeliveryTypes(): void {
    this.deliveryTypeService.getDeliveryTypes(1, 100)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const options = response.member
            .filter(dt => dt.isActive)
            .map(dt => ({ value: dt.id, label: dt.name }));
          this.deliveryTypeOptions.set(options);
          this.cdr.markForCheck();
        },
        error: (err) => console.error('Error loading delivery types:', err)
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDeliveryPrice(id: string): void {
    this.isLoading.set(true);

    this.deliveryPriceService.getDeliveryPriceById(id).subscribe({
      next: (deliveryPrice) => {
        // Extract delivery type ID from the nested object or IRI
        let deliveryTypeId = '';
        if (deliveryPrice.deliveryType) {
          if (typeof deliveryPrice.deliveryType === 'object' && deliveryPrice.deliveryType !== null) {
            deliveryTypeId = (deliveryPrice.deliveryType as DeliveryPriceDeliveryType).id || '';
          } else if (typeof deliveryPrice.deliveryType === 'string') {
            // Could be an IRI like "/api/v1/delivery_types/uuid" or just a UUID
            const iriMatch = (deliveryPrice.deliveryType as string).match(/\/([^/]+)$/);
            deliveryTypeId = iriMatch ? iriMatch[1] : (deliveryPrice.deliveryType as string);
          }
        }

        this.deliveryPrice.set({
          id: deliveryPrice.id || id,
          name: deliveryPrice.name || '',
          deliveryType: deliveryTypeId,
          dhlZone: deliveryPrice.dhlZone != null ? String(deliveryPrice.dhlZone) : '',
          sizeFrom: deliveryPrice.sizeFrom || '',
          sizeTo: deliveryPrice.sizeTo || '',
          priceBase: deliveryPrice.priceBase || '',
          stepStartsAt: deliveryPrice.stepStartsAt || '',
          forEveryNextSize: deliveryPrice.forEveryNextSize || '',
          priceBaseStep: deliveryPrice.priceBaseStep || ''
        });
        this.selectedDhlZone = deliveryPrice.dhlZone != null ? String(deliveryPrice.dhlZone) : '';
        this.selectedDeliveryType = deliveryTypeId;
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading delivery price:', error);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/admin/delivery-prices/list']);
  }

  // Validation helpers
  markAllTouched(): void {
    this.touched.set({ name: true, priceBase: true, deliveryType: true });
  }

  markFieldTouched(field: string): void {
    this.touched.update(t => ({ ...t, [field]: true }));
  }

  getError(field: string): string {
    return this.touched()[field] ? (this.errors()[field] || '') : '';
  }

  onSave(): void {
    this.saveDeliveryPrice(false);
  }

  onSaveAndContinue(): void {
    this.saveDeliveryPrice(true);
  }

  private saveDeliveryPrice(navigateToList: boolean): void {
    this.markAllTouched();
    if (!this.isValid()) {
      this.cdr.markForCheck();
      return;
    }

    const data = this.deliveryPrice();

    // Build explicit payload with only writable fields - never send id
    const payload: Record<string, unknown> = {
      name: data.name || null,
      deliveryType: data.deliveryType || null,
      dhlZone: data.dhlZone !== '' ? parseInt(data.dhlZone, 10) : null,
      sizeFrom: data.sizeFrom || null,
      sizeTo: data.sizeTo || null,
      priceBase: data.priceBase || null,
      stepStartsAt: data.stepStartsAt || null,
      forEveryNextSize: data.forEveryNextSize || null,
      priceBaseStep: data.priceBaseStep || null
    };

    const isCreating = !this.isEditMode();
    const operation = isCreating
      ? this.deliveryPriceService.createDeliveryPrice(payload as Partial<DeliveryPrice>)
      : this.deliveryPriceService.updateDeliveryPrice(this.deliveryPriceId!, payload as Partial<DeliveryPrice>);

    operation.subscribe({
      next: (result) => {
        this.toastService.success('Saved successfully');
        if (navigateToList) {
          this.router.navigate(['/admin/delivery-prices/list']);
        } else if (isCreating && result?.id) {
          this.router.navigate(['/admin/delivery-prices', result.id, 'edit']);
        }
      },
      error: (error) => {
        console.error('Error saving delivery price:', error);
        this.toastService.error('Failed to save delivery price');
      }
    });
  }

  // Input handlers
  onFieldChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const field = input.name;
    if (field) {
      this.deliveryPrice.update(dp => ({ ...dp, [field]: input.value }));
    }
  }

  onNameChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.deliveryPrice.update(dp => ({ ...dp, name: input.value }));
  }

  onSizeFromChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.deliveryPrice.update(dp => ({ ...dp, sizeFrom: input.value }));
  }

  onSizeToChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.deliveryPrice.update(dp => ({ ...dp, sizeTo: input.value }));
  }

  onPriceBaseChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.deliveryPrice.update(dp => ({ ...dp, priceBase: input.value }));
    this.markFieldTouched('priceBase');
  }

  onStepStartsAtChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.deliveryPrice.update(dp => ({ ...dp, stepStartsAt: input.value }));
  }

  onForEveryNextSizeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.deliveryPrice.update(dp => ({ ...dp, forEveryNextSize: input.value }));
  }

  onPriceBaseStepChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.deliveryPrice.update(dp => ({ ...dp, priceBaseStep: input.value }));
  }

  // Select handlers
  onDhlZoneChange(value: string | number): void {
    this.selectedDhlZone = String(value);
    this.deliveryPrice.update(dp => ({ ...dp, dhlZone: String(value) }));
  }

  clearDhlZone(): void {
    this.selectedDhlZone = '';
    this.deliveryPrice.update(dp => ({ ...dp, dhlZone: '' }));
  }

  onDeliveryTypeChange(value: string | number): void {
    this.selectedDeliveryType = String(value);
    this.deliveryPrice.update(dp => ({ ...dp, deliveryType: String(value) }));
    this.markFieldTouched('deliveryType');
  }

  clearDeliveryType(): void {
    this.selectedDeliveryType = '';
    this.deliveryPrice.update(dp => ({ ...dp, deliveryType: '' }));
    this.markFieldTouched('deliveryType');
  }
}
