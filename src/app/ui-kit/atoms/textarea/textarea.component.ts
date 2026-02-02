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

export type TextareaSize = 'sm' | 'md' | 'lg';
export type TextareaResize = 'none' | 'vertical' | 'horizontal' | 'both';

@Component({
  selector: 'ui-textarea',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './textarea.component.html',
  styleUrls: ['./textarea.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaComponent),
      multi: true
    }
  ]
})
export class TextareaComponent implements ControlValueAccessor {
  @Input() size: TextareaSize = 'md';
  @Input() placeholder = '';
  @Input() label = '';
  @Input() hint = '';
  @Input() error = '';
  @Input() name = '';
  @Input() rows = 4;
  @Input() maxLength?: number;
  @Input() resize: TextareaResize = 'vertical';
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input({ transform: booleanAttribute }) readonly = false;
  @Input({ transform: booleanAttribute }) required = false;
  @Input({ transform: booleanAttribute }) showCharCount = false;

  @Output() textareaChange = new EventEmitter<string>();
  @Output() textareaFocus = new EventEmitter<FocusEvent>();
  @Output() textareaBlur = new EventEmitter<FocusEvent>();

  protected value = signal('');
  protected focused = signal(false);

  protected charCount = computed(() => this.value().length);

  protected textareaClasses = computed(() => {
    const classes = [
      'ui-textarea__field',
      `ui-textarea__field--${this.size}`,
      `ui-textarea__field--resize-${this.resize}`
    ];

    if (this.error) {
      classes.push('ui-textarea__field--error');
    }

    if (this.focused()) {
      classes.push('ui-textarea__field--focused');
    }

    if (this.disabled) {
      classes.push('ui-textarea__field--disabled');
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
    const target = event.target as HTMLTextAreaElement;
    this.value.set(target.value);
    this.onChange(target.value);
    this.textareaChange.emit(target.value);
  }

  onFocus(event: FocusEvent): void {
    this.focused.set(true);
    this.textareaFocus.emit(event);
  }

  onBlur(event: FocusEvent): void {
    this.focused.set(false);
    this.onTouched();
    this.textareaBlur.emit(event);
  }
}
