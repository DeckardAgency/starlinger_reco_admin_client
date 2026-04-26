import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  booleanAttribute
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';
import { ToggleComponent } from '@app/ui-kit/atoms/toggle/toggle.component';
import { FormFieldComponent } from '@app/ui-kit/molecules/form-field/form-field.component';

export interface AddressFormData {
  id?: number | string;
  street: string;
  city: string;
  postalCode: string;
  countryId: string;
  isBilling: boolean;
  isDelivery: boolean;
}

export interface CountryOption {
  id: number;
  name: string;
  code: string;
}

export interface ExistingAddress {
  id: number;
  street: string;
  city: string;
  isBilling: boolean;
  isDelivery: boolean;
}

@Component({
  selector: 'app-address-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ToggleComponent,
    FormFieldComponent
  ],
  templateUrl: './address-modal.component.html',
  styleUrls: ['./address-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('modalOverlay', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('modalContent', [
      transition(':enter', [
        style({ transform: 'translateY(-24px) scale(0.95)', opacity: 0 }),
        animate('250ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateY(0) scale(1)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ transform: 'translateY(-16px) scale(0.98)', opacity: 0 }))
      ])
    ])
  ]
})
export class AddressModalComponent implements OnChanges {
  @Input({ transform: booleanAttribute }) isOpen = false;
  @Input() address: AddressFormData | null = null;
  @Input() existingAddresses: ExistingAddress[] = [];
  @Input() countries: CountryOption[] = [];
  @Input({ transform: booleanAttribute }) saving = false;

  @Output() closeModal = new EventEmitter<void>();
  @Output() saveAddress = new EventEmitter<AddressFormData>();

  addressForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.addressForm = this.fb.group({
      street: ['', [Validators.required, Validators.minLength(3)]],
      city: ['', [Validators.required, Validators.minLength(2)]],
      postalCode: [''],
      countryId: ['', [Validators.required]],
      isBilling: [false],
      isDelivery: [false]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      if (this.address) {
        this.addressForm.patchValue({
          street: this.address.street || '',
          city: this.address.city || '',
          postalCode: this.address.postalCode || '',
          countryId: this.address.countryId || '',
          isBilling: this.address.isBilling || false,
          isDelivery: this.address.isDelivery || false
        });
      } else {
        this.addressForm.reset({
          street: '',
          city: '',
          postalCode: '',
          countryId: '',
          isBilling: false,
          isDelivery: false
        });
      }
    }
  }

  get isEditMode(): boolean {
    return this.address !== null && this.address.id !== undefined;
  }

  get title(): string {
    return this.isEditMode ? 'Edit address' : 'Add new address';
  }

  hasError(field: string): boolean {
    const control = this.addressForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  getError(field: string): string {
    const control = this.addressForm.get(field);
    if (control && control.errors && control.touched) {
      if (control.errors['required']) {
        return `${this.getFieldLabel(field)} is required`;
      }
      if (control.errors['minlength']) {
        return `${this.getFieldLabel(field)} must be at least ${control.errors['minlength'].requiredLength} characters`;
      }
    }
    return '';
  }

  private getFieldLabel(field: string): string {
    const labels: Record<string, string> = {
      street: 'Street',
      city: 'City',
      postalCode: 'Postal code',
      countryId: 'Country'
    };
    return labels[field] || field;
  }

  get billingWarning(): string | null {
    if (!this.addressForm.get('isBilling')?.value) return null;
    const currentId = this.address?.id;
    const existing = this.existingAddresses.find(a => a.isBilling && a.id !== currentId);
    if (!existing) return null;
    return `"${existing.street}, ${existing.city}" is currently the billing address and will be overridden.`;
  }

  onBillingChange(value: boolean): void {
    this.addressForm.patchValue({ isBilling: value });
  }

  onDeliveryChange(value: boolean): void {
    this.addressForm.patchValue({ isDelivery: value });
  }

  onClose(): void {
    this.closeModal.emit();
  }

  onSave(): void {
    if (this.addressForm.invalid) {
      Object.keys(this.addressForm.controls).forEach(key => {
        this.addressForm.get(key)?.markAsTouched();
      });
      return;
    }

    const formData: AddressFormData = {
      ...this.addressForm.value
    };

    if (this.address?.id !== undefined) {
      formData.id = this.address.id;
    }

    this.saveAddress.emit(formData);
  }
}
