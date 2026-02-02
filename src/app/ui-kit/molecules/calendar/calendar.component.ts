import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  HostListener,
  ElementRef,
  booleanAttribute,
  ChangeDetectorRef,
  inject,
  forwardRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '../../atoms/icon/icon.component';

export interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isInRange: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isDisabled: boolean;
}

export interface DateRange {
  start: Date;
  end: Date;
}

@Component({
  selector: 'ui-calendar',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CalendarComponent),
      multi: true
    }
  ]
})
export class CalendarComponent implements OnInit, OnChanges, ControlValueAccessor {
  @Input() selectedDate: Date | null = null;
  @Input() startDate: Date | null = null;
  @Input() endDate: Date | null = null;
  @Input({ transform: booleanAttribute }) isRange = false;
  @Input() minDate: Date | null = null;
  @Input() maxDate: Date | null = null;
  @Input() disabledDates: Date[] = [];
  @Input() firstDayOfWeek: 0 | 1 = 0; // 0 = Sunday, 1 = Monday
  @Input() locale = 'en-US';
  @Input({ transform: booleanAttribute }) showTodayButton = true;
  @Input({ transform: booleanAttribute }) showClearButton = true;
  @Input({ transform: booleanAttribute }) inline = false;

  @Output() dateSelected = new EventEmitter<Date>();
  @Output() rangeSelected = new EventEmitter<DateRange>();
  @Output() monthChange = new EventEmitter<Date>();
  @Output() close = new EventEmitter<void>();

  currentMonth: Date = new Date();
  calendarDays: CalendarDay[] = [];
  weekDays: string[] = [];
  selectionInProgress = false;

  private onChange: (value: Date | DateRange | null) => void = () => {};
  private onTouched: () => void = () => {};
  private cdr = inject(ChangeDetectorRef);

  constructor(private elementRef: ElementRef) {}

  ngOnInit(): void {
    this.initWeekDays();
    this.generateCalendarDays();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedDate'] || changes['startDate'] || changes['endDate'] ||
        changes['minDate'] || changes['maxDate'] || changes['disabledDates']) {
      this.generateCalendarDays();
    }
    if (changes['firstDayOfWeek'] || changes['locale']) {
      this.initWeekDays();
      this.generateCalendarDays();
    }
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (!this.inline && !this.elementRef.nativeElement.contains(event.target)) {
      this.close.emit();
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: Date | DateRange | null): void {
    if (this.isRange && value && typeof value === 'object' && 'start' in value) {
      this.startDate = value.start;
      this.endDate = value.end;
    } else if (value instanceof Date) {
      this.selectedDate = value;
    } else {
      this.selectedDate = null;
      this.startDate = null;
      this.endDate = null;
    }
    this.generateCalendarDays();
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: Date | DateRange | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  private initWeekDays(): void {
    const days: string[] = [];
    const baseDate = new Date(2024, 0, 7); // A known Sunday

    for (let i = 0; i < 7; i++) {
      const dayIndex = (this.firstDayOfWeek + i) % 7;
      baseDate.setDate(7 + dayIndex);
      days.push(baseDate.toLocaleDateString(this.locale, { weekday: 'short' }).slice(0, 2));
    }

    this.weekDays = days;
  }

  generateCalendarDays(): void {
    this.calendarDays = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Calculate first day to show
    let firstDayOffset = firstDayOfMonth.getDay() - this.firstDayOfWeek;
    if (firstDayOffset < 0) firstDayOffset += 7;

    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - firstDayOffset);

    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      date.setHours(0, 0, 0, 0);

      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.getTime() === today.getTime();
      const isDisabled = this.isDateDisabled(date);

      let isSelected = false;
      let isInRange = false;
      let isRangeStart = false;
      let isRangeEnd = false;

      if (!this.isRange && this.selectedDate) {
        const selectedTime = new Date(this.selectedDate).setHours(0, 0, 0, 0);
        isSelected = date.getTime() === selectedTime;
      }

      if (this.isRange) {
        if (this.startDate) {
          const startTime = new Date(this.startDate).setHours(0, 0, 0, 0);
          isRangeStart = date.getTime() === startTime;

          if (this.endDate) {
            const endTime = new Date(this.endDate).setHours(0, 0, 0, 0);
            isRangeEnd = date.getTime() === endTime;
            isInRange = date.getTime() > startTime && date.getTime() < endTime;
          }
        }
      }

      this.calendarDays.push({
        date,
        day: date.getDate(),
        isCurrentMonth,
        isToday,
        isSelected,
        isInRange,
        isRangeStart,
        isRangeEnd,
        isDisabled
      });
    }
  }

  private isDateDisabled(date: Date): boolean {
    if (this.minDate && date < this.minDate) return true;
    if (this.maxDate && date > this.maxDate) return true;

    return this.disabledDates.some(disabled => {
      const disabledTime = new Date(disabled).setHours(0, 0, 0, 0);
      return date.getTime() === disabledTime;
    });
  }

  selectDate(day: CalendarDay): void {
    if (day.isDisabled) return;

    this.onTouched();

    if (!this.isRange) {
      this.selectedDate = day.date;
      this.dateSelected.emit(new Date(day.date));
      this.onChange(new Date(day.date));
      this.generateCalendarDays();
    } else {
      if (!this.selectionInProgress || !this.startDate) {
        this.startDate = day.date;
        this.endDate = null;
        this.selectionInProgress = true;
      } else {
        if (day.date.getTime() < this.startDate.getTime()) {
          this.endDate = new Date(this.startDate);
          this.startDate = day.date;
        } else {
          this.endDate = day.date;
        }
        this.selectionInProgress = false;

        const range: DateRange = {
          start: new Date(this.startDate),
          end: new Date(this.endDate)
        };
        this.rangeSelected.emit(range);
        this.onChange(range);
      }
      this.generateCalendarDays();
    }

    this.cdr.markForCheck();
  }

  previousMonth(): void {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() - 1,
      1
    );
    this.generateCalendarDays();
    this.monthChange.emit(this.currentMonth);
    this.cdr.markForCheck();
  }

  nextMonth(): void {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() + 1,
      1
    );
    this.generateCalendarDays();
    this.monthChange.emit(this.currentMonth);
    this.cdr.markForCheck();
  }

  goToToday(): void {
    this.currentMonth = new Date();
    if (!this.isRange) {
      this.selectedDate = new Date();
      this.selectedDate.setHours(0, 0, 0, 0);
      this.dateSelected.emit(new Date(this.selectedDate));
      this.onChange(new Date(this.selectedDate));
    }
    this.generateCalendarDays();
    this.cdr.markForCheck();
  }

  clearSelection(): void {
    this.selectedDate = null;
    this.startDate = null;
    this.endDate = null;
    this.selectionInProgress = false;
    this.onChange(null);
    this.generateCalendarDays();
    this.cdr.markForCheck();
  }

  get monthYearLabel(): string {
    return this.currentMonth.toLocaleDateString(this.locale, {
      month: 'long',
      year: 'numeric'
    });
  }

  trackByDay(index: number, day: CalendarDay): string {
    return day.date.toISOString();
  }

  trackByIndex(index: number): number {
    return index;
  }
}
