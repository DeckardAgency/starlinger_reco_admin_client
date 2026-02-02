import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'ui-section-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './section-header.component.html',
  styleUrls: ['./section-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SectionHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() icon?: string;
  @Input() viewAllLink?: string;
  @Input() viewAllLabel: string = 'View all';
  @Input() mobileViewAllLabel: string = 'All';

  constructor(private sanitizer: DomSanitizer) {}

  get sanitizedIcon(): SafeHtml | null {
    return this.icon ? this.sanitizer.bypassSecurityTrustHtml(this.icon) : null;
  }
}
