import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  booleanAttribute,
  HostListener,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger, state } from '@angular/animations';
import { IconComponent } from '../../atoms/icon/icon.component';

export type DrawerPosition = 'left' | 'right' | 'top' | 'bottom';
export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

@Component({
  selector: 'ui-drawer',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './drawer.component.html',
  styleUrls: ['./drawer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeOverlay', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('slideDrawer', [
      state('left', style({ transform: 'translateX(0)' })),
      state('right', style({ transform: 'translateX(0)' })),
      state('top', style({ transform: 'translateY(0)' })),
      state('bottom', style({ transform: 'translateY(0)' })),
      transition(':enter', [
        style({ transform: '{{ enterTransform }}' }),
        animate('300ms ease-out')
      ], { params: { enterTransform: 'translateX(-100%)' } }),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: '{{ leaveTransform }}' }))
      ], { params: { leaveTransform: 'translateX(-100%)' } })
    ])
  ]
})
export class DrawerComponent {
  @Input({ transform: booleanAttribute }) isOpen = false;
  @Input() position: DrawerPosition = 'right';
  @Input() size: DrawerSize = 'md';
  @Input() title = '';
  @Input({ transform: booleanAttribute }) showClose = true;
  @Input({ transform: booleanAttribute }) showOverlay = true;
  @Input({ transform: booleanAttribute }) closeOnOverlayClick = true;
  @Input({ transform: booleanAttribute }) closeOnEscape = true;

  @Output() close = new EventEmitter<void>();
  @Output() opened = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen && this.closeOnEscape) {
      this.onClose();
    }
  }

  onOverlayClick(): void {
    if (this.closeOnOverlayClick) {
      this.onClose();
    }
  }

  onClose(): void {
    this.close.emit();
    this.closed.emit();
  }

  onDrawerClick(event: Event): void {
    event.stopPropagation();
  }

  get drawerClasses(): string[] {
    return [
      'ui-drawer__panel',
      `ui-drawer__panel--${this.position}`,
      `ui-drawer__panel--${this.size}`
    ];
  }

  get enterTransform(): string {
    switch (this.position) {
      case 'left': return 'translateX(-100%)';
      case 'right': return 'translateX(100%)';
      case 'top': return 'translateY(-100%)';
      case 'bottom': return 'translateY(100%)';
    }
  }

  get leaveTransform(): string {
    return this.enterTransform;
  }
}
