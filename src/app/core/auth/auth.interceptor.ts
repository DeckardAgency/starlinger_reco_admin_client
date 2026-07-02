import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap, finalize } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { TokenRefreshService } from '@services/http/token-refresh.service';

/**
 * Auth is carried by HttpOnly cookies, so this interceptor no longer injects a Bearer
 * header. It (1) sends every request with credentials so the cookies travel, and (2) on a
 * 401 tries a single cookie-based token refresh and replays the request.
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshDone: BehaviorSubject<boolean | null> = new BehaviorSubject<boolean | null>(null);

  constructor(
    private authService: AuthService,
    private tokenRefreshService: TokenRefreshService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Always send cookies (auth + refresh) with API requests.
    request = request.clone({ withCredentials: true });

    if (this.isAuthRequest(request)) {
      return next.handle(request);
    }

    return next.handle(request).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return this.handle401Error(request, next);
        }
        return throwError(() => error);
      })
    );
  }

  private isAuthRequest(request: HttpRequest<unknown>): boolean {
    return request.url.endsWith('/api/login_check') ||
      request.url.endsWith('/api/token/refresh') ||
      request.url.endsWith('/api/logout');
  }

  private handle401Error(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshDone.next(null);

      return this.tokenRefreshService.refreshToken().pipe(
        switchMap(() => {
          this.isRefreshing = false;
          this.refreshDone.next(true);
          // Cookie has been rotated by the server; just replay the request.
          return next.handle(request);
        }),
        catchError(err => {
          this.isRefreshing = false;
          this.refreshDone.next(false);
          this.authService.logout();
          this.router.navigate(['/login']);
          return throwError(() => err);
        }),
        finalize(() => {
          this.isRefreshing = false;
        })
      );
    }

    // A refresh is already in flight — wait for it, then replay.
    return this.refreshDone.pipe(
      filter(done => done !== null),
      take(1),
      switchMap(done => {
        if (done) {
          return next.handle(request);
        }
        return throwError(() => new Error('Session expired'));
      })
    );
  }
}
