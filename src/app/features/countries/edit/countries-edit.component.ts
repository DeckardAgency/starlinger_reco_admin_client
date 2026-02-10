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
import { DHL_ZONES } from '@core/models/country.model';
import { CountryService } from '@core/services/http/country.service';

interface CountryDetail {
  id: string;
  name: string;
  code: string;
  iso31661Alpha3Code: string;
  dhlZone: string;
  defaultTaxPercent: string;
}

const EMPTY_COUNTRY: CountryDetail = {
  id: '',
  name: '',
  code: '',
  iso31661Alpha3Code: '',
  dhlZone: '',
  defaultTaxPercent: ''
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
    IconComponent,
    SelectComponent
  ],
  templateUrl: './countries-edit.component.html',
  styleUrls: ['./countries-edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CountriesEditComponent implements OnInit, OnDestroy {
  private toastService = inject(ToastService);
  private destroy$ = new Subject<void>();
  private countryId: string | null = null;

  // Form state
  country = signal<CountryDetail>({ ...EMPTY_COUNTRY });
  isEditMode = signal(false);
  isLoading = signal(false);

  // Validation state
  touched = signal<Record<string, boolean>>({});
  errors = computed(() => {
    const country = this.country();
    const errs: Record<string, string> = {};
    if (!country.name?.trim()) errs['name'] = 'Name is required';
    if (!country.code?.trim()) errs['code'] = 'Code is required';
    else if (country.code.trim().length !== 2) errs['code'] = 'Code must be exactly 2 characters';
    return errs;
  });
  isValid = computed(() => Object.keys(this.errors()).length === 0);

  // DHL zone options for ui-select (string values matching backend integers)
  dhlZoneOptions: SelectOption[] = DHL_ZONES.map(zone => ({ value: zone.value, label: zone.label }));

  // Selected value for DHL zone select
  selectedDhlZone = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private countryService: CountryService
  ) {}

  ngOnInit(): void {
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
        this.country.set({
          id: country.id || id,
          name: country.name || '',
          code: country.code || '',
          iso31661Alpha3Code: country.iso31661Alpha3Code || '',
          dhlZone: country.dhlZone != null ? String(country.dhlZone) : '',
          defaultTaxPercent: country.defaultTaxPercent != null ? String(country.defaultTaxPercent) : ''
        });
        this.selectedDhlZone = country.dhlZone != null ? String(country.dhlZone) : '';
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading country:', error);
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

  onIso31661Alpha3CodeChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.country.update(c => ({ ...c, iso31661Alpha3Code: value }));
  }

  onDefaultTaxPercentChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.country.update(c => ({ ...c, defaultTaxPercent: value }));
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

  // Validation helpers
  markAllTouched(): void {
    this.touched.set({ name: true, code: true });
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

    const c = this.country();
    const payload: Record<string, unknown> = {
      name: c.name,
      code: c.code,
      iso31661Alpha3Code: c.iso31661Alpha3Code || null,
      defaultTaxPercent: c.defaultTaxPercent !== '' ? c.defaultTaxPercent : null,
      dhlZone: c.dhlZone !== '' ? parseInt(c.dhlZone, 10) : null
    };

    const isCreating = !this.isEditMode();
    const operation = isCreating
      ? this.countryService.createCountry(payload)
      : this.countryService.updateCountry(this.countryId!, payload);

    operation.subscribe({
      next: (result) => {
        this.toastService.success('Saved successfully');
        if (navigateToList) {
          this.router.navigate(['/admin/countries/list']);
        } else if (isCreating && result?.id) {
          this.router.navigate(['/admin/countries', result.id, 'edit']);
        }
      },
      error: (error) => {
        console.error('Error saving country:', error);
        this.toastService.error('Failed to save country');
      }
    });
  }
}
