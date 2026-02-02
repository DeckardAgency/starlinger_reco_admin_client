import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import {
    trigger,
    style,
    animate,
    transition
} from '@angular/animations';

export type ConfirmationType = 'simple' | 'type-text' | 'type-email';
export type ButtonStyle = 'primary' | 'danger' | 'warning';

@Component({
    selector: 'app-confirmation-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './confirmation-modal.component.html',
    styleUrls: ['./confirmation-modal.component.scss'],
    animations: [
        trigger('modalOverlay', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('200ms ease-out', style({ opacity: 1 }))
            ]),
            transition(':leave', [
                animate('200ms ease-in', style({ opacity: 0 }))
            ])
        ]),
        trigger('modalContent', [
            transition(':enter', [
                style({ opacity: 0, transform: 'scale(0.9) translateY(20px)' }),
                animate('300ms cubic-bezier(0.34, 1.56, 0.64, 1)', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
            ]),
            transition(':leave', [
                animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.95) translateY(10px)' }))
            ])
        ])
    ]
})
export class ConfirmationModalComponent implements OnChanges {
    private fb = inject(FormBuilder);

    @Input() isOpen = false;
    @Input() title = 'Confirm Action';
    @Input() message = 'Are you sure you want to proceed?';
    @Input() confirmationType: ConfirmationType = 'simple';
    @Input() confirmationText = ''; // Text user must type to confirm (for type-text or type-email)
    @Input() confirmButtonText = 'Confirm';
    @Input() cancelButtonText = 'Cancel';
    @Input() buttonStyle: ButtonStyle = 'danger';
    @Input() loading = false;
    @Input() icon: 'warning' | 'danger' | 'info' | 'lock' = 'warning';

    @Output() closeModal = new EventEmitter<void>();
    @Output() confirm = new EventEmitter<void>();

    confirmationForm: FormGroup = this.fb.group({
        confirmationInput: ['']
    });

    // Expose the form control with proper typing
    get confirmationInputControl(): FormControl {
        return this.confirmationForm.get('confirmationInput') as FormControl;
    }

    ngOnChanges(changes: SimpleChanges): void {
        // Reset form when modal opens
        if (changes['isOpen'] && this.isOpen) {
            this.confirmationForm.reset({ confirmationInput: '' });
            this.updateValidators();
        }

        // Update validators when confirmation text changes
        if (changes['confirmationText'] || changes['confirmationType']) {
            this.updateValidators();
        }
    }

    private updateValidators(): void {
        const control = this.confirmationForm.get('confirmationInput');
        if (!control) return;

        if (this.confirmationType === 'simple') {
            control.clearValidators();
        } else {
            control.setValidators([
                Validators.required,
                this.matchValidator()
            ]);
        }
        control.updateValueAndValidity();
    }

    private matchValidator() {
        return (control: AbstractControl): ValidationErrors | null => {
            const value = control.value?.trim() || '';
            const expected = this.confirmationText?.trim() || '';

            if (this.confirmationType === 'type-email') {
                // Case-insensitive match for email
                return value.toLowerCase() === expected.toLowerCase() ? null : { mismatch: true };
            }
            // Exact match for text
            return value === expected ? null : { mismatch: true };
        };
    }

    onClose(): void {
        if (!this.loading) {
            this.closeModal.emit();
        }
    }

    onConfirm(): void {
        if (this.loading) return;

        if (this.confirmationType !== 'simple') {
            if (!this.confirmationForm.valid) {
                this.confirmationForm.get('confirmationInput')?.markAsTouched();
                return;
            }
        }

        this.confirm.emit();
    }

    get isConfirmDisabled(): boolean {
        if (this.loading) return true;

        if (this.confirmationType === 'simple') {
            return false;
        }

        return this.confirmationForm.invalid;
    }

    get inputPlaceholder(): string {
        if (this.confirmationType === 'type-email') {
            return 'Type email address to confirm';
        }
        return `Type "${this.confirmationText}" to confirm`;
    }

    get inputLabel(): string {
        if (this.confirmationType === 'type-email') {
            return `Type the user's email address to confirm:`;
        }
        return `Type "${this.confirmationText}" to confirm:`;
    }

    hasError(): boolean {
        const control = this.confirmationForm.get('confirmationInput');
        return !!(control && control.invalid && control.touched && control.value);
    }

    getErrorMessage(): string {
        const control = this.confirmationForm.get('confirmationInput');
        if (!control || !control.errors) return '';

        if (control.errors['required']) {
            return 'This field is required';
        }
        if (control.errors['mismatch']) {
            if (this.confirmationType === 'type-email') {
                return 'Email address does not match';
            }
            return 'Text does not match';
        }
        return '';
    }

    getIconSvg(): string {
        switch (this.icon) {
            case 'danger':
                return `<circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>`;
            case 'warning':
                return `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>`;
            case 'info':
                return `<circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>`;
            case 'lock':
                return `<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>`;
            default:
                return '';
        }
    }
}
