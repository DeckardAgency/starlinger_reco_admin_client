import { Component, ChangeDetectionStrategy, Input, ContentChild, TemplateRef, HostBinding, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

export type FormFieldLayout = 'vertical' | 'horizontal';

/**
 * Form field component with CSS custom properties for styling customization.
 *
 * Available CSS custom properties (set on parent or via inputs):
 * --form-field-label-color: Label text color (default: #232323)
 * --form-field-label-weight: Label font weight (default: 500)
 *
 * Note: Uses ViewEncapsulation.None to style projected content (inputs, selects, textareas)
 */
@Component({
  selector: 'ui-form-field',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-field.component.html',
  styleUrls: ['./form-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class FormFieldComponent {
  @Input() label = '';
  @Input() hint = '';
  @Input() error = '';
  @Input() required = false;
  @Input() name = '';
  @Input() layout: FormFieldLayout = 'vertical';
  @Input() labelWidth = '133px';

  // Styling inputs - these set CSS custom properties on the host element
  @Input() labelColor?: string;
  @Input() labelWeight?: string | number;

  @HostBinding('style.--form-field-label-color')
  get labelColorStyle() { return this.labelColor; }

  @HostBinding('style.--form-field-label-weight')
  get labelWeightStyle() { return this.labelWeight; }

  @ContentChild('prefix') prefixTemplate?: TemplateRef<unknown>;
  @ContentChild('suffix') suffixTemplate?: TemplateRef<unknown>;

  get fieldId(): string {
    return this.name || `field-${Math.random().toString(36).substr(2, 9)}`;
  }

  get containerClasses(): string[] {
    const classes = ['ui-form-field', `ui-form-field--${this.layout}`];
    if (this.error) {
      classes.push('ui-form-field--error');
    }
    return classes;
  }
}
