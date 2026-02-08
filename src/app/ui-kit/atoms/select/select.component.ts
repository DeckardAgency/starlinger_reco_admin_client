import {
  Component,
  ChangeDetectionStrategy,
  forwardRef,
  signal,
  computed,
  input,
  output,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export type SelectSize = 'sm' | 'md' | 'lg';
export type SelectVariant = 'default' | 'pill';

@Component({
  selector: 'ui-select',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
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
  // Signal inputs
  options = input<SelectOption[]>([]);
  size = input<SelectSize>('md');
  variant = input<SelectVariant>('default');
  placeholder = input<string>('Select an option');
  label = input<string>('');
  hint = input<string>('');
  error = input<string>('');
  name = input<string>('');
  disabled = input<boolean>(false);
  required = input<boolean>(false);
  clearable = input<boolean>(false);
  value = input<string | number>('');

  // Signal outputs
  selectChange = output<string | number>();
  cleared = output<void>();

  // Internal state
  protected _value = signal<string | number>('');
  protected _disabled = signal(false);
  protected focused = signal(false);

  constructor() {
    // Sync external value input with internal _value signal
    effect(() => {
      const externalValue = this.value();
      if (externalValue !== this._value()) {
        this._value.set(externalValue || '');
      }
    });

    // Sync external disabled input with internal _disabled signal
    effect(() => {
      this._disabled.set(this.disabled());
    });
  }

  protected selectClasses = computed(() => {
    const classes = [
      'ui-select__field',
      `ui-select__field--${this.size()}`
    ];

    if (this.error()) {
      classes.push('ui-select__field--error');
    }

    if (this.focused()) {
      classes.push('ui-select__field--focused');
    }

    if (this._disabled()) {
      classes.push('ui-select__field--disabled');
    }

    if (!this._value()) {
      classes.push('ui-select__field--placeholder');
    }

    if (this.variant() === 'pill') {
      classes.push('ui-select__field--pill');
    }

    return classes;
  });

  protected selectedLabel = computed(() => {
    const val = this._value();
    if (!val) return '';
    const option = this.options().find(o => o.value === val);
    return option?.label ?? String(val);
  });

  // ControlValueAccessor implementation
  private onChange: (value: string | number) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(val: string | number): void {
    this._value.set(val || '');
  }

  registerOnChange(fn: (value: string | number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._disabled.set(isDisabled);
  }

  onSelectChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const selectedValue = target.value;
    this._value.set(selectedValue);
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

  onClear(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this._value.set('');
    this.onChange('');
    this.selectChange.emit('');
    this.cleared.emit();
  }
}
