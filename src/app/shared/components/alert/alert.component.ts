import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { trigger, style, transition, animate } from '@angular/animations';
import { AlertService, AlertEvent, AlertButton } from '@services/alert.service';

@Component({
    selector: 'app-alert',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './alert.component.html',
    styleUrls: ['./alert.component.scss'],
    animations: [
        trigger('overlayAnimation', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('200ms ease-out', style({ opacity: 1 }))
            ]),
            transition(':leave', [
                animate('150ms ease-in', style({ opacity: 0 }))
            ])
        ]),
        trigger('modalAnimation', [
            transition(':enter', [
                style({ opacity: 0, transform: 'scale(0.95) translateY(-10px)' }),
                animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
            ]),
            transition(':leave', [
                animate('150ms ease-in', style({ opacity: 0, transform: 'scale(0.95) translateY(-10px)' }))
            ])
        ])
    ]
})
export class AlertComponent implements OnInit, OnDestroy {
    currentAlert: AlertEvent | null = null;
    private subscription!: Subscription;

    constructor(private alertService: AlertService) {}

    ngOnInit(): void {
        this.subscription = this.alertService.alert$.subscribe(alert => {
            this.currentAlert = alert;
        });
    }

    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    @HostListener('document:keydown.escape')
    onEscapeKey(): void {
        if (this.currentAlert?.config.showCloseButton) {
            this.close();
        }
    }

    onButtonClick(button: AlertButton): void {
        if (this.currentAlert) {
            this.currentAlert.resolve(button.value);
            this.currentAlert = null;
        }
    }

    close(): void {
        if (this.currentAlert) {
            this.currentAlert.resolve(null);
            this.currentAlert = null;
        }
    }

    onOverlayClick(event: MouseEvent): void {
        if ((event.target as HTMLElement).classList.contains('alert-overlay')) {
            this.close();
        }
    }

    getIconClass(): string {
        switch (this.currentAlert?.config.type) {
            case 'success': return 'alert__icon--success';
            case 'error': return 'alert__icon--error';
            case 'warning': return 'alert__icon--warning';
            case 'confirm': return 'alert__icon--confirm';
            default: return 'alert__icon--info';
        }
    }

    getButtonClass(button: AlertButton): string {
        switch (button.type) {
            case 'primary': return 'alert__button--primary';
            case 'secondary': return 'alert__button--secondary';
            case 'danger': return 'alert__button--danger';
            default: return 'alert__button--primary';
        }
    }
}
