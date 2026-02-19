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
import { TaxType } from '@core/models/tax-type.model';
import { TaxTypeService } from '@core/services/http/tax-type.service';
import { ToastService } from '@app/ui-kit/organisms/toast-container/toast-container.component';

interface TaxTypeDetail {
  id: number;
  name: string;
  percent: string;
  remoteId: number | null;
  remoteCode: string | null;
  isActive: boolean;
}

const EMPTY_TAX_TYPE: TaxTypeDetail = {
  id: 0,
  name: '',
  percent: '0',
  remoteId: null,
  remoteCode: null,
  isActive: true
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
  private toastService = inject(ToastService);

  // Mode
  isEditMode = signal(false);
  taxTypeId: string | null = null;

  // Data
  taxType = signal<TaxTypeDetail>({ ...EMPTY_TAX_TYPE });

  // Loading state
  isLoading = signal(false);

  // Validation state
  touched = signal<Record<string, boolean>>({});
  errors = computed(() => {
    const taxType = this.taxType();
    const errs: Record<string, string> = {};
    if (!taxType.name?.trim()) errs['name'] = 'Name is required';
    const percentNum = parseFloat(taxType.percent);
    if (taxType.percent === '' || taxType.percent === null || isNaN(percentNum)) {
      errs['percent'] = 'Percent is required';
    } else if (percentNum < 0) {
      errs['percent'] = 'Percent must be zero or positive';
    }
    return errs;
  });
  isValid = computed(() => Object.keys(this.errors()).length === 0);

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
          id: taxType.id || Number(id),
          name: taxType.name || '',
          percent: taxType.percent ?? '0',
          remoteId: taxType.remoteId ?? null,
          remoteCode: taxType.remoteCode || null,
          isActive: taxType.isActive ?? true
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

  // Validation helpers
  markAllTouched(): void {
    this.touched.set({ name: true, percent: true });
  }

  markFieldTouched(field: string): void {
    this.touched.update(t => ({ ...t, [field]: true }));
  }

  getError(field: string): string {
    return this.touched()[field] ? (this.errors()[field] || '') : '';
  }

  onSave(): void {
    this.saveTaxType(false);
  }

  onSaveAndContinue(): void {
    this.saveTaxType(true);
  }

  private saveTaxType(navigateToList: boolean): void {
    this.markAllTouched();
    if (!this.isValid()) {
      this.cdr.markForCheck();
      return;
    }

    const detail = this.taxType();

    // Build payload with only writable fields — never send id
    const data: Record<string, unknown> = {
      name: detail.name,
      percent: String(parseFloat(detail.percent) || 0),
      remoteCode: detail.remoteCode
    };

    const isCreating = !this.isEditMode();
    const operation = isCreating
      ? this.taxTypeService.createTaxType(data as any)
      : this.taxTypeService.updateTaxType(this.taxTypeId!, data as any);

    operation.subscribe({
      next: (result) => {
        this.toastService.success('Saved successfully');
        if (navigateToList) {
          this.router.navigate(['/admin/tax-types/list']);
        } else if (isCreating && result?.id) {
          this.router.navigate(['/admin/tax-types', result.id, 'edit']);
        }
      },
      error: (error) => {
        console.error('Error saving tax type:', error);
        this.toastService.error('Failed to save tax type');
      }
    });
  }

  onNameChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.taxType.update(t => ({ ...t, name: input.value }));
    this.markFieldTouched('name');
  }

  onPercentChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.taxType.update(t => ({ ...t, percent: input.value }));
    this.markFieldTouched('percent');
  }

  onRemoteCodeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.taxType.update(t => ({ ...t, remoteCode: input.value || null }));
  }

}
