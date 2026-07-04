import {
  Component,
  ChangeDetectionStrategy,
  forwardRef,
  signal,
  computed,
  input,
  output,
  effect,
  ElementRef,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';
import { trigger, state, style, transition, animate } from '@angular/animations';

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
  ],
  animations: [
    trigger('dropdownAnimation', [
      state('void', style({
        opacity: 0,
        transform: 'translateY(-4px)'
      })),
      state('*', style({
        opacity: 1,
        transform: 'translateY(0)'
      })),
      transition('void => *', [
        animate('150ms cubic-bezier(0.4, 0, 0.2, 1)')
      ]),
      transition('* => void', [
        animate('100ms cubic-bezier(0.4, 0, 0.2, 1)')
      ])
    ])
  ]
})
export class SelectComponent implements ControlValueAccessor {
  private elementRef = inject(ElementRef);

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
  searchable = input<boolean>(false);
  multiple = input<boolean>(false);

  // Signal outputs
  selectChange = output<string | number>();
  cleared = output<void>();
  /** Emits the raw search text so parents can do server-side lookups. */
  searchChange = output<string>();

  // Internal state
  protected _value = signal<string | number>('');
  protected _multiValues = signal<(string | number)[]>([]);
  protected _disabled = signal(false);
  protected isOpen = signal(false);
  protected searchText = signal('');

  constructor() {
    effect(() => {
      const externalValue = this.value();
      if (externalValue !== this._value()) {
        this._value.set(externalValue || '');
      }
    });

    effect(() => {
      this._disabled.set(this.disabled());
    });

    // Attach the outside-click listener only while the dropdown is open,
    // instead of a permanent document-level HostListener per select.
    effect((onCleanup) => {
      if (!this.isOpen()) {
        return;
      }
      const handler = (event: Event) => {
        if (!this.elementRef.nativeElement.contains(event.target)) {
          this.isOpen.set(false);
        }
      };
      document.addEventListener('click', handler);
      onCleanup(() => document.removeEventListener('click', handler));
    });
  }

  protected filteredOptions = computed(() => {
    const search = this.searchText().toLowerCase().trim();
    if (!search) return this.options();
    return this.options().filter(o => o.label.toLowerCase().includes(search));
  });

  protected selectedLabel = computed(() => {
    const val = this._value();
    if (!val && val !== 0) return '';
    const option = this.options().find(o => String(o.value) === String(val));
    return option?.label ?? String(val);
  });

  protected selectedLabels = computed(() => {
    const vals = this._multiValues();
    return vals.map(v => {
      const opt = this.options().find(o => String(o.value) === String(v));
      return opt?.label ?? String(v);
    });
  });

  protected hasValue = computed(() => {
    if (this.multiple()) return this._multiValues().length > 0;
    const val = this._value();
    return val !== '' && val !== null && val !== undefined;
  });

  protected fieldClasses = computed(() => {
    const classes = ['ui-select__trigger', `ui-select__trigger--${this.size()}`];
    if (this.error()) classes.push('ui-select__trigger--error');
    if (this._disabled()) classes.push('ui-select__trigger--disabled');
    if (this.isOpen()) classes.push('ui-select__trigger--open');
    if (!this.hasValue()) classes.push('ui-select__trigger--placeholder');
    if (this.variant() === 'pill') {
      classes.push('ui-select__trigger--pill');
      if (this.multiple()) classes.push('ui-select__trigger--pill-multi');
    }
    return classes;
  });

  // ControlValueAccessor
  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(val: any): void {
    if (this.multiple() && Array.isArray(val)) {
      this._multiValues.set(val);
    } else {
      this._value.set(val || '');
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._disabled.set(isDisabled);
  }

  toggleDropdown(): void {
    if (this._disabled()) return;
    const willOpen = !this.isOpen();
    this.isOpen.set(willOpen);
    if (willOpen) {
      this.searchText.set('');
      if (this.searchable()) {
        // Keep server-side lookups in sync with the cleared search box.
        this.searchChange.emit('');
      }
    } else {
      this.onTouched();
    }
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchText.set(value);
    this.searchChange.emit(value);
  }

  selectOption(option: SelectOption): void {
    if (this._disabled() || option.disabled) return;

    if (this.multiple()) {
      const current = [...this._multiValues()];
      const idx = current.findIndex(v => String(v) === String(option.value));
      if (idx > -1) {
        current.splice(idx, 1);
      } else {
        current.push(option.value);
      }
      this._multiValues.set(current);
      this.onChange(current);
      this.selectChange.emit(option.value);
    } else {
      this._value.set(option.value);
      this.onChange(option.value);
      this.selectChange.emit(option.value);
      this.isOpen.set(false);
      this.onTouched();
    }
  }

  isSelected(option: SelectOption): boolean {
    if (this.multiple()) {
      return this._multiValues().some(v => String(v) === String(option.value));
    }
    return String(this._value()) === String(option.value);
  }

  onClear(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    if (this.multiple()) {
      this._multiValues.set([]);
      this.onChange([]);
    } else {
      this._value.set('');
      this.onChange('');
    }
    this.selectChange.emit('');
    this.cleared.emit();
  }

  removeMultiValue(val: string | number, event: Event): void {
    event.stopPropagation();
    const current = this._multiValues().filter(v => String(v) !== String(val));
    this._multiValues.set(current);
    this.onChange(current);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (this._disabled()) return;
    switch (event.key) {
      case 'Enter':
      case ' ':
        if (!this.isOpen()) {
          this.toggleDropdown();
          event.preventDefault();
        }
        break;
      case 'Escape':
        this.isOpen.set(false);
        this.onTouched();
        event.preventDefault();
        break;
      case 'ArrowDown':
        if (!this.isOpen()) {
          this.isOpen.set(true);
          this.searchText.set('');
        }
        event.preventDefault();
        break;
    }
  }
}
