import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from '@core/auth/auth.service';
import { LoggerService, ScopedLogger } from '@services/logger.service';

interface RefreshTokenResponse {
  token: string;
  refresh_token: string;
}

@Injectable({
  providedIn: 'root'
})
export class TokenRefreshService {
  private refreshUrl = '/api/token/refresh';
  private logger!: ScopedLogger;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private loggerService: LoggerService
  ) {
    this.logger = this.loggerService.createLogger('TokenRefreshService');
  }

  refreshToken(): Observable<RefreshTokenResponse> {
    const refreshToken = this.authService.getRefreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<RefreshTokenResponse>(this.refreshUrl, {
      refresh_token: refreshToken
    }).pipe(
      tap(response => {
        // Update tokens in storage
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('refresh_token', response.refresh_token);
      }),
      catchError(error => {
        this.logger.error('Error refreshing token', error);
        // If refresh fails, logout the user
        this.authService.logout();
        return throwError(() => error);
      })
    );
  }
}
