import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export interface AlertButton {
    text: string;
    type?: 'primary' | 'secondary' | 'danger';
    value?: any;
}

export interface AlertConfig {
    title?: string;
    message: string;
    type?: AlertType;
    buttons?: AlertButton[];
    showCloseButton?: boolean;
}

export interface AlertEvent {
    config: AlertConfig;
    resolve: (value: any) => void;
}

@Injectable({
    providedIn: 'root'
})
export class AlertService {
    private alertSubject = new Subject<AlertEvent | null>();
    alert$: Observable<AlertEvent | null> = this.alertSubject.asObservable();

    constructor() {}

    /**
     * Show an alert with custom configuration
     * Returns a promise that resolves with the button value clicked
     */
    show(config: AlertConfig): Promise<any> {
        return new Promise((resolve) => {
            this.alertSubject.next({
                config: {
                    type: 'info',
                    showCloseButton: true,
                    buttons: [{ text: 'OK', type: 'primary', value: true }],
                    ...config
                },
                resolve
            });
        });
    }

    /**
     * Show a success alert
     */
    success(message: string, title?: string): Promise<any> {
        return this.show({
            title: title || 'Success',
            message,
            type: 'success',
            buttons: [{ text: 'OK', type: 'primary', value: true }]
        });
    }

    /**
     * Show an error alert
     */
    error(message: string, title?: string): Promise<any> {
        return this.show({
            title: title || 'Error',
            message,
            type: 'error',
            buttons: [{ text: 'OK', type: 'primary', value: true }]
        });
    }

    /**
     * Show a warning alert
     */
    warning(message: string, title?: string): Promise<any> {
        return this.show({
            title: title || 'Warning',
            message,
            type: 'warning',
            buttons: [{ text: 'OK', type: 'primary', value: true }]
        });
    }

    /**
     * Show an info alert
     */
    info(message: string, title?: string): Promise<any> {
        return this.show({
            title: title || 'Information',
            message,
            type: 'info',
            buttons: [{ text: 'OK', type: 'primary', value: true }]
        });
    }

    /**
     * Show a confirmation dialog
     * Returns true if confirmed, false if cancelled
     */
    confirm(message: string, title?: string): Promise<boolean> {
        return this.show({
            title: title || 'Confirm',
            message,
            type: 'confirm',
            buttons: [
                { text: 'Cancel', type: 'secondary', value: false },
                { text: 'Confirm', type: 'primary', value: true }
            ]
        });
    }

    /**
     * Close the current alert
     */
    close(): void {
        this.alertSubject.next(null);
    }
}
