import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LoggerService, ScopedLogger } from '@services/logger.service';
import { environment } from '@env/environment';

/**
 * Refreshes the session using the HttpOnly refresh-token cookie. The refresh token is
 * never read or sent by JS — the browser attaches the cookie automatically (withCredentials)
 * and the server rotates both cookies. No tokens are stored client-side.
 */
@Injectable({
  providedIn: 'root'
})
export class TokenRefreshService {
  private refreshUrl = `${environment.apiBaseUrl}/api/token/refresh`;
  private logger!: ScopedLogger;

  constructor(
    private http: HttpClient,
    private loggerService: LoggerService
  ) {
    this.logger = this.loggerService.createLogger('TokenRefreshService');
  }

  refreshToken(): Observable<unknown> {
    return this.http.post(this.refreshUrl, {}, { withCredentials: true }).pipe(
      catchError(error => {
        this.logger.error('Error refreshing session', error);
        return throwError(() => error);
      })
    );
  }
}
