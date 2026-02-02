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

export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
export type InputSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ]
})
export class InputComponent implements ControlValueAccessor {
  @Input() type: InputType = 'text';
  @Input() size: InputSize = 'md';
  @Input() placeholder = '';
  @Input() label = '';
  @Input() hint = '';
  @Input() error = '';
  @Input() name = '';
  @Input() autocomplete = '';
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input({ transform: booleanAttribute }) readonly = false;
  @Input({ transform: booleanAttribute }) required = false;
  @Input({ transform: booleanAttribute }) showPasswordToggle = false;
  @Input() prefixIcon?: string;
  @Input() suffixIcon?: string;

  @Output() inputChange = new EventEmitter<string>();
  @Output() inputFocus = new EventEmitter<FocusEvent>();
  @Output() inputBlur = new EventEmitter<FocusEvent>();

  protected value = signal('');
  protected focused = signal(false);
  protected passwordVisible = signal(false);

  protected actualType = computed(() => {
    if (this.type === 'password' && this.passwordVisible()) {
      return 'text';
    }
    return this.type;
  });

  protected inputClasses = computed(() => {
    const classes = [
      'ui-input__field',
      `ui-input__field--${this.size}`
    ];

    if (this.error) {
      classes.push('ui-input__field--error');
    }

    if (this.focused()) {
      classes.push('ui-input__field--focused');
    }

    if (this.disabled) {
      classes.push('ui-input__field--disabled');
    }

    if (this.prefixIcon || (this.type === 'password' && this.showPasswordToggle)) {
      classes.push('ui-input__field--has-prefix');
    }

    if (this.suffixIcon) {
      classes.push('ui-input__field--has-suffix');
    }

    return classes;
  });

  // ControlValueAccessor implementation
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.value.set(value || '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value.set(target.value);
    this.onChange(target.value);
    this.inputChange.emit(target.value);
  }

  onFocus(event: FocusEvent): void {
    this.focused.set(true);
    this.inputFocus.emit(event);
  }

  onBlur(event: FocusEvent): void {
    this.focused.set(false);
    this.onTouched();
    this.inputBlur.emit(event);
  }

  togglePasswordVisibility(): void {
    this.passwordVisible.update(v => !v);
  }
}
