import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { FormFieldComponent } from '@app/ui-kit/molecules/form-field/form-field.component';
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { DetailHeaderComponent } from '@app/ui-kit/molecules/detail-header/detail-header.component';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';
import { SelectComponent } from '@app/ui-kit/atoms/select/select.component';
import { ToastService } from '@app/ui-kit/organisms/toast-container/toast-container.component';
import { DHL_ZONES } from '@core/models/country.model';
import { CountryService } from '@core/services/http/country.service';
import { TaxTypeService } from '@core/services/http/tax-type.service';
import { TaxType } from '@core/models/tax-type.model';
import { LoggerService } from '@core/services/logger.service';

interface CountryDetail {
  id: number;
  name: string;
  code: string;
  dhlZone: string;
  taxType: string;
}

const EMPTY_COUNTRY: CountryDetail = {
  id: 0,
  name: '',
  code: '',
  dhlZone: '',
  taxType: '',
};

interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-countries-edit',
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
  templateUrl: './countries-edit.component.html',
  styleUrls: ['./countries-edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CountriesEditComponent implements OnInit, OnDestroy {
  private toastService = inject(ToastService);
  private taxTypeService = inject(TaxTypeService);
  private destroy$ = new Subject<void>();
  private countryId: string | null = null;

  // Form state
  country = signal<CountryDetail>({ ...EMPTY_COUNTRY });
  isEditMode = signal(false);
  isLoading = signal(false);
  isSaving = signal(false);

  // Validation state
  touched = signal<Record<string, boolean>>({});
  errors = computed(() => {
    const country = this.country();
    const errs: Record<string, string> = {};
    if (!country.name?.trim()) errs['name'] = 'Name is required';
    if (!country.code?.trim()) errs['code'] = 'Code is required';
    else if (country.code.trim().length !== 2) errs['code'] = 'Code must be exactly 2 characters';
    if (!country.taxType) errs['taxType'] = 'Tax type is required';
    return errs;
  });
  isValid = computed(() => Object.keys(this.errors()).length === 0);

  // DHL zone options for ui-select (string values matching backend integers)
  dhlZoneOptions: SelectOption[] = DHL_ZONES.map(zone => ({ value: zone.value, label: zone.label }));

  // Selected value for DHL zone select
  selectedDhlZone = '';

  // Tax type options (loaded from API)
  taxTypes: TaxType[] = [];
  taxTypeOptions: SelectOption[] = [];
  selectedTaxType = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private countryService: CountryService,
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    this.loadTaxTypes();

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.countryId = params['id'] || null;
      this.isEditMode.set(!!this.countryId && this.countryId !== 'new');

      if (this.isEditMode()) {
        this.loadCountry(this.countryId!);
      } else {
        this.country.set({ ...EMPTY_COUNTRY });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCountry(id: string): void {
    this.isLoading.set(true);

    this.countryService.getCountryById(id).subscribe({
      next: (country) => {
        const taxTypeId = typeof country.taxType === 'object' && country.taxType?.id
          ? String(country.taxType.id) : '';
        this.country.set({
          id: country.id || Number(id),
          name: country.name || '',
          code: country.code || '',
          dhlZone: country.dhlZone != null ? String(country.dhlZone) : '',
          taxType: taxTypeId,
        });
        this.selectedDhlZone = country.dhlZone != null ? String(country.dhlZone) : '';
        this.selectedTaxType = taxTypeId;
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.logger.error('Error loading country:', error);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  // Navigation
  goBack(): void {
    this.router.navigate(['/admin/countries/list']);
  }

  // Form handlers
  onNameChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.country.update(c => ({ ...c, name: value }));
    this.markFieldTouched('name');
  }

  onCodeChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.country.update(c => ({ ...c, code: value }));
    this.markFieldTouched('code');
  }

  onDhlZoneChange(value: string | number): void {
    const strValue = String(value);
    this.selectedDhlZone = strValue;
    this.country.update(c => ({ ...c, dhlZone: strValue }));
  }

  clearDhlZone(): void {
    this.selectedDhlZone = '';
    this.country.update(c => ({ ...c, dhlZone: '' }));
  }

  private loadTaxTypes(): void {
    this.taxTypeService.getAllTaxTypes().subscribe({
      next: (response) => {
        this.taxTypes = response.member;
        this.taxTypeOptions = response.member.map(tt => ({
          value: String(tt.id),
          label: `${tt.name} (${tt.percent}%)`
        }));
        this.cdr.markForCheck();
      },
      error: (err) => this.logger.error('Failed to load tax types:', err)
    });
  }

  onTaxTypeChange(value: string | number): void {
    const strValue = String(value);
    this.selectedTaxType = strValue;
    this.country.update(c => ({ ...c, taxType: strValue }));
    this.markFieldTouched('taxType');
  }

  // Validation helpers
  markAllTouched(): void {
    this.touched.set({ name: true, code: true, taxType: true });
  }

  markFieldTouched(field: string): void {
    this.touched.update(t => ({ ...t, [field]: true }));
  }

  getError(field: string): string {
    return this.touched()[field] ? (this.errors()[field] || '') : '';
  }

  // Save actions
  onSave(): void {
    this.saveCountry(false);
  }

  onSaveAndContinue(): void {
    this.saveCountry(true);
  }

  private saveCountry(navigateToList: boolean): void {
    this.markAllTouched();
    if (!this.isValid()) {
      this.cdr.markForCheck();
      return;
    }

    if (this.isSaving()) return;

    const c = this.country();
    const payload: Record<string, unknown> = {
      name: c.name,
      code: c.code,
      dhlZone: c.dhlZone !== '' ? parseInt(c.dhlZone, 10) : null,
      taxType: `/api/v1/tax_types/${c.taxType}`
    };

    const isCreating = !this.isEditMode();
    const operation = isCreating
      ? this.countryService.createCountry(payload)
      : this.countryService.updateCountry(this.countryId!, payload);

    this.isSaving.set(true);
    operation.pipe(finalize(() => { this.isSaving.set(false); this.cdr.markForCheck(); })).subscribe({
      next: (result) => {
        this.toastService.success('Saved successfully');
        if (navigateToList) {
          this.router.navigate(['/admin/countries/list']);
        } else if (isCreating && result?.id) {
          this.router.navigate(['/admin/countries', result.id, 'edit']);
        }
      },
      error: (error) => {
        this.logger.error('Error saving country:', error);
        this.toastService.error('Failed to save country');
      }
    });
  }
}
