import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, map, of, catchError, tap } from 'rxjs';
import { MachineCategory, MachineCategoryCollection, MachineCategoryRequest } from '@models/machine-category.model';
import { environment } from "@env/environment";

// Response interface for component compatibility
export interface MachineCategoriesResponse {
    categories: MachineCategory[];
    totalItems: number;
    pagination: {
        first?: string;
        last?: string;
        next?: string;
        previous?: string;
    };
    currentPage: number;
    totalPages: number;
}

// Result interface for bulk operations
export interface DeleteResult {
    deletedCount: number;
    failedCount: number;
    successIds: string[];
    failedIds: string[];
}

@Injectable({
    providedIn: 'root'
})
export class MachineCategoryService {
    private apiUrl = `${environment.apiBaseUrl}/api/v1/machine_categories`;
    private httpOptions = {
        headers: new HttpHeaders({
            'Content-Type': 'application/ld+json',
            'Accept': 'application/ld+json'
        })
    };

    constructor(private http: HttpClient) {}

    /**
     * Get machine categories with pagination
     */
    getCategories(
        page: number = 1,
        sortField?: string,
        sortDirection?: 'asc' | 'desc',
        searchParams: Record<string, string> = {}
    ): Observable<MachineCategoriesResponse> {
        let params = new HttpParams()
            .set('page', page.toString());

        // Add sorting parameters
        if (sortField && sortDirection) {
            params = params.set(`order[${sortField}]`, sortDirection);
        }

        // Add search parameters
        Object.keys(searchParams).forEach(key => {
            params = params.set(key, searchParams[key]);
        });

        return this.http.get<MachineCategoryCollection>(this.apiUrl, { params }).pipe(
            map(response => {
                const categoriesResponse: MachineCategoriesResponse = {
                    categories: response.member || [],
                    totalItems: response.totalItems || 0,
                    pagination: {
                        first: response.view?.first,
                        last: response.view?.last,
                        next: response.view?.next,
                        previous: response.view?.previous
                    },
                    currentPage: page,
                    totalPages: this.extractTotalPages(response)
                };
                return categoriesResponse;
            }),
            catchError(error => {
                console.error('API error:', error);
                return of({
                    categories: [],
                    totalItems: 0,
                    pagination: {},
                    currentPage: page,
                    totalPages: 1
                });
            })
        );
    }

    /**
     * Get all categories (without pagination, for dropdowns)
     */
    getAllCategories(): Observable<MachineCategory[]> {
        return this.http.get<MachineCategoryCollection>(this.apiUrl).pipe(
            map(response => response.member || []),
            catchError(error => {
                console.error('Error fetching categories:', error);
                return of([]);
            })
        );
    }

    /**
     * Extract total pages from the response
     */
    private extractTotalPages(response: MachineCategoryCollection): number {
        if (response.view?.last) {
            const lastPageUrl = response.view.last;
            const pageMatch = lastPageUrl.match(/[?&]page=(\d+)/);
            if (pageMatch && pageMatch[1]) {
                return parseInt(pageMatch[1], 10);
            }
        }
        if (response.totalItems) {
            const itemsPerPage = 30;
            return Math.ceil(response.totalItems / itemsPerPage);
        }
        return 1;
    }

    /**
     * Get a single category by ID
     */
    getCategory(id: string): Observable<MachineCategory> {
        return this.http.get<MachineCategory>(`${this.apiUrl}/${id}`);
    }

    /**
     * Create a new category
     */
    createCategory(category: MachineCategoryRequest): Observable<MachineCategory> {
        return this.http.post<MachineCategory>(this.apiUrl, category, this.httpOptions);
    }

    /**
     * Update an existing category
     */
    updateCategory(id: string, category: Partial<MachineCategoryRequest>): Observable<MachineCategory> {
        return this.http.patch<MachineCategory>(`${this.apiUrl}/${id}`, category, {
            headers: new HttpHeaders({
                'Content-Type': 'application/merge-patch+json',
                'Accept': 'application/ld+json'
            })
        });
    }

    /**
     * Delete a category
     */
    deleteCategory(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    /**
     * Delete multiple categories in parallel
     */
    deleteCategories(ids: string[]): Observable<DeleteResult> {
        if (ids.length === 0) {
            return of({
                deletedCount: 0,
                failedCount: 0,
                successIds: [],
                failedIds: []
            });
        }

        const deleteRequests = ids.map(id =>
            this.deleteCategory(id).pipe(
                map(() => ({ success: true, id })),
                catchError(error => of({ success: false, id, error }))
            )
        );

        return forkJoin(deleteRequests).pipe(
            map(results => {
                const successResults = results.filter(r => r.success);
                const failedResults = results.filter(r => !r.success);

                return {
                    deletedCount: successResults.length,
                    failedCount: failedResults.length,
                    successIds: successResults.map(r => r.id),
                    failedIds: failedResults.map(r => r.id)
                };
            })
        );
    }
}
