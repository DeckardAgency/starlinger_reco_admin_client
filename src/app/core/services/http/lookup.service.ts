import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of, shareReplay } from 'rxjs';
import { environment } from '@env/environment';
import { LoggerService } from '@core/services/logger.service';

// Generic lookup item interface
export interface LookupItem {
    id: number;
    name: string;
}

// API response interfaces
interface CollectionResponse<T> {
    '@context'?: string;
    '@id'?: string;
    '@type'?: string;
    member: T[];
    totalItems: number;
}

interface ContactTitleResponse {
    id: number;
    name: string | null;
    uid?: string;
    isCustom?: number;
}

interface DepartmentResponse {
    id: number;
    name: string | null;
}

@Injectable({
    providedIn: 'root'
})
export class LookupService {
    private apiBaseUrl = `${environment.apiBaseUrl}/api/v1`;

    // Cache observables to avoid repeated API calls
    private contactTitles$: Observable<LookupItem[]> | null = null;
    private departments$: Observable<LookupItem[]> | null = null;

    constructor(private http: HttpClient, private logger: LoggerService) {}

    /**
     * Get all contact titles
     */
    getContactTitles(): Observable<LookupItem[]> {
        if (!this.contactTitles$) {
            this.contactTitles$ = this.http.get<CollectionResponse<ContactTitleResponse>>(
                `${this.apiBaseUrl}/contact_titles`
            ).pipe(
                map(response => this.transformToLookupItems(response.member)),
                catchError(error => {
                    this.logger.error('Error loading contact titles:', error);
                    // Return fallback options
                    return of([
                        { id: 1, name: 'Mr.' },
                        { id: 2, name: 'Mrs.' },
                        { id: 3, name: 'Ms.' },
                        { id: 4, name: 'Dr.' }
                    ]);
                }),
                shareReplay(1)
            );
        }
        return this.contactTitles$;
    }

    /**
     * Get all departments
     */
    getDepartments(): Observable<LookupItem[]> {
        if (!this.departments$) {
            this.departments$ = this.http.get<CollectionResponse<DepartmentResponse>>(
                `${this.apiBaseUrl}/departments`
            ).pipe(
                map(response => this.transformToLookupItems(response.member)),
                catchError(error => {
                    this.logger.error('Error loading departments:', error);
                    // Return fallback options
                    return of([
                        { id: 1, name: 'Sales' },
                        { id: 2, name: 'Engineering' },
                        { id: 3, name: 'Support' },
                        { id: 4, name: 'Management' },
                        { id: 5, name: 'Finance' }
                    ]);
                }),
                shareReplay(1)
            );
        }
        return this.departments$;
    }

    /**
     * Get support levels (hardcoded - no database table exists)
     */
    getSupportLevels(): Observable<LookupItem[]> {
        return of([
            { id: 1, name: 'Basic' },
            { id: 2, name: 'Standard' },
            { id: 3, name: 'Premium' },
            { id: 4, name: 'Enterprise' }
        ]);
    }

    /**
     * Clear cached data (call when you need fresh data)
     */
    clearCache(): void {
        this.contactTitles$ = null;
        this.departments$ = null;
    }

    /**
     * Transform API response to LookupItem array
     */
    private transformToLookupItems(items: { id: number; name: string | null }[]): LookupItem[] {
        return items
            .filter(item => item.name) // Filter out items without names
            .map(item => ({
                id: item.id,
                name: item.name!
            }));
    }
}
