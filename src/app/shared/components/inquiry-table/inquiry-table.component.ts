import { Component, Input, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {InquiryShimmerComponent} from '@shared/components/inquiry-table/inquiry-shimmer.component';

interface InquiryHistory {
  id: string;
  machine: string;
  dateCreated: string;
  customer: {
    initials: string;
    name: string;
    image?: string;
  };
  partsOrdered: number;
  status: 'Completed' | 'Confirmed' | 'Processing' | 'Cancelled';
}

@Component({
    selector: 'app-inquiry-table',
    imports: [CommonModule, InquiryShimmerComponent],
    templateUrl: './inquiry-table.component.html',
    styleUrls: ['./inquiry-table.component.scss']
})
export class InquiryTableComponent implements OnInit {
  @Input() inquiries: InquiryHistory[] = [];
  @Input() loading: boolean = false;

  tabs = ['Show all', 'Completed', 'Cancelled', 'Rejected', 'Archived'];
  activeTab = 'Show all';
  filteredInquiries: InquiryHistory[] = [];
  openMenuId: string | null = null;

  constructor(private router: Router, private elementRef: ElementRef) {}

  ngOnInit(): void {
    this.filterInquiries();
  }

  selectTab(tab: string): void {
    this.activeTab = tab;
    this.filterInquiries();
  }

  filterInquiries(): void {
    if (this.activeTab === 'Show all') {
      this.filteredInquiries = [...this.inquiries];
    } else {
      // Convert tab name to status (e.g., 'Completed' to 'Completed')
      const status = this.activeTab as 'Completed' | 'Cancelled' | 'Rejected' | 'Archived';
      this.filteredInquiries = this.inquiries.filter(inquiry => inquiry.status === status);
    }
  }

  get hasData(): boolean {
    return !this.loading && this.inquiries.length > 0;
  }

  viewInquiry(inquiry: InquiryHistory): void {
    this.router.navigate(['/inquiries', inquiry.id, 'view']);
  }

  toggleMenu(event: Event, inquiryId: string): void {
    event.stopPropagation();
    this.openMenuId = this.openMenuId === inquiryId ? null : inquiryId;
  }

  onView(event: Event, inquiry: InquiryHistory): void {
    event.stopPropagation();
    this.openMenuId = null;
    this.viewInquiry(inquiry);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.openMenuId = null;
    }
  }
}
