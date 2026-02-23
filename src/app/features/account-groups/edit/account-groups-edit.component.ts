import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ToggleComponent } from '@app/ui-kit/atoms/toggle/toggle.component';
import { FormFieldComponent } from '@app/ui-kit/molecules/form-field/form-field.component';
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { DetailHeaderComponent } from '@app/ui-kit/molecules/detail-header/detail-header.component';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';
import { ToastService } from '@app/ui-kit/organisms/toast-container/toast-container.component';
import { AccountGroupService } from '@core/services/http/account-group.service';

interface AccountGroupDetail {
  id: number;
  name: string;
  isActive: boolean;
}

const EMPTY_ACCOUNT_GROUP: AccountGroupDetail = {
  id: 0,
  name: '',
  isActive: true
};

@Component({
  selector: 'app-account-groups-edit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ToggleComponent,
    FormFieldComponent,
    BreadcrumbsComponent,
    DetailHeaderComponent,
    MobileFooterComponent
  ],
  templateUrl: './account-groups-edit.component.html',
  styleUrls: ['./account-groups-edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountGroupsEditComponent implements OnInit, OnDestroy {
  private toastService = inject(ToastService);
  private destroy$ = new Subject<void>();

  isEditMode = signal(false);
  accountGroupId: string | null = null;

  accountGroup = signal<AccountGroupDetail>({ ...EMPTY_ACCOUNT_GROUP });
  isLoading = signal(false);

  touched = signal<Record<string, boolean>>({});
  errors = computed(() => {
    const group = this.accountGroup();
    const errs: Record<string, string> = {};
    if (!group.name?.trim()) errs['name'] = 'Name is required';
    return errs;
  });
  isValid = computed(() => Object.keys(this.errors()).length === 0);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private accountGroupService: AccountGroupService
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['id'] && params['id'] !== 'new') {
        this.isEditMode.set(true);
        this.accountGroupId = params['id'];
        this.loadAccountGroup(this.accountGroupId!);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAccountGroup(id: string | number): void {
    this.isLoading.set(true);

    this.accountGroupService.getAccountGroupById(String(id)).subscribe({
      next: (group) => {
        this.accountGroup.set({
          id: group.id || Number(id),
          name: group.name || '',
          isActive: group.isActive ?? true
        });
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading account group:', error);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/admin/client-groups/list']);
  }

  markAllTouched(): void {
    this.touched.set({ name: true });
  }

  markFieldTouched(field: string): void {
    this.touched.update(t => ({ ...t, [field]: true }));
  }

  getError(field: string): string {
    return this.touched()[field] ? (this.errors()[field] || '') : '';
  }

  onActiveChange(active: boolean): void {
    this.accountGroup.update(g => ({ ...g, isActive: active }));
  }

  onNameChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.accountGroup.update(g => ({ ...g, name: input.value }));
    this.markFieldTouched('name');
  }

  onSave(): void {
    this.saveAccountGroup(false);
  }

  onSaveAndContinue(): void {
    this.saveAccountGroup(true);
  }

  private saveAccountGroup(navigateToList: boolean): void {
    this.markAllTouched();
    if (!this.isValid()) {
      this.cdr.markForCheck();
      return;
    }

    const detail = this.accountGroup();
    const data: Record<string, unknown> = {
      name: detail.name,
      isActive: detail.isActive
    };

    const isCreating = !this.isEditMode();
    const operation = isCreating
      ? this.accountGroupService.createAccountGroup(data as any)
      : this.accountGroupService.updateAccountGroup(this.accountGroupId!, data as any);

    operation.subscribe({
      next: (result) => {
        this.toastService.success('Saved successfully');
        if (navigateToList) {
          this.router.navigate(['/admin/client-groups/list']);
        } else if (isCreating && result?.id) {
          this.router.navigate(['/admin/client-groups', result.id, 'edit']);
        }
      },
      error: (error) => {
        console.error('Error saving account group:', error);
        this.toastService.error('Failed to save account group');
      }
    });
  }
}
