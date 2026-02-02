import { Component, ChangeDetectionStrategy, Input, ContentChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export type FormFieldLayout = 'vertical' | 'horizontal';

@Component({
  selector: 'ui-form-field',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-field.component.html',
  styleUrls: ['./form-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormFieldComponent {
  @Input() label = '';
  @Input() hint = '';
  @Input() error = '';
  @Input() required = false;
  @Input() name = '';
  @Input() layout: FormFieldLayout = 'vertical';
  @Input() labelWidth = '133px';

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
