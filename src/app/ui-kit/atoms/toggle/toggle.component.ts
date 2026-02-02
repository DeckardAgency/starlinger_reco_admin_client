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
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

export type ToggleSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toggle.component.html',
  styleUrls: ['./toggle.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ToggleComponent),
      multi: true
    }
  ]
})
export class ToggleComponent implements ControlValueAccessor {
  @Input() size: ToggleSize = 'md';
  @Input() label = '';
  @Input() labelPosition: 'left' | 'right' = 'right';
  @Input() name = '';
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input({ transform: booleanAttribute })
  set checked(value: boolean) {
    this._checked.set(value);
  }
  get checked(): boolean {
    return this._checked();
  }

  @Output() toggleChange = new EventEmitter<boolean>();

  protected _checked = signal(false);

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

  onToggle(): void {
    if (this.disabled) return;

    this._checked.update(v => !v);
    this.onChange(this._checked());
    this.onTouched();
    this.toggleChange.emit(this._checked());
  }

  get containerClasses(): string[] {
    const classes = [
      'ui-toggle',
      `ui-toggle--${this.size}`,
      `ui-toggle--label-${this.labelPosition}`
    ];

    if (this.disabled) {
      classes.push('ui-toggle--disabled');
    }

    return classes;
  }

  get switchClasses(): string[] {
    const classes = ['ui-toggle__switch'];

    if (this._checked()) {
      classes.push('ui-toggle__switch--checked');
    }

    return classes;
  }
}
