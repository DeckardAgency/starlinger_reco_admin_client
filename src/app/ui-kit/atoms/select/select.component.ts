import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  booleanAttribute,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export type SelectSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true
    }
  ]
})
export class SelectComponent implements ControlValueAccessor {
  @Input() options: SelectOption[] = [];
  @Input() size: SelectSize = 'md';
  @Input() placeholder = 'Select an option';
  @Input() label = '';
  @Input() hint = '';
  @Input() error = '';
  @Input() name = '';
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input({ transform: booleanAttribute }) required = false;

  @Output() selectChange = new EventEmitter<string | number>();

  protected value = signal<string | number>('');
  protected focused = signal(false);

  protected selectClasses = computed(() => {
    const classes = [
      'ui-select__field',
      `ui-select__field--${this.size}`
    ];

    if (this.error) {
      classes.push('ui-select__field--error');
    }

    if (this.focused()) {
      classes.push('ui-select__field--focused');
    }

    if (this.disabled) {
      classes.push('ui-select__field--disabled');
    }

    if (!this.value()) {
      classes.push('ui-select__field--placeholder');
    }

    return classes;
  });

  // ControlValueAccessor implementation
  private onChange: (value: string | number) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | number): void {
    this.value.set(value || '');
  }

  registerOnChange(fn: (value: string | number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onSelectChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const selectedValue = target.value;
    this.value.set(selectedValue);
    this.onChange(selectedValue);
    this.selectChange.emit(selectedValue);
  }

  onFocus(): void {
    this.focused.set(true);
  }

  onBlur(): void {
    this.focused.set(false);
    this.onTouched();
  }
}
