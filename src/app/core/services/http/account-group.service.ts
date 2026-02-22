import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AccountGroup, AccountGroupsCollection } from '@core/models/account-group.model';
import { BaseHttpService } from './base-http.service';

@Injectable({
  providedIn: 'root'
})
export class AccountGroupService extends BaseHttpService {
  private readonly endpoint = `${this.apiUrl}/account_groups`;

  getAccountGroups(params: Record<string, string | number | boolean> = {}): Observable<AccountGroupsCollection> {
    const httpParams = this.buildParams({ page: 1, itemsPerPage: 30, ...params });
    return this.getWithJsonLd<AccountGroupsCollection>(this.endpoint, httpParams);
  }

  getAccountGroupById(id: string): Observable<AccountGroup> {
    return this.getWithJsonLd<AccountGroup>(`${this.endpoint}/${id}`);
  }

  createAccountGroup(data: Partial<AccountGroup>): Observable<AccountGroup> {
    return this.postWithJsonLd<AccountGroup>(this.endpoint, data);
  }

  updateAccountGroup(id: string, data: Partial<AccountGroup>): Observable<AccountGroup> {
    return this.patchWithJsonLd<AccountGroup>(`${this.endpoint}/${id}`, data);
  }

  deleteAccountGroup(id: string): Observable<void> {
    return this.deleteWithJsonLd<void>(`${this.endpoint}/${id}`);
  }
}
