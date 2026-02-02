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
import { TaxType } from '@core/models/tax-type.model';
import { TaxTypeService } from '@core/services/http/tax-type.service';

interface TaxTypeDetail {
  id: string;
  name: string;
  percent: number;
  remoteCode: string | null;
}

const EMPTY_TAX_TYPE: TaxTypeDetail = {
  id: '',
  name: '',
  percent: 0,
  remoteCode: null
};

@Component({
  selector: 'app-tax-types-edit',
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
  templateUrl: './tax-types-edit.component.html',
  styleUrls: ['./tax-types-edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaxTypesEditComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Mode
  isEditMode = signal(false);
  taxTypeId: string | null = null;

  // Data
  taxType = signal<TaxTypeDetail>({ ...EMPTY_TAX_TYPE });

  // Loading state
  isLoading = signal(false);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private taxTypeService: TaxTypeService
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['id'] && params['id'] !== 'new') {
        this.isEditMode.set(true);
        this.taxTypeId = params['id'];
        this.loadTaxType(this.taxTypeId!);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTaxType(id: string): void {
    this.isLoading.set(true);

    this.taxTypeService.getTaxTypeById(id).subscribe({
      next: (taxType) => {
        this.taxType.set({
          id: taxType.id || id,
          name: taxType.name || '',
          percent: taxType.percent || 0,
          remoteCode: taxType.remoteCode || null
        });
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading tax type:', error);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/admin/tax-types/list']);
  }

  onSave(): void {
    const data = this.taxType();
    const operation = this.isEditMode()
      ? this.taxTypeService.updateTaxType(this.taxTypeId!, data)
      : this.taxTypeService.createTaxType(data);

    operation.subscribe({
      next: () => this.router.navigate(['/admin/tax-types/list']),
      error: (error) => console.error('Error saving tax type:', error)
    });
  }

  onSaveAndContinue(): void {
    console.log('Save and continue:', this.taxType());
  }

  onNameChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.taxType.update(t => ({ ...t, name: input.value }));
  }

  onPercentChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value.replace(',', '.')) || 0;
    this.taxType.update(t => ({ ...t, percent: value }));
  }

  onRemoteCodeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.taxType.update(t => ({ ...t, remoteCode: input.value || null }));
  }

  formatPercent(value: number): string {
    return value.toFixed(2).replace('.', ',');
  }
}
