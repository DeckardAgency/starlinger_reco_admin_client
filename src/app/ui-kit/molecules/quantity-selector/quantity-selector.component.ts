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
import { IconComponent } from '../../atoms/icon/icon.component';

export type QuantitySelectorSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-quantity-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './quantity-selector.component.html',
  styleUrls: ['./quantity-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => QuantitySelectorComponent),
      multi: true
    }
  ]
})
export class QuantitySelectorComponent implements ControlValueAccessor {
  @Input() size: QuantitySelectorSize = 'md';
  @Input() min = 1;
  @Input() max = 999;
  @Input() step = 1;
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input({ transform: booleanAttribute }) readonly = false;
  @Input({ transform: booleanAttribute }) showInput = true;

  @Input()
  set value(val: number) {
    this._value.set(this.clampValue(val ?? this.min));
  }
  get value(): number {
    return this._value();
  }

  @Output() quantityChange = new EventEmitter<number>();

  protected _value = signal(1);

  protected canDecrement = computed(() => this._value() > this.min);
  protected canIncrement = computed(() => this._value() < this.max);

  private onChange: (value: number) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: number): void {
    this._value.set(this.clampValue(value ?? this.min));
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  increment(): void {
    if (this.disabled || !this.canIncrement()) return;

    const newValue = this.clampValue(this._value() + this.step);
    this.updateValue(newValue);
  }

  decrement(): void {
    if (this.disabled || !this.canDecrement()) return;

    const newValue = this.clampValue(this._value() - this.step);
    this.updateValue(newValue);
  }

  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const numValue = parseInt(target.value, 10);

    if (!isNaN(numValue)) {
      const newValue = this.clampValue(numValue);
      this.updateValue(newValue);
    }
  }

  onBlur(): void {
    this.onTouched();
  }

  private updateValue(newValue: number): void {
    this._value.set(newValue);
    this.onChange(newValue);
    this.quantityChange.emit(newValue);
  }

  private clampValue(value: number): number {
    return Math.min(Math.max(value, this.min), this.max);
  }

  get containerClasses(): string[] {
    const classes = ['ui-quantity-selector', `ui-quantity-selector--${this.size}`];

    if (this.disabled) {
      classes.push('ui-quantity-selector--disabled');
    }

    return classes;
  }
}
