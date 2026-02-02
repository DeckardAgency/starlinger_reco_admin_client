import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '@app/ui-kit/atoms';
import { CardComponent } from '../card/card.component';

export type QuickActionType = 'new-order' | 'contact-sales';

export interface QuickActionCardData {
  type: QuickActionType;
  title: string;
  description: string;
  buttonLabel: string;
  routerLink?: string;
}

@Component({
  selector: 'ui-quick-action-card',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent, CardComponent],
  templateUrl: './quick-action-card.component.html',
  styleUrls: ['./quick-action-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuickActionCardComponent {
  @Input({ required: true }) data!: QuickActionCardData;
  @Output() buttonClick = new EventEmitter<QuickActionType>();

  onButtonClick(): void {
    this.buttonClick.emit(this.data.type);
  }
}
