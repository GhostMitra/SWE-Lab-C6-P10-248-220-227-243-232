import { Component, Input, Output, EventEmitter, OnInit, signal, computed, ElementRef, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface CalendarDay {
  date: number;
  month: number; // 0-11
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  dateString: string; // YYYY-MM-DD
}

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="position-relative date-picker-root">
      
      <!-- Input Field with Adornment -->
      <div class="input-group">
        <span class="input-group-text bg-white border-end-0 text-primary cursor-pointer" (click)="toggleCalendar()">
          <i class="bi bi-calendar-event"></i>
        </span>
        
        <input type="text"
               [id]="id"
               [name]="name"
               class="form-control border-start-0 border-end-0 ps-1"
               [placeholder]="placeholder"
               [value]="displayValue()"
               (input)="onManualInput($event)"
               (focus)="openCalendar()"
               [required]="required"
               autocomplete="bday"
               style="cursor: pointer;">

        <!-- Clear Button if Value Exists -->
        <button type="button" class="btn btn-outline-light border border-start-0 text-muted px-2.5" 
                *ngIf="value" (click)="clearDate($event)" title="Clear date">
          <i class="bi bi-x-circle-fill text-secondary small"></i>
        </button>

        <!-- Toggle Calendar Popup Button -->
        <button type="button" class="btn btn-iem-soft px-3" (click)="toggleCalendar()" title="Open Calendar">
          <i class="bi bi-calendar3"></i>
        </button>
      </div>

      <!-- Human Readable Date Badge (e.g. "15 Jun 2004") -->
      <div class="small text-primary fw-semibold mt-1 d-flex align-items-center gap-1.5" *ngIf="formattedDatePreview()">
        <i class="bi bi-check-circle-fill text-success" style="font-size: 0.75rem;"></i>
        <span style="font-size: 0.8rem;">Selected: {{ formattedDatePreview() }}</span>
      </div>

      <!-- POPUP CALENDAR CARD -->
      <div class="calendar-popup card border-0 shadow-xl rounded-4 p-3 position-absolute bg-white"
           *ngIf="isOpen()"
           style="top: calc(100% + 8px); left: 0; z-index: 1050; width: 330px; animation: calendarFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);">
        
        <!-- Header: Fast Month & Year Pickers -->
        <div class="d-flex align-items-center justify-content-between mb-2.5 gap-1">
          
          <button type="button" class="btn btn-light btn-sm p-1.5 rounded-circle" (click)="prevMonth()" title="Previous Month">
            <i class="bi bi-chevron-left"></i>
          </button>

          <div class="d-flex align-items-center gap-1.5 flex-grow-1 justify-content-center">
            <!-- Month Dropdown -->
            <select class="form-select form-select-sm fw-bold border-0 bg-light py-1 px-2"
                    [value]="viewMonth()"
                    (change)="onMonthChange($event)"
                    style="width: auto; font-size: 0.85rem; cursor: pointer;">
              <option *ngFor="let m of months; let idx = index" [value]="idx">{{ m }}</option>
            </select>

            <!-- Year Dropdown -->
            <select class="form-select form-select-sm fw-bold border-0 bg-light py-1 px-2"
                    [value]="viewYear()"
                    (change)="onYearChange($event)"
                    style="width: auto; font-size: 0.85rem; cursor: pointer;">
              <option *ngFor="let y of availableYears" [value]="y">{{ y }}</option>
            </select>
          </div>

          <button type="button" class="btn btn-light btn-sm p-1.5 rounded-circle" (click)="nextMonth()" title="Next Month">
            <i class="bi bi-chevron-right"></i>
          </button>

        </div>

        <!-- Weekdays Header Row -->
        <div class="row g-1 text-center mb-1 text-muted small fw-bold font-mono" style="font-size: 0.74rem;">
          <div class="col" *ngFor="let day of weekdays">{{ day }}</div>
        </div>

        <!-- Days of the Month Grid -->
        <div class="row g-1 text-center">
          <div class="col-day" *ngFor="let d of calendarDays()">
            <button type="button"
                    class="btn-day w-100 py-1.5 rounded-3 border-0 small fw-semibold"
                    [class.text-muted]="!d.isCurrentMonth"
                    [class.other-month]="!d.isCurrentMonth"
                    [class.day-today]="d.isToday"
                    [class.day-selected]="d.isSelected"
                    (click)="selectDate(d)">
              {{ d.date }}
            </button>
          </div>
        </div>

        <!-- Quick Jump Presets for Students -->
        <div class="border-top mt-3 pt-2.5 d-flex justify-content-between align-items-center small">
          <div class="d-flex gap-1">
            <button type="button" class="btn btn-sm btn-link p-0 text-decoration-none small text-muted hover-primary"
                    (click)="jumpToYear(2004)">
              2004
            </button>
            <span class="text-muted">•</span>
            <button type="button" class="btn btn-sm btn-link p-0 text-decoration-none small text-muted hover-primary"
                    (click)="jumpToYear(2005)">
              2005
            </button>
            <span class="text-muted">•</span>
            <button type="button" class="btn btn-sm btn-link p-0 text-decoration-none small text-muted hover-primary"
                    (click)="jumpToYear(2006)">
              2006
            </button>
          </div>

          <div class="d-flex gap-1.5">
            <button type="button" class="btn btn-sm btn-light border py-0.5 px-2 rounded-2" style="font-size: 0.74rem;" (click)="closeCalendar()">
              Done
            </button>
          </div>
        </div>

      </div>

    </div>
  `,
  styles: [`
    .date-picker-root {
      position: relative;
    }

    .cursor-pointer {
      cursor: pointer;
    }

    .calendar-popup {
      border: 1px solid #cbd5e1 !important;
      box-shadow: 0 16px 36px -4px rgba(15, 23, 42, 0.16), 0 4px 12px -2px rgba(15, 23, 42, 0.08) !important;
    }

    @keyframes calendarFadeIn {
      from { opacity: 0; transform: translateY(-6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .col-day {
      width: 14.285%;
      padding: 2px;
    }

    .btn-day {
      background: transparent;
      color: #1e293b;
      font-size: 0.85rem;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }

    .btn-day:hover:not(.day-selected) {
      background-color: #f1f5f9;
      color: #1e3a8a;
    }

    .btn-day.other-month {
      color: #cbd5e1 !important;
      font-weight: normal;
    }

    .btn-day.day-today {
      border: 1.5px solid #2563eb !important;
      color: #2563eb;
    }

    .btn-day.day-selected {
      background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%) !important;
      color: #ffffff !important;
      font-weight: 700;
      box-shadow: 0 4px 10px rgba(37, 99, 235, 0.35);
    }

    .hover-primary:hover {
      color: #1e3a8a !important;
    }
  `]
})
export class DatePickerComponent implements OnInit {
  private elementRef = inject(ElementRef);

  @Input() value: string = ''; // Format: YYYY-MM-DD
  @Output() valueChange = new EventEmitter<string>();

  @Input() id: string = 'date-picker';
  @Input() name: string = 'date';
  @Input() placeholder: string = 'Select Date of Birth (YYYY-MM-DD)';
  @Input() required: boolean = false;
  @Input() minYear: number = 1990;
  @Input() maxYear: number = 2012;

  isOpen = signal<boolean>(false);
  viewMonth = signal<number>(5); // 0 = Jan, 5 = June
  viewYear = signal<number>(2005); // Default view year for students

  months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  availableYears: number[] = [];

  ngOnInit(): void {
    // Generate years from max down to min
    const years: number[] = [];
    for (let y = this.maxYear; y >= this.minYear; y--) {
      years.push(y);
    }
    this.availableYears = years;

    if (this.value) {
      this.syncViewFromValue(this.value);
    }
  }

  private syncViewFromValue(val: string): void {
    const parts = val.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      if (!isNaN(y) && !isNaN(m)) {
        this.viewYear.set(y);
        this.viewMonth.set(m);
      }
    }
  }

  displayValue = computed(() => {
    return this.value || '';
  });

  formattedDatePreview = computed(() => {
    if (!this.value) return '';
    try {
      const [y, m, d] = this.value.split('-').map(Number);
      if (!y || !m || !d) return '';
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '';
    }
  });

  calendarDays = computed<CalendarDay[]>(() => {
    const y = this.viewYear();
    const m = this.viewMonth();

    const firstDayIndex = new Date(y, m, 1).getDay(); // 0 = Sunday
    const daysInCurrentMonth = new Date(y, m + 1, 0).getDate();
    const daysInPrevMonth = new Date(y, m, 0).getDate();

    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const days: CalendarDay[] = [];

    // Prev month days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDate = daysInPrevMonth - i;
      const prevMonth = m === 0 ? 11 : m - 1;
      const prevYear = m === 0 ? y - 1 : y;
      const dateString = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(prevDate).padStart(2, '0')}`;
      days.push({
        date: prevDate,
        month: prevMonth,
        year: prevYear,
        isCurrentMonth: false,
        isToday: dateString === todayString,
        isSelected: dateString === this.value,
        dateString
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateString = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        date: d,
        month: m,
        year: y,
        isCurrentMonth: true,
        isToday: dateString === todayString,
        isSelected: dateString === this.value,
        dateString
      });
    }

    // Next month days to fill 42 cells (6 rows * 7 days)
    const remainingDays = 42 - days.length;
    for (let n = 1; n <= remainingDays; n++) {
      const nextMonth = m === 11 ? 0 : m + 1;
      const nextYear = m === 11 ? y + 1 : y;
      const dateString = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
      days.push({
        date: n,
        month: nextMonth,
        year: nextYear,
        isCurrentMonth: false,
        isToday: dateString === todayString,
        isSelected: dateString === this.value,
        dateString
      });
    }

    return days;
  });

  toggleCalendar(): void {
    if (this.isOpen()) {
      this.closeCalendar();
    } else {
      this.openCalendar();
    }
  }

  openCalendar(): void {
    if (this.value) {
      this.syncViewFromValue(this.value);
    }
    this.isOpen.set(true);
  }

  closeCalendar(): void {
    this.isOpen.set(false);
  }

  prevMonth(): void {
    let m = this.viewMonth() - 1;
    let y = this.viewYear();
    if (m < 0) {
      m = 11;
      y -= 1;
    }
    this.viewMonth.set(m);
    this.viewYear.set(y);
  }

  nextMonth(): void {
    let m = this.viewMonth() + 1;
    let y = this.viewYear();
    if (m > 11) {
      m = 0;
      y += 1;
    }
    this.viewMonth.set(m);
    this.viewYear.set(y);
  }

  onMonthChange(event: any): void {
    this.viewMonth.set(parseInt(event.target.value, 10));
  }

  onYearChange(event: any): void {
    this.viewYear.set(parseInt(event.target.value, 10));
  }

  jumpToYear(yr: number): void {
    this.viewYear.set(yr);
  }

  selectDate(day: CalendarDay): void {
    this.value = day.dateString;
    this.valueChange.emit(this.value);
    this.viewYear.set(day.year);
    this.viewMonth.set(day.month);
    this.closeCalendar();
  }

  clearDate(event: Event): void {
    event.stopPropagation();
    this.value = '';
    this.valueChange.emit('');
  }

  onManualInput(event: any): void {
    const val = event.target.value.trim();
    this.value = val;
    this.valueChange.emit(val);
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      this.syncViewFromValue(val);
    }
  }

  // Close calendar when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeCalendar();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeCalendar();
  }
}
