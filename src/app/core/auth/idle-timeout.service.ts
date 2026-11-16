import { Injectable, NgZone, inject } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '@env/environment';
import { AuthService } from './auth.service';

/** Default idle timeout; an environment may override it with `idleTimeoutMinutes`. */
export const DEFAULT_IDLE_TIMEOUT_MINUTES = 30;

/** localStorage key holding the last-activity timestamp (ms), shared by all tabs. */
export const IDLE_LAST_ACTIVITY_KEY = 'idle.lastActivity';

/** How often the idle check runs. */
const CHECK_INTERVAL_MS = 15_000;
/** Activity is recorded (and written to localStorage) at most this often. */
const ACTIVITY_THROTTLE_MS = 5_000;

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel', 'scroll'] as const;

/**
 * Logs the user out after a period without activity (mouse, keyboard, touch,
 * scrolling, navigation). Started by the app shell while a session exists.
 *
 * - Listeners and the timer run outside Angular's zone, so they never trigger
 *   change detection; only the actual logout re-enters the zone.
 * - The last-activity timestamp is mirrored to localStorage, so activity in one
 *   tab keeps the others alive, and a session left idle past the limit is ended
 *   when the app is opened again. Storage failures are ignored (the timeout then
 *   simply works per tab).
 */
@Injectable({ providedIn: 'root' })
export class IdleTimeoutService {
  private zone = inject(NgZone);
  private router = inject(Router);
  private authService = inject(AuthService);

  private readonly timeoutMs =
    ((environment as { idleTimeoutMinutes?: number }).idleTimeoutMinutes ?? DEFAULT_IDLE_TIMEOUT_MINUTES) * 60_000;

  private running = false;
  private lastActivity = 0;
  private timer: ReturnType<typeof setInterval> | null = null;

  private readonly onActivity = (): void => this.recordActivity();
  private readonly onVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') this.check();
  };

  /** Start watching. A stored timestamp from an earlier visit is honoured. */
  start(): void {
    if (this.running) return;
    this.running = true;

    const now = Date.now();
    this.lastActivity = this.readStored() ?? now;
    if (this.isExpired(now)) {
      this.expire();
      return;
    }
    this.recordActivity(true);

    this.zone.runOutsideAngular(() => {
      for (const name of ACTIVITY_EVENTS) {
        document.addEventListener(name, this.onActivity, { capture: true, passive: true });
      }
      // Timers are throttled in background tabs / during sleep: re-check on return
      document.addEventListener('visibilitychange', this.onVisibilityChange);
      this.timer = setInterval(() => this.check(), CHECK_INTERVAL_MS);
    });
  }

  /** Stop watching and forget the stored timestamp (called when the session ends). */
  stop(): void {
    this.removeStored();
    if (!this.running) return;
    this.running = false;

    for (const name of ACTIVITY_EVENTS) {
      document.removeEventListener(name, this.onActivity, { capture: true });
    }
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Count a route change as activity (called by the app shell). */
  notifyNavigation(): void {
    if (this.running) this.recordActivity();
  }

  private recordActivity(force = false): void {
    const now = Date.now();
    if (!force && now - this.lastActivity < ACTIVITY_THROTTLE_MS) return;
    // Don't let a late event revive a session that has already timed out
    if (!force && this.isExpired(now)) return;
    this.lastActivity = now;
    this.writeStored(now);
  }

  private check(): void {
    if (!this.running) return;
    // Another tab may have seen activity more recently than this one
    const stored = this.readStored();
    if (stored !== null && stored > this.lastActivity) {
      this.lastActivity = stored;
    }
    if (this.isExpired(Date.now())) {
      this.expire();
    }
  }

  private isExpired(now: number): boolean {
    return now - this.lastActivity >= this.timeoutMs;
  }

  private expire(): void {
    this.zone.run(() => {
      this.stop();
      this.authService.logout();
      this.router.navigate(['/login'], { queryParams: { reason: 'idle' } });
    });
  }

  // ---- localStorage (may be unavailable or throw: private mode, blocked site data) ----

  private readStored(): number | null {
    try {
      const value = Number(localStorage.getItem(IDLE_LAST_ACTIVITY_KEY));
      return Number.isFinite(value) && value > 0 ? value : null;
    } catch {
      return null;
    }
  }

  private writeStored(timestamp: number): void {
    try {
      localStorage.setItem(IDLE_LAST_ACTIVITY_KEY, String(timestamp));
    } catch {
      // ignore: the timeout still works for this tab
    }
  }

  private removeStored(): void {
    try {
      localStorage.removeItem(IDLE_LAST_ACTIVITY_KEY);
    } catch {
      // ignore
    }
  }
}
