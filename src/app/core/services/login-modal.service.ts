import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, distinctUntilChanged } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class LoginModalService {
  private isOpenSubject = new BehaviorSubject<boolean>(false);
  private returnUrl: string = '/dashboard';
  private initialized = false;

  public isOpen$: Observable<boolean> = this.isOpenSubject.asObservable().pipe(
    distinctUntilChanged()
  );

  constructor(private authService: AuthService) {
    // Initialize the modal state based on authentication status
    // This prevents the modal from showing on refresh if already authenticated
    if (!this.initialized) {
      this.initialized = true;
      const isAuthenticated = this.authService.isAuthenticated();
      this.isOpenSubject.next(!isAuthenticated && this.isOpenSubject.value);
    }
  }

  open(): void {
    // Only open if not authenticated
    if (!this.authService.isAuthenticated()) {
      this.isOpenSubject.next(true);
    }
  }

  close(): void {
    this.isOpenSubject.next(false);
  }

  toggle(): void {
    const newState = !this.isOpenSubject.value;
    // Only allow opening if not authenticated
    if (newState && !this.authService.isAuthenticated() || !newState) {
      this.isOpenSubject.next(newState);
    }
  }

  setReturnUrl(url: string): void {
    this.returnUrl = url;
  }

  getReturnUrl(): string {
    return this.returnUrl;
  }
}
