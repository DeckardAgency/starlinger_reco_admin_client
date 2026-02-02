import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
    trigger,
    style,
    animate,
    transition
} from '@angular/animations';

@Component({
    selector: 'app-cancellation-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './cancellation-modal.component.html',
    styleUrls: ['./cancellation-modal.component.scss'],
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
export class CancellationModalComponent implements OnChanges {
    private fb = inject(FormBuilder);

    @Input() isOpen = false;
    @Input() itemNumber = '';
    @Input() itemType: 'order' | 'inquiry' = 'order';
    @Input() saving = false;

    @Output() closeModal = new EventEmitter<void>();
    @Output() confirmCancellation = new EventEmitter<string>();

    cancellationForm: FormGroup = this.fb.group({
        cancellationReason: ['', [Validators.required, Validators.minLength(10)]]
    });

    ngOnChanges(changes: SimpleChanges): void {
        // Reset form when modal opens
        if (changes['isOpen'] && this.isOpen) {
            this.cancellationForm.reset({ cancellationReason: '' });
        }
    }

    onClose(): void {
        this.closeModal.emit();
    }

    onSubmit(): void {
        if (!this.cancellationForm.valid || this.saving) {
            // Mark all fields as touched to show validation errors
            Object.keys(this.cancellationForm.controls).forEach(key => {
                this.cancellationForm.get(key)?.markAsTouched();
            });
            return;
        }

        const reason = this.cancellationForm.get('cancellationReason')?.value;
        this.confirmCancellation.emit(reason);
    }

    hasError(fieldName: string): boolean {
        const control = this.cancellationForm.get(fieldName);
        return !!(control && control.invalid && control.touched);
    }

    getErrorMessage(fieldName: string): string {
        const control = this.cancellationForm.get(fieldName);
        if (!control || !control.errors) return '';

        if (control.errors['required']) {
            return 'Cancellation reason is required';
        }
        if (control.errors['minlength']) {
            return `Reason must be at least ${control.errors['minlength'].requiredLength} characters`;
        }
        return '';
    }
}
