import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  HostListener,
  booleanAttribute,
  ChangeDetectorRef,
  inject,
  ContentChild,
  TemplateRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../atoms/icon/icon.component';

export interface CarouselSlide {
  id: string | number;
  imageUrl?: string;
  alt?: string;
  title?: string;
  description?: string;
  data?: unknown;
}

@Component({
  selector: 'ui-carousel',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CarouselComponent implements OnInit, OnDestroy {
  @ViewChild('track') trackRef!: ElementRef<HTMLDivElement>;

  @Input() slides: CarouselSlide[] = [];
  @Input({ transform: booleanAttribute }) autoPlay = false;
  @Input() autoPlayInterval = 5000;
  @Input({ transform: booleanAttribute }) showArrows = true;
  @Input({ transform: booleanAttribute }) showDots = true;
  @Input({ transform: booleanAttribute }) infiniteLoop = true;
  @Input({ transform: booleanAttribute }) pauseOnHover = true;
  @Input() animationDuration = 300;
  @Input() aspectRatio = '16/9';
  @Input({ transform: booleanAttribute }) enableSwipe = true;
  @Input() slidesToShow = 1;
  @Input() gap = 0;

  @Output() slideChange = new EventEmitter<number>();
  @Output() slideClick = new EventEmitter<CarouselSlide>();

  @ContentChild('slideTemplate') slideTemplate?: TemplateRef<{ $implicit: CarouselSlide; index: number }>;

  currentIndex = 0;
  translateX = 0;
  isAnimating = false;
  isPaused = false;
  isDragging = false;

  private autoPlayTimer: ReturnType<typeof setInterval> | null = null;
  private startX = 0;
  private currentX = 0;
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    if (this.autoPlay && this.slides.length > 1) {
      this.startAutoPlay();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updatePosition(false);
  }

  startAutoPlay(): void {
    this.stopAutoPlay();
    this.autoPlayTimer = setInterval(() => {
      if (!this.isPaused) {
        this.next();
      }
    }, this.autoPlayInterval);
  }

  stopAutoPlay(): void {
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
  }

  onMouseEnter(): void {
    if (this.pauseOnHover) {
      this.isPaused = true;
    }
  }

  onMouseLeave(): void {
    if (this.pauseOnHover) {
      this.isPaused = false;
    }
  }

  next(): void {
    if (this.isAnimating || this.slides.length <= 1) return;

    if (this.currentIndex >= this.slides.length - this.slidesToShow) {
      if (this.infiniteLoop) {
        this.goToSlide(0);
      }
    } else {
      this.goToSlide(this.currentIndex + 1);
    }
  }

  previous(): void {
    if (this.isAnimating || this.slides.length <= 1) return;

    if (this.currentIndex === 0) {
      if (this.infiniteLoop) {
        this.goToSlide(this.slides.length - this.slidesToShow);
      }
    } else {
      this.goToSlide(this.currentIndex - 1);
    }
  }

  goToSlide(index: number): void {
    if (this.isAnimating || index === this.currentIndex) return;

    const maxIndex = Math.max(0, this.slides.length - this.slidesToShow);
    const targetIndex = Math.max(0, Math.min(index, maxIndex));

    if (targetIndex === this.currentIndex) return;

    this.isAnimating = true;
    this.currentIndex = targetIndex;
    this.updatePosition(true);
    this.slideChange.emit(this.currentIndex);

    setTimeout(() => {
      this.isAnimating = false;
      this.cdr.markForCheck();
    }, this.animationDuration);

    if (this.autoPlay) {
      this.startAutoPlay();
    }
  }

  private updatePosition(animate: boolean): void {
    const slideWidth = 100 / this.slidesToShow;
    this.translateX = -this.currentIndex * slideWidth;
    this.cdr.markForCheck();
  }

  onSlideClick(slide: CarouselSlide): void {
    this.slideClick.emit(slide);
  }

  // Touch events
  onTouchStart(event: TouchEvent): void {
    if (!this.enableSwipe || this.slides.length <= 1) return;

    this.isDragging = true;
    this.startX = event.touches[0].clientX;
    this.stopAutoPlay();
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.isDragging) return;

    event.preventDefault();
    this.currentX = event.touches[0].clientX;
    const diffX = this.currentX - this.startX;
    const trackWidth = this.trackRef?.nativeElement?.offsetWidth || 1;
    const percentMoved = (diffX / trackWidth) * 100;

    const slideWidth = 100 / this.slidesToShow;
    let newTranslate = -this.currentIndex * slideWidth + percentMoved;

    // Add resistance at edges
    if ((this.currentIndex === 0 && diffX > 0 && !this.infiniteLoop) ||
        (this.currentIndex >= this.slides.length - this.slidesToShow && diffX < 0 && !this.infiniteLoop)) {
      newTranslate = -this.currentIndex * slideWidth + percentMoved * 0.3;
    }

    this.translateX = newTranslate;
    this.cdr.markForCheck();
  }

  onTouchEnd(): void {
    if (!this.isDragging) return;

    this.isDragging = false;
    const diffX = this.currentX - this.startX;
    const trackWidth = this.trackRef?.nativeElement?.offsetWidth || 1;
    const threshold = trackWidth * 0.15;

    if (Math.abs(diffX) > threshold) {
      if (diffX > 0) {
        this.previous();
      } else {
        this.next();
      }
    } else {
      this.updatePosition(true);
    }

    if (this.autoPlay) {
      this.startAutoPlay();
    }
  }

  // Mouse events for desktop drag
  onMouseDown(event: MouseEvent): void {
    if (!this.enableSwipe || this.slides.length <= 1) return;

    event.preventDefault();
    this.isDragging = true;
    this.startX = event.clientX;
    this.stopAutoPlay();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;

    event.preventDefault();
    this.currentX = event.clientX;
    const diffX = this.currentX - this.startX;
    const trackWidth = this.trackRef?.nativeElement?.offsetWidth || 1;
    const percentMoved = (diffX / trackWidth) * 100;

    const slideWidth = 100 / this.slidesToShow;
    let newTranslate = -this.currentIndex * slideWidth + percentMoved;

    // Add resistance at edges
    if ((this.currentIndex === 0 && diffX > 0 && !this.infiniteLoop) ||
        (this.currentIndex >= this.slides.length - this.slidesToShow && diffX < 0 && !this.infiniteLoop)) {
      newTranslate = -this.currentIndex * slideWidth + percentMoved * 0.3;
    }

    this.translateX = newTranslate;
    this.cdr.markForCheck();
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    if (!this.isDragging) return;

    this.isDragging = false;
    const diffX = this.currentX - this.startX;
    const trackWidth = this.trackRef?.nativeElement?.offsetWidth || 1;
    const threshold = trackWidth * 0.15;

    if (Math.abs(diffX) > threshold) {
      if (diffX > 0) {
        this.previous();
      } else {
        this.next();
      }
    } else {
      this.updatePosition(true);
    }

    if (this.autoPlay) {
      this.startAutoPlay();
    }
  }

  get showNavigationArrows(): boolean {
    return this.showArrows && this.slides.length > this.slidesToShow;
  }

  get showNavigationDots(): boolean {
    return this.showDots && this.slides.length > this.slidesToShow;
  }

  get dotsCount(): number[] {
    return Array(Math.max(0, this.slides.length - this.slidesToShow + 1)).fill(0).map((_, i) => i);
  }

  trackBySlide(index: number, slide: CarouselSlide): string | number {
    return slide.id;
  }

  trackByIndex(index: number): number {
    return index;
  }
}
