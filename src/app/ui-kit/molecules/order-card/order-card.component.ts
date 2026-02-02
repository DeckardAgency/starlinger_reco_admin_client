import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BadgeComponent, ButtonComponent, BadgeVariant } from '@app/ui-kit/atoms';
import { CardComponent } from '../card/card.component';

export type OrderCardType = 'order' | 'inquiry';
export type OrderCardStatus = 
  | 'submitted' 
  | 'in-review' 
  | 'in-progress' 
  | 'more-info' 
  | 'confirmed'
  | 'in-transit' 
  | 'dispatched'
  | 'completed'
  | 'cancelled'
  | 'draft';

export interface OrderCardData {
  id: string;
  type: OrderCardType;
  internalReference: string;
  dateCreated: string;
  partsOrdered: number;
  status: OrderCardStatus;
}

@Component({
  selector: 'ui-order-card',
  standalone: true,
  imports: [CommonModule, RouterModule, BadgeComponent, ButtonComponent, CardComponent],
  templateUrl: './order-card.component.html',
  styleUrls: ['./order-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderCardComponent {
  @Input({ required: true }) data!: OrderCardData;
  @Input() routePrefix: string = '/admin';

  getStatusLabel(status: OrderCardStatus): string {
    const labels: Record<OrderCardStatus, string> = {
      'submitted': 'Submitted',
      'in-review': 'In review',
      'in-progress': 'In progress',
      'more-info': 'More info',
      'confirmed': 'Confirmed',
      'in-transit': 'In transit',
      'dispatched': 'Dispatched',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'draft': 'Draft'
    };
    return labels[status];
  }

  getStatusVariant(status: OrderCardStatus): BadgeVariant {
    const variants: Record<OrderCardStatus, BadgeVariant> = {
      'submitted': 'info',      // Purple
      'in-review': 'warning',   // Yellow
      'in-progress': 'warning', // Yellow
      'more-info': 'warning',   // Yellow
      'confirmed': 'warning',   // Yellow
      'in-transit': 'info',     // Purple
      'dispatched': 'success',  // Green
      'completed': 'success',   // Green
      'cancelled': 'danger',    // Red
      'draft': 'secondary'      // Gray
    };
    return variants[status];
  }

  getDetailLink(): string {
    if (this.routePrefix === '/customer') {
      return `/customer/inquiry/${this.data.id.replace('#', '')}`;
    }
    return this.data.type === 'order' 
      ? `${this.routePrefix}/shop-orders/${this.data.id}`
      : `${this.routePrefix}/inquiries/${this.data.id}`;
  }
}
