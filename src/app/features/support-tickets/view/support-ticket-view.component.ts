import { Component, OnInit, OnDestroy, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { BadgeComponent, BadgeVariant } from '@app/ui-kit/atoms/badge/badge.component';
import { SupportTicketService } from '@core/services/http/support-ticket.service';
import { SupportTicket } from '@core/models/support-ticket.model';
import { ToastService } from '@app/ui-kit/organisms/toast-container/toast-container.component';
import { environment } from '@env/environment';

@Component({
  selector: 'app-support-ticket-view',
  standalone: true,
  imports: [CommonModule, BreadcrumbsComponent, IconComponent, BadgeComponent],
  templateUrl: './support-ticket-view.component.html',
  styleUrls: ['./support-ticket-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SupportTicketViewComponent implements OnInit, OnDestroy {
  route = inject(ActivatedRoute);
  private router = inject(Router);
  private supportTicketService = inject(SupportTicketService);
  private toastService = inject(ToastService);

  breadcrumbs = signal([
    { label: 'Support Tickets', route: '/admin/support-tickets/list' },
    { label: 'Ticket Details' }
  ]);

  ticket = signal<SupportTicket | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  apiBaseUrl = environment.apiBaseUrl;

  statusDisplayMap: Record<string, string> = {
    'open': 'Open',
    'in_progress': 'In Progress',
    'resolved': 'Resolved',
    'closed': 'Closed'
  };

  urgencyDisplayMap: Record<string, { label: string; color: string }> = {
    'low': { label: 'Low', color: '#10b981' },
    'medium': { label: 'Medium', color: '#f59e0b' },
    'high': { label: 'High', color: '#ef4444' }
  };

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const ticketId = params['id'];
      if (ticketId) this.loadTicket(ticketId);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTicket(ticketId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.supportTicketService.getSupportTicketById(ticketId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ticket) => {
          this.ticket.set(ticket);
          this.loading.set(false);
          this.breadcrumbs.set([
            { label: 'Support Tickets', route: '/admin/support-tickets/list' },
            { label: ticket.subject.length > 50 ? ticket.subject.substring(0, 50) + '...' : ticket.subject }
          ]);
        },
        error: () => {
          this.error.set('Failed to load support ticket.');
          this.loading.set(false);
        }
      });
  }

  updateStatus(newStatus: 'open' | 'in_progress' | 'resolved' | 'closed'): void {
    const currentTicket = this.ticket();
    if (!currentTicket) return;

    this.supportTicketService.updateStatus(String(currentTicket.id), newStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedTicket) => {
          this.ticket.set(updatedTicket);
          this.toastService.show({ message: 'Status updated', type: 'success' });
        },
        error: () => {
          this.toastService.show({ message: 'Failed to update status', type: 'error' });
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/admin/support-tickets/list']);
  }

  getUserFullName(): string {
    const ticket = this.ticket();
    if (!ticket?.user) return 'Unknown User';
    return `${ticket.user.firstName} ${ticket.user.lastName}`;
  }

  getAttachmentUrl(): string | null {
    const ticket = this.ticket();
    if (!ticket?.attachment) return null;
    return `${this.apiBaseUrl}${ticket.attachment.filePath}`;
  }

  downloadAttachment(): void {
    const url = this.getAttachmentUrl();
    if (url) window.open(url, '_blank');
  }

  getUrgencyColor(): string {
    const ticket = this.ticket();
    if (!ticket) return '#666';
    return this.urgencyDisplayMap[ticket.urgency]?.color || '#666';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${day}.${month}.${year} @ ${hours}:${minutes}`;
  }

  statusVariant(status: string | undefined): BadgeVariant {
    const variants: Record<string, BadgeVariant> = {
      'open': 'blue',
      'in_progress': 'warning',
      'resolved': 'success',
      'closed': 'secondary'
    };
    return variants[status || ''] || 'secondary';
  }

  statusLabel(status: string | undefined): string {
    const labels: Record<string, string> = {
      'open': 'Open',
      'in_progress': 'In Progress',
      'resolved': 'Resolved',
      'closed': 'Closed'
    };
    return labels[status || ''] || (status || '');
  }
}
