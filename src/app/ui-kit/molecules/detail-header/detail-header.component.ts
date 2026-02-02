import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, booleanAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../atoms/icon/icon.component';

@Component({
  selector: 'ui-detail-header',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './detail-header.component.html',
  styleUrls: ['./detail-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailHeaderComponent {
  /**
   * Title to display
   */
  @Input() title = '';

  /**
   * Whether we're in edit mode (vs create mode)
   */
  @Input({ transform: booleanAttribute }) isEditMode = false;

  /**
   * Text for the entity type (used for auto-generating title)
   * e.g., 'account' -> 'Account detail' (edit) or 'New account' (create)
   */
  @Input() entityName = '';

  /**
   * Whether to show the "Save and continue" button
   */
  @Input({ transform: booleanAttribute }) showSaveAndContinue = true;

  /**
   * Whether to show the "Discard changes" button
   */
  @Input({ transform: booleanAttribute }) showDiscard = false;

  /**
   * Label for save button
   */
  @Input() saveLabel = 'Save';

  /**
   * Label for save and continue button
   */
  @Input() saveAndContinueLabel = 'Save and continue';

  /**
   * Label for discard button
   */
  @Input() discardLabel = 'Discard changes';

  /**
   * Whether save is in progress
   */
  @Input({ transform: booleanAttribute }) isSaving = false;

  // Events
  @Output() back = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
  @Output() saveAndContinue = new EventEmitter<void>();
  @Output() discard = new EventEmitter<void>();

  get displayTitle(): string {
    if (this.title) {
      return this.title;
    }
    if (this.entityName) {
      return this.isEditMode
        ? `${this.capitalize(this.entityName)} detail`
        : `New ${this.entityName.toLowerCase()}`;
    }
    return this.isEditMode ? 'Edit' : 'New';
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  onBack(): void {
    this.back.emit();
  }

  onSave(): void {
    this.save.emit();
  }

  onSaveAndContinue(): void {
    this.saveAndContinue.emit();
  }

  onDiscard(): void {
    this.discard.emit();
  }
}
