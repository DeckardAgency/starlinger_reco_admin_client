import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { QuickActionCardComponent, QuickActionCardData } from '@app/ui-kit';

@Component({
  selector: 'app-quick-actions',
  imports: [CommonModule, RouterModule, QuickActionCardComponent],
  templateUrl: './quick-actions.component.html',
  styleUrls: ['./quick-actions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuickActionsComponent {
  actions: QuickActionCardData[] = [
    {
      type: 'new-order',
      title: 'New order',
      description: 'Initiate a spare part request by completing our custom tailored ordering solutions.',
      buttonLabel: 'Create',
      routerLink: '/shop/all-products'
    },
    {
      type: 'contact-sales',
      title: 'Contact Sales Manager',
      description: 'Access direct communication channel for expert support, technical consultations and inquiry status.',
      buttonLabel: 'Contact',
      routerLink: '/contact'
    }
  ];
}
