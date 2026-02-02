import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Subject, interval, of } from 'rxjs';
import { takeUntil, catchError, switchMap, filter } from 'rxjs/operators';
import { environment } from '@env/environment';
import { AuthService } from '@core/auth/auth.service';

interface InfoRequestNotification {
    id: string;
    inquiryNumber: string;
    partName: string;
    respondedAt: string;
}

interface NotificationState {
    enabled: boolean;
    soundEnabled: boolean;
    lastCheckedAt: string | null;
    newResponsesCount: number;
    recentNotifications: InfoRequestNotification[];
}

@Injectable({
    providedIn: 'root'
})
export class InfoRequestNotificationService implements OnDestroy {
    private readonly STORAGE_KEY = 'info_request_notifications';
    private readonly POLL_INTERVAL = 60000; // 60 seconds
    private readonly API_URL = `${environment.apiBaseUrl}/api/v1/inquiry_part_info_requests`;

    private destroy$ = new Subject<void>();
    private notificationSound: HTMLAudioElement | null = null;

    private stateSubject = new BehaviorSubject<NotificationState>({
        enabled: true,
        soundEnabled: true,
        lastCheckedAt: null,
        newResponsesCount: 0,
        recentNotifications: []
    });

    state$ = this.stateSubject.asObservable();

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) {
        this.loadState();
        this.initSound();
        this.startPolling();
        this.requestNotificationPermission();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Initialize notification sound
     */
    private initSound(): void {
        // Create a simple notification sound using Web Audio API
        // Or use a base64 encoded sound
        this.notificationSound = new Audio();
        // Simple notification sound (base64 encoded short beep)
        this.notificationSound.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2LkpWQhHdwa3eCi5GSjoV6cGhvfIiRlI+HfHNtcHyHj5KPiX13cXB7hYyQj4qBd3Jxe4WMkI+Jf3ZycnuFjJCOiH92c3N7hYuQjoh/dnNze4WLkI6If3Zzc3uFi5COiH92c3N7hYuQjoh/dnNze4WLkI6If3Zzc3uFi4+OiH92c3N7hYuPjoh/dnNze4WLj46If3Zzc3uFi4+OiH92c3N7hYuPjoh/dnNze4WLj46If3Zzc3uFi4+OiH92c3N7hYuPjYh/dnRze4WLj42If3Z0c3uFi4+NiH92dHN7hYuPjYh/dnRze4WLj42If3Z0c3uFi4+NiH92dHN7hYuPjYh/dnRze4WLj42If3Z0c3uEi4+NiH92dHR7hIuPjYh/dnR0e4SLj42If3Z0dHuEi4+NiH92dHR7hIuPjYh/dnR0e4SLj42If3Z0dHuEi4+NiH92dHR7hIuOjYh/dnR0e4SLjo2If3Z0dHuEi46NiH92dHR7hIuOjYh/dnR0e4SLjo2If3Z0dHuEi46NiH92dHR7hIuOjYh/dnR0e4SLjo2HfnZ0dHuEi46Nh352dHR7hIuOjYd+dnR0e4SLjo2HfnZ0dHuEi46Nh352dHR7hIuOjYd+dnR0e4SKjo2HfnZ0dHuEio6Nh352dHV7hIqOjYd+dnV1e4SKjo2HfnZ1dXuEio6Nh352dXV7hIqOjYd+dnV1e4SKjo2HfnZ1dXuEio6Mh352dXV7hIqOjId+dnV1e4SKjoyHfnZ1dXuEio6Mh352dXV7hIqOjId+dnV1e4SKjoyHfnZ1dXuEio6Mh352dXV7hIqOjId+dnV1e4SKjoyHfnZ1dXuDio6Mh352dXV7g4qOjId+dnV1e4OKjoyHfnZ1dXuDio6Mh352dXV7g4qOjId+dnV1e4OKjoyHfnZ1dXuDio6Mh352dXV7g4qNjId+dnV1e4OKjYyHfnZ1dXuDio2Mh352dXV7g4qNjId+dnV1e4OKjYyHfnZ1dXuDio2Mh352dXV7g4qNjId+dnV1e4OKjYyHfnZ1dnuDio2Mh352dXZ7g4qNjId+dnV2e4OKjYyHfnZ1dnuDio2Mh352dXZ7g4qNjId+dnV2e4OKjYyHfnZ1dnuDio2Mh352dXZ7g4qNi4d+dnV2e4OKjYuHfnZ1dnuDio2Lh352dXZ7g4qNi4d+dnV2e4OKjYuHfnZ1dnuDio2Lh352dXZ7g4qNi4d+dnV2e4OJjYuHfnZ1dnuDiY2Lh352dXZ7g4mNi4d+dnV2e4OJjYuHfnZ1dnuDiY2Lh352dXZ7g4mNi4d+dnV2e4OJjYuHfnZ1dnuDiY2Lh352dnZ7g4mNi4d+dnZ2e4OJjYuHfnZ2dnuDiY2Lh352dnZ7g4mNi4d+dnZ2e4OJjYuHfnZ2dnuDiY2Lh352dnZ7g4mNi4d+dnZ2e4OJjYuHfnZ2dnuDiY2Lh352dnZ7g4mMi4d+dnZ2e4OJjIuHfnZ2dnuDiYyLh352dnZ7g4mMi4d+dnZ2e4OJjIuHfnZ2dnuDiYyLh352dnZ7g4mMi4d+dnZ2e4OJjIuHfnZ2dnyDiYyLh352dnd8g4mMi4d+dnd3fIOJjIuHfnZ3d3yDiYyLh352d3d8g4mMi4d+dnd3fIOJjIuHfnZ3d3yDiYyLhn52d3d8g4mMi4Z+dnd3fIOJjIuGfnZ3d3yDiYyLhn52d3d8g4mMi4Z+dnd3fIOJjIuGfnZ3d3yDiYyLhn52d3d8g4iMi4Z+dnd3fIOIjIuGfnZ3d3yDiIyLhn52d3d8g4iMi4Z+dnd3fIOIjIuGfnZ3d3yDiIyLhn52d3d8g4iMi4Z+dnd3fIOIjIuGfnZ3d3yDiIyKhn52d3d8g4iMioZ+dnd3fIOIjIqGfnZ3d3yDiIyKhn52d3d8g4iMioZ+dnd3fIOIjIqGfnZ3d3yDiIyKhn52d3d8g4iMioZ+dnh3fIOIjIqGfnZ4d3yDiIyKhn52eHd8g4iMioZ+dnh3fIOIjIqGfnZ4d3yDiIyKhn52eHd8g4iMioZ+dnh3fIOIjIqGfnZ4d3yDiIuKhn52eHd8g4iLioZ+dnh4fIOIi4qGfnZ4eHyDiIuKhn52eHh8g4iLioZ+dnh4fIOIi4qGfnZ4eHyDiIuKhn52eHh8g4iLioZ+dnh4fIOIi4qGfnZ4eHyDiIuKhn52eHh8g4iLioZ+dnh4fIOIi4qGfnZ4eHyDiIuKhn52eHh8g4iLioZ+dnh4fIOIi4mGfnZ4eHyDiIuJhn52eHh8goiLiYZ+dnh4fIKIi4mGfnZ4eHyCiIuJhn52eHh8goiLiYZ+dnh4fIKIi4mGfnZ4eHyCiIuJhn52eHh8goiLiYZ+';
        this.notificationSound.volume = 0.5;
    }

    /**
     * Request browser notification permission
     */
    private requestNotificationPermission(): void {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    /**
     * Load state from localStorage
     */
    private loadState(): void {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                this.stateSubject.next({
                    ...this.stateSubject.value,
                    enabled: parsed.enabled ?? true,
                    soundEnabled: parsed.soundEnabled ?? true,
                    lastCheckedAt: parsed.lastCheckedAt || null
                });
            }
        } catch (e) {
            console.warn('Failed to load notification state:', e);
        }
    }

    /**
     * Save state to localStorage
     */
    private saveState(): void {
        try {
            const state = this.stateSubject.value;
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
                enabled: state.enabled,
                soundEnabled: state.soundEnabled,
                lastCheckedAt: state.lastCheckedAt
            }));
        } catch (e) {
            console.warn('Failed to save notification state:', e);
        }
    }

    /**
     * Start polling for new responses
     */
    private startPolling(): void {
        interval(this.POLL_INTERVAL)
            .pipe(
                takeUntil(this.destroy$),
                filter(() => this.stateSubject.value.enabled && this.authService.isAuthenticated()),
                switchMap(() => this.checkForNewResponses())
            )
            .subscribe();

        // Also check immediately on service init (with slight delay)
        setTimeout(() => {
            if (this.stateSubject.value.enabled && this.authService.isAuthenticated()) {
                this.checkForNewResponses().subscribe();
            }
        }, 5000);
    }

    /**
     * Check for new client responses
     */
    private checkForNewResponses() {
        const state = this.stateSubject.value;

        let params = new HttpParams()
            .set('status[]', 'responded')
            .set('order[updatedAt]', 'desc')
            .set('page', '1');

        // If we have a last checked timestamp, only get responses after that
        if (state.lastCheckedAt) {
            params = params.set('updatedAt[after]', state.lastCheckedAt);
        }

        return this.http.get<any>(this.API_URL, { params }).pipe(
            catchError(error => {
                console.warn('Failed to check for new responses:', error);
                return of({ member: [], 'hydra:member': [] });
            })
        ).pipe(
            switchMap(response => {
                const members = response['hydra:member'] || response['member'] || [];
                const now = new Date().toISOString();

                if (members.length > 0 && state.lastCheckedAt) {
                    // We have new responses since last check
                    const newNotifications: InfoRequestNotification[] = members.map((item: any) => ({
                        id: item.id,
                        inquiryNumber: item.inquiry?.inquiryNumber || 'Unknown',
                        partName: item.inquiryMachinePart?.partName || 'Unknown Part',
                        respondedAt: item.updatedAt
                    }));

                    this.stateSubject.next({
                        ...state,
                        lastCheckedAt: now,
                        newResponsesCount: members.length,
                        recentNotifications: newNotifications
                    });

                    // Trigger notifications
                    this.triggerNotifications(newNotifications);
                } else {
                    // No new responses, just update lastCheckedAt
                    this.stateSubject.next({
                        ...state,
                        lastCheckedAt: now,
                        newResponsesCount: 0,
                        recentNotifications: []
                    });
                }

                this.saveState();
                return of(null);
            })
        );
    }

    /**
     * Trigger browser notification and sound
     */
    private triggerNotifications(notifications: InfoRequestNotification[]): void {
        const state = this.stateSubject.value;

        // Play sound
        if (state.soundEnabled && this.notificationSound) {
            this.notificationSound.play().catch(e => {
                console.warn('Could not play notification sound:', e);
            });
        }

        // Show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            const count = notifications.length;
            const title = count === 1
                ? 'New Client Response'
                : `${count} New Client Responses`;

            const body = count === 1
                ? `${notifications[0].partName} - Inquiry ${notifications[0].inquiryNumber}`
                : `You have ${count} new responses waiting for review`;

            const notification = new Notification(title, {
                body,
                icon: '/assets/icons/notification-icon.png',
                tag: 'info-request-notification',
                requireInteraction: false
            });

            notification.onclick = () => {
                window.focus();
                window.location.href = '/info-requests/list?status=responded';
                notification.close();
            };

            // Auto close after 5 seconds
            setTimeout(() => notification.close(), 5000);
        }
    }

    /**
     * Enable/disable notifications
     */
    toggleNotifications(enabled: boolean): void {
        this.stateSubject.next({
            ...this.stateSubject.value,
            enabled
        });
        this.saveState();
    }

    /**
     * Enable/disable sound
     */
    toggleSound(enabled: boolean): void {
        this.stateSubject.next({
            ...this.stateSubject.value,
            soundEnabled: enabled
        });
        this.saveState();
    }

    /**
     * Manually trigger a check for new responses
     */
    checkNow(): void {
        if (this.authService.isAuthenticated()) {
            this.checkForNewResponses().subscribe();
        }
    }

    /**
     * Clear the new responses count
     */
    clearNewResponsesCount(): void {
        this.stateSubject.next({
            ...this.stateSubject.value,
            newResponsesCount: 0,
            recentNotifications: []
        });
    }

    /**
     * Test notification (for settings)
     */
    testNotification(): void {
        if (this.stateSubject.value.soundEnabled && this.notificationSound) {
            this.notificationSound.play().catch(e => {
                console.warn('Could not play notification sound:', e);
            });
        }

        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Test Notification', {
                body: 'Notifications are working correctly!',
                icon: '/assets/icons/notification-icon.png'
            });
        }
    }

    /**
     * Get current notification permission status
     */
    getPermissionStatus(): NotificationPermission | 'unsupported' {
        if ('Notification' in window) {
            return Notification.permission;
        }
        return 'unsupported';
    }

    /**
     * Request notification permission
     */
    async requestPermission(): Promise<NotificationPermission | 'unsupported'> {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            return permission;
        }
        return 'unsupported';
    }
}
