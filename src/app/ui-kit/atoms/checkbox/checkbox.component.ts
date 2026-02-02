import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  booleanAttribute,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

export type CheckboxSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-checkbox',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkbox.component.html',
  styleUrls: ['./checkbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true
    }
  ]
})
export class CheckboxComponent implements ControlValueAccessor {
  @Input() size: CheckboxSize = 'md';
  @Input() label = '';
  @Input() name = '';
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input({ transform: booleanAttribute }) indeterminate = false;
  @Input({ transform: booleanAttribute })
  set checked(value: boolean) {
    this._checked.set(value);
  }
  get checked(): boolean {
    return this._checked();
  }

  @Output() checkboxChange = new EventEmitter<boolean>();

  protected _checked = signal(false);

  // ControlValueAccessor implementation
  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: boolean): void {
    this._checked.set(!!value);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onCheckboxChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this._checked.set(target.checked);
    this.onChange(target.checked);
    this.onTouched();
    this.checkboxChange.emit(target.checked);
  }

  get checkboxClasses(): string[] {
    const classes = [
      'ui-checkbox',
      `ui-checkbox--${this.size}`
    ];

    if (this.disabled) {
      classes.push('ui-checkbox--disabled');
    }

    return classes;
  }
}
