import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, map, switchMap, delay } from 'rxjs/operators';
import { User } from '@core/models';
import { environment } from '@env/environment';
import { AuthResponse } from '@models/api/auth-api.model';
import { LoggerService, ScopedLogger } from '@services/logger.service';
import { DUMMY_USER_CREDENTIALS, mockDevelopmentUser } from '@core/mocks/mock-data';

// Re-export for backward compatibility
export type { AuthResponse };

// Use centralized mock data
const DUMMY_USER_EMAIL = DUMMY_USER_CREDENTIALS.email;
const DUMMY_USER_PASSWORD = DUMMY_USER_CREDENTIALS.password;
const DUMMY_USER: User = mockDevelopmentUser as User;

/**
 * Cookie-based authentication.
 *
 * The access + refresh JWTs are issued by the backend as HttpOnly cookies and are NOT
 * accessible to JavaScript (defends against XSS token theft). This service therefore
 * never stores tokens: it authenticates by calling /api/login_check (which sets the
 * cookies) and hydrates the current user via /api/me. Every HTTP request is sent with
 * credentials (see AuthInterceptor) so the cookies travel automatically.
 *
 * A non-sensitive copy of the user profile is cached in localStorage purely so guards can
 * render synchronously on reload; it is re-validated against /api/me on startup. The cache
 * is NOT an authentication credential — the server enforces authorization from the cookie.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private loginUrl = `${environment.apiBaseUrl}/api/login_check`;
  private meUrl = `${environment.apiBaseUrl}/api/me`;
  private logoutUrl = `${environment.apiBaseUrl}/api/logout`;
  private userKey = 'currentUser';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private logger!: ScopedLogger;

  constructor(
    private http: HttpClient,
    private loggerService: LoggerService
  ) {
    this.logger = this.loggerService.createLogger('AuthService');
    this.restoreSession();
  }

  login(username: string, password: string): Observable<boolean> {
    if ((environment as any).useMocks) {
      return this.apiLogin(username, password);
    }
    if ((environment as any).useDummyAuth) {
      return this.dummyLogin(username, password);
    }
    return this.apiLogin(username, password);
  }

  /**
   * Dummy login for development purposes. No cookie is issued; the user subject is set
   * directly. Only works with the configured test credentials.
   */
  private dummyLogin(username: string, password: string): Observable<boolean> {
    return of(null).pipe(
      delay(500),
      switchMap(() => {
        if (username === DUMMY_USER_EMAIL && password === DUMMY_USER_PASSWORD) {
          this.logger.debug('Dummy login successful');
          this.setUser(DUMMY_USER);
          return of(true);
        }
        this.logger.warn('Dummy login failed: Invalid credentials');
        return throwError(() => new Error('Invalid email or password'));
      })
    );
  }

  /**
   * Real API login: POST credentials (the backend sets HttpOnly auth cookies and returns
   * an empty body), then hydrate the current user from /api/me.
   */
  private apiLogin(username: string, password: string): Observable<boolean> {
    return this.http
      .post(this.loginUrl, { username, password }, { withCredentials: true })
      .pipe(
        switchMap(() => this.fetchMe()),
        map(user => {
          if (!user) {
            throw new Error('Could not load your profile. Please try again.');
          }
          if (user.client?.isArchived) {
            // Do not keep an authenticated session for an archived client.
            this.doServerLogout();
            throw new Error('Your company account has been archived. Please contact support for assistance.');
          }
          this.setUser(user);
          return true;
        }),
        catchError(error => {
          this.logger.error('Login error', error);
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    if (!(environment as any).useMocks && !(environment as any).useDummyAuth) {
      this.doServerLogout();
    }
    this.clearUser();
  }

  private doServerLogout(): void {
    this.http.post(this.logoutUrl, {}, { withCredentials: true }).subscribe({
      error: err => this.logger.warn('Server logout failed (cookies may already be cleared)', err)
    });
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Tokens live in HttpOnly cookies and are intentionally not readable by JS. Kept
   * returning null for backward compatibility with any legacy callers.
   */
  getToken(): string | null {
    return null;
  }

  getRefreshToken(): string | null {
    return null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  updateCurrentUser(updatedUser: Partial<User>): void {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      const mergedUser = { ...currentUser, ...updatedUser };
      this.cacheUser(mergedUser);
      this.currentUserSubject.next(mergedUser);
    }
  }

  getUserFullName(): string {
    const user = this.getCurrentUser();
    if (user) {
      if (user.firstName && user.lastName) {
        return `${user.firstName} ${user.lastName}`;
      } else if (user.firstName) {
        return user.firstName;
      } else {
        return user.email;
      }
    }
    return '';
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return !!user?.roles && user.roles.includes(role);
  }

  /**
   * Fetch the authenticated user from /api/me (auth travels via the HttpOnly cookie).
   * Returns null if not authenticated / on error.
   */
  private fetchMe(): Observable<User | null> {
    return this.http.get<any>(this.meUrl, { withCredentials: true }).pipe(
      map(res => this.mapMeResponse(res)),
      catchError(() => of(null))
    );
  }

  private mapMeResponse(res: any): User {
    return {
      id: res.id ?? 0,
      username: res.username || res.email,
      email: res.email,
      firstName: res.firstName || '',
      lastName: res.lastName || '',
      roles: res.roles || [],
      client: res.client
        ? {
            id: res.client.id,
            name: res.client.name,
            code: res.client.code,
            isActive: res.client.isActive,
            isArchived: res.client.isArchived
          }
        : undefined
    } as User;
  }

  /**
   * On startup: hydrate synchronously from the cached profile (so guards work on reload),
   * then validate against /api/me. If the cookie is gone/expired, clear the session.
   */
  private restoreSession(): void {
    if ((environment as any).useMocks) {
      this.setUser(DUMMY_USER);
      return;
    }

    const cached = this.readCachedUser();
    if (cached) {
      this.currentUserSubject.next(cached);
      this.isAuthenticatedSubject.next(true);
    }

    // Defer the /api/me validation to a microtask: making an HTTP call *during* this
    // service's construction would pull in the auth interceptor while this service is
    // still being built, causing a circular DI dependency (NG0200). By the time the
    // microtask runs, construction is complete and HttpClient can be used safely.
    Promise.resolve().then(() => this.validateSession());
  }

  private validateSession(): void {
    this.fetchMe().subscribe(user => {
      if (user) {
        if (user.client?.isArchived) {
          this.logout();
          return;
        }
        this.setUser(user);
      } else {
        this.clearUser();
      }
    });
  }

  private setUser(user: User): void {
    this.cacheUser(user);
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  private clearUser(): void {
    this.removeCachedUser();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  // ---- Non-sensitive profile cache (localStorage) -------------------------------------

  private readCachedUser(): User | null {
    try {
      const raw = this.storageGet(this.userKey);
      if (raw && raw !== 'undefined' && raw !== 'null') {
        return JSON.parse(raw) as User;
      }
    } catch (error) {
      this.logger.warn('Could not read cached user', error);
    }
    return null;
  }

  private cacheUser(user: User): void {
    try {
      this.storageSet(this.userKey, JSON.stringify(user));
    } catch (error) {
      this.logger.warn('Could not cache user', error);
    }
  }

  private removeCachedUser(): void {
    this.storageRemove(this.userKey);
  }

  private isLocalStorageAvailable(): boolean {
    try {
      const testKey = '__test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  private storageGet(key: string): string | null {
    return this.isLocalStorageAvailable() ? localStorage.getItem(key) : null;
  }

  private storageSet(key: string, value: string): void {
    if (this.isLocalStorageAvailable()) {
      localStorage.setItem(key, value);
    }
  }

  private storageRemove(key: string): void {
    if (this.isLocalStorageAvailable()) {
      localStorage.removeItem(key);
    }
  }

  // ---- Client helpers -----------------------------------------------------------------

  getClientInfo(): { name: string; code: string } | null {
    const user = this.getCurrentUser();
    if (user?.client) {
      return { name: user.client.name, code: user.client.code };
    }
    return null;
  }

  hasClient(): boolean {
    return !!this.getCurrentUser()?.client;
  }

  getClientName(): string {
    const client = this.getClientInfo();
    return client ? client.name : '';
  }

  isClientArchived(): boolean {
    return !!this.getCurrentUser()?.client?.isArchived;
  }

  isClientActive(): boolean {
    return !!this.getCurrentUser()?.client?.isActive;
  }
}
