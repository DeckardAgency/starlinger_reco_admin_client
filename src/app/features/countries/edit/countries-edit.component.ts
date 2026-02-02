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
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { DHL_ZONES, DhlZone } from '@core/models/country.model';
import { CountryService } from '@core/services/http/country.service';

interface CountryDetail {
  id: string;
  name: string;
  code: string;
  iso31661Alpha3Code: string;
  dhlZone: string;
  defaultTaxPercent: number;
}

const EMPTY_COUNTRY: CountryDetail = {
  id: '',
  name: '',
  code: '',
  iso31661Alpha3Code: '',
  dhlZone: '',
  defaultTaxPercent: 0
};

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
    IconComponent
  ],
  templateUrl: './countries-edit.component.html',
  styleUrls: ['./countries-edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CountriesEditComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private countryId: string | null = null;

  // Form state
  country = signal<CountryDetail>({ ...EMPTY_COUNTRY });
  isEditMode = signal(false);
  isLoading = signal(false);

  // DHL zone options
  dhlZoneOptions: DhlZone[] = DHL_ZONES;

  // Selected DHL zone for the select-with-pill
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
          dhlZone: country.dhlZone || '',
          defaultTaxPercent: country.defaultTaxPercent || 0
        });
        this.selectedDhlZone = country.dhlZone || '';
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
  }

  onCodeChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.country.update(c => ({ ...c, code: value }));
  }

  onIso31661Alpha3CodeChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.country.update(c => ({ ...c, iso31661Alpha3Code: value }));
  }

  onDefaultTaxPercentChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.country.update(c => ({ ...c, defaultTaxPercent: parseFloat(value) || 0 }));
  }

  onDhlZoneChange(): void {
    if (this.selectedDhlZone) {
      this.country.update(c => ({ ...c, dhlZone: this.selectedDhlZone }));
    }
  }

  removeDhlZone(): void {
    this.country.update(c => ({ ...c, dhlZone: '' }));
    this.selectedDhlZone = '';
  }

  getDhlZoneLabel(value: string): string {
    return this.dhlZoneOptions.find(o => o.value === value)?.label || value;
  }

  // Save actions
  onSave(): void {
    const data = this.country();
    const operation = this.isEditMode()
      ? this.countryService.updateCountry(this.countryId!, data)
      : this.countryService.createCountry(data);

    operation.subscribe({
      next: () => this.router.navigate(['/admin/countries/list']),
      error: (error) => console.error('Error saving country:', error)
    });
  }

  onSaveAndContinue(): void {
    console.log('Save and continue:', this.country());
  }
}
