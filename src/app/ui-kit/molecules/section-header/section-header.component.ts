import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IconComponent } from '../../atoms/icon/icon.component';

@Component({
  selector: 'ui-section-header',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  templateUrl: './section-header.component.html',
  styleUrls: ['./section-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SectionHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() iconName?: string;
  @Input() viewAllLink?: string;
  @Input() viewAllLabel: string = 'View all';
  @Input() mobileViewAllLabel: string = 'All';
}
