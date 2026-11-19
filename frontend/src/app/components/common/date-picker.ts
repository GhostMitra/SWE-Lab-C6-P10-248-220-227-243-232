import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="input-group">
      <span class="input-group-text bg-white border-end-0 text-primary">
        <i class="bi bi-calendar-event"></i>
      </span>
      <input type="date"
             [id]="id"
             [name]="name"
             class="form-control border-start-0 ps-1"
             [placeholder]="placeholder"
             [value]="value || ''"
             (input)="onDateChange($event)"
             (change)="onDateChange($event)"
             [min]="minYear + '-01-01'"
             [max]="maxYear + '-12-31'"
             [required]="required"
             autocomplete="bday">
    </div>
  `
})
export class DatePickerComponent {
  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();

  @Input() id: string = 'date-picker';
  @Input() name: string = 'date';
  @Input() placeholder: string = 'YYYY-MM-DD';
  @Input() required: boolean = false;
  @Input() minYear: number = 1990;
  @Input() maxYear: number = 2012;

  onDateChange(event: any): void {
    const val = event.target.value || '';
    this.value = val;
    this.valueChange.emit(val);
  }
}
