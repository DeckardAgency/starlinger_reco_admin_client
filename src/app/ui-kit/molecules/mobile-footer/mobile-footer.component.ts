import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';

@Component({
  selector: 'ui-mobile-footer',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './mobile-footer.component.html',
  styleUrls: ['./mobile-footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MobileFooterComponent {
  @Input() primaryLabel = 'Save';
  @Input() primaryIcon = 'save';
  @Input() secondaryLabel = 'Save and continue';
  @Input() secondaryIcon = 'chevron-right';
  @Input() showSecondary = true;

  @Output() primaryClick = new EventEmitter<void>();
  @Output() secondaryClick = new EventEmitter<void>();

  onPrimaryClick(): void {
    this.primaryClick.emit();
  }

  onSecondaryClick(): void {
    this.secondaryClick.emit();
  }
}
