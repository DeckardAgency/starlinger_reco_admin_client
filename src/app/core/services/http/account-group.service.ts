import { Injectable } from '@angular/core';
import { Observable, catchError, shareReplay, tap, throwError } from 'rxjs';
import { AccountGroup, AccountGroupsCollection } from '@core/models/account-group.model';
import { BaseHttpService } from './base-http.service';

@Injectable({
  providedIn: 'root'
})
export class AccountGroupService extends BaseHttpService {
  private readonly endpoint = `${this.apiUrl}/account_groups`;

  // Cache observable to avoid repeated API calls for reference data
  private allAccountGroups$: Observable<AccountGroupsCollection> | null = null;

  getAccountGroups(params: Record<string, string | number | boolean> = {}): Observable<AccountGroupsCollection> {
    const httpParams = this.buildParams({ page: 1, itemsPerPage: 30, ...params });
    return this.getWithJsonLd<AccountGroupsCollection>(this.endpoint, httpParams);
  }

  /**
   * Get all account groups for dropdowns (cached).
   * Cache is invalidated on create/update/delete.
   */
  getAllAccountGroups(): Observable<AccountGroupsCollection> {
    if (!this.allAccountGroups$) {
      this.allAccountGroups$ = this.getAccountGroups({ itemsPerPage: 100 }).pipe(
        catchError(error => {
          this.allAccountGroups$ = null;
          return throwError(() => error);
        }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }
    return this.allAccountGroups$;
  }

  /**
   * Clear cached data (call when you need fresh data)
   */
  clearCache(): void {
    this.allAccountGroups$ = null;
  }

  getAccountGroupById(id: string): Observable<AccountGroup> {
    return this.getWithJsonLd<AccountGroup>(`${this.endpoint}/${id}`);
  }

  createAccountGroup(data: Partial<AccountGroup>): Observable<AccountGroup> {
    return this.postWithJsonLd<AccountGroup>(this.endpoint, data).pipe(
      tap(() => this.clearCache())
    );
  }

  updateAccountGroup(id: string, data: Partial<AccountGroup>): Observable<AccountGroup> {
    return this.patchWithJsonLd<AccountGroup>(`${this.endpoint}/${id}`, data).pipe(
      tap(() => this.clearCache())
    );
  }

  deleteAccountGroup(id: string): Observable<void> {
    return this.deleteWithJsonLd<void>(`${this.endpoint}/${id}`).pipe(
      tap(() => this.clearCache())
    );
  }
}
