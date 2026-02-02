import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, map, of, catchError, tap } from 'rxjs';
import {
    Area,
    AreaDetail,
    AreasResponse,
    TransformedAreasResponse,
    AreaManager,
    AreaManagersResponse,
    TransformedAreaManagersResponse,
    AreaCriteria,
    CreateAreaDto,
    UpdateAreaDto,
    CreateAreaManagerDto,
    UpdateAreaManagerDto,
    CreateAreaCriteriaDto,
    UpdateAreaCriteriaDto
} from '@models/area.model';
import { environment } from '@env/environment';

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
export class AreaService {
    private apiUrl = `${environment.apiBaseUrl}/api/v1/areas`;
    private managersApiUrl = `${environment.apiBaseUrl}/api/v1/area_managers`;
    private criteriaApiUrl = `${environment.apiBaseUrl}/api/v1/area_criterias`;

    private httpOptions = {
        headers: new HttpHeaders({
            'Content-Type': 'application/ld+json',
            'Accept': 'application/ld+json'
        })
    };

    constructor(private http: HttpClient) {}

    // ==================== AREA METHODS ====================

    /**
     * Get areas with pagination, sorting and filtering
     */
    getAreas(
        page: number = 1,
        sortField?: string,
        sortDirection?: 'asc' | 'desc',
        searchParams: Record<string, string> = {},
        itemsPerPage: number = 30
    ): Observable<TransformedAreasResponse> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('itemsPerPage', itemsPerPage.toString());

        // Add sorting parameters
        if (sortField && sortDirection) {
            params = params.set(`order[${sortField}]`, sortDirection);
        }

        // Add search parameters
        if (searchParams['name']) {
            params = params.set('name', searchParams['name']);
        }
        if (searchParams['code']) {
            params = params.set('code', searchParams['code']);
        }
        if (searchParams['type']) {
            params = params.set('type', searchParams['type']);
        }
        if (searchParams['isActive']) {
            params = params.set('isActive', searchParams['isActive']);
        }
        if (searchParams['client']) {
            params = params.set('client', searchParams['client']);
        }

        // Add any other search parameters
        Object.keys(searchParams).forEach(key => {
            if (!['name', 'code', 'type', 'isActive', 'client'].includes(key)) {
                params = params.set(key, searchParams[key]);
            }
        });

        return this.http.get<AreasResponse>(this.apiUrl, { params }).pipe(
            tap(response => console.log('Raw Areas API response:', response)),
            map(response => this.transformAreasResponse(response, page)),
            catchError(error => {
                console.error('API error:', error);
                return of({
                    areas: [],
                    totalAreas: 0,
                    pagination: {},
                    currentPage: page,
                    totalPages: 1
                });
            })
        );
    }

    /**
     * Get a single area by ID with full details
     */
    getArea(id: string): Observable<AreaDetail> {
        return this.http.get<AreaDetail>(`${this.apiUrl}/${id}`).pipe(
            tap(area => console.log('Area details:', area))
        );
    }

    /**
     * Get area by code
     */
    getAreaByCode(code: string): Observable<Area | null> {
        const params = new HttpParams().set('code', code);

        return this.http.get<AreasResponse>(this.apiUrl, { params }).pipe(
            map(response => {
                if (response.member && response.member.length > 0) {
                    return response.member[0];
                }
                return null;
            })
        );
    }

    /**
     * Get areas by client
     */
    getAreasByClient(clientId: string): Observable<Area[]> {
        const params = new HttpParams().set('client', clientId);

        return this.http.get<AreasResponse>(this.apiUrl, { params }).pipe(
            map(response => response.member || [])
        );
    }

    /**
     * Get child areas of a parent area
     */
    getChildAreas(parentAreaId: string): Observable<Area[]> {
        const params = new HttpParams().set('parentArea', parentAreaId);

        return this.http.get<AreasResponse>(this.apiUrl, { params }).pipe(
            map(response => response.member || [])
        );
    }

    /**
     * Create a new area
     */
    createArea(areaData: CreateAreaDto): Observable<Area> {
        return this.http.post<Area>(this.apiUrl, areaData, this.httpOptions).pipe(
            tap(area => console.log('Created area:', area))
        );
    }

    /**
     * Update an existing area (partial update)
     */
    updateArea(id: string, areaData: UpdateAreaDto): Observable<Area> {
        return this.http.patch<Area>(`${this.apiUrl}/${id}`, areaData, {
            headers: new HttpHeaders({
                'Content-Type': 'application/merge-patch+json',
                'Accept': 'application/ld+json'
            })
        }).pipe(
            tap(area => console.log('Updated area:', area))
        );
    }

    /**
     * Delete an area
     */
    deleteArea(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    /**
     * Delete multiple areas
     */
    deleteAreas(ids: string[]): Observable<DeleteResult> {
        if (ids.length === 0) {
            return of({
                deletedCount: 0,
                failedCount: 0,
                successIds: [],
                failedIds: []
            });
        }

        const deleteRequests = ids.map(id =>
            this.deleteArea(id).pipe(
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

    // ==================== AREA MANAGER METHODS ====================

    /**
     * Get area managers with pagination
     */
    getAreaManagers(
        page: number = 1,
        sortField?: string,
        sortDirection?: 'asc' | 'desc',
        searchParams: Record<string, string> = {}
    ): Observable<TransformedAreaManagersResponse> {
        let params = new HttpParams()
            .set('page', page.toString());

        if (sortField && sortDirection) {
            params = params.set(`order[${sortField}]`, sortDirection);
        }

        Object.keys(searchParams).forEach(key => {
            params = params.set(key, searchParams[key]);
        });

        return this.http.get<AreaManagersResponse>(this.managersApiUrl, { params }).pipe(
            map(response => this.transformAreaManagersResponse(response, page)),
            catchError(error => {
                console.error('API error:', error);
                return of({
                    areaManagers: [],
                    totalAreaManagers: 0,
                    pagination: {},
                    currentPage: page,
                    totalPages: 1
                });
            })
        );
    }

    /**
     * Get managers for a specific area
     */
    getManagersByArea(areaId: string): Observable<AreaManager[]> {
        const areaIri = `/api/v1/areas/${areaId}`;

        // Fetch area managers and filter client-side
        // (API Platform filter has issues with UUID-based relation filtering)
        return this.http.get<AreaManagersResponse>(`${this.managersApiUrl}?itemsPerPage=100`).pipe(
            map(response => {
                const allManagers = response['hydra:member'] || response.member || [];
                // Filter by area - check both IRI string and nested object
                return allManagers.filter(m => {
                    if (typeof m.area === 'string') {
                        return m.area === areaIri || m.area.endsWith(`/${areaId}`);
                    } else if (m.area && typeof m.area === 'object') {
                        return m.area.id === areaId || m.area['@id'] === areaIri;
                    }
                    return false;
                });
            })
        );
    }

    /**
     * Get available managers for an area (active and not at max capacity)
     */
    getAvailableManagersByArea(areaId: string): Observable<AreaManager[]> {
        // Use IRI format for API Platform filter
        const areaIri = `/api/v1/areas/${areaId}`;
        const params = new HttpParams()
            .set('area', areaIri)
            .set('isActive', 'true');

        return this.http.get<AreaManagersResponse>(this.managersApiUrl, { params }).pipe(
            map(response => {
                const managers = response.member || [];
                // Return all active managers for the area
                return managers.filter(m => m.isActive !== false);
            })
        );
    }

    /**
     * Get a single area manager by ID
     */
    getAreaManager(id: string): Observable<AreaManager> {
        return this.http.get<AreaManager>(`${this.managersApiUrl}/${id}`);
    }

    /**
     * Create a new area manager
     */
    createAreaManager(managerData: CreateAreaManagerDto): Observable<AreaManager> {
        return this.http.post<AreaManager>(this.managersApiUrl, managerData, this.httpOptions).pipe(
            tap(manager => console.log('Created area manager:', manager))
        );
    }

    /**
     * Update an area manager
     */
    updateAreaManager(id: string, managerData: UpdateAreaManagerDto): Observable<AreaManager> {
        return this.http.patch<AreaManager>(`${this.managersApiUrl}/${id}`, managerData, {
            headers: new HttpHeaders({
                'Content-Type': 'application/merge-patch+json',
                'Accept': 'application/ld+json'
            })
        }).pipe(
            tap(manager => console.log('Updated area manager:', manager))
        );
    }

    /**
     * Delete an area manager
     */
    deleteAreaManager(id: string): Observable<void> {
        return this.http.delete<void>(`${this.managersApiUrl}/${id}`);
    }

    // ==================== AREA CRITERIA METHODS ====================

    /**
     * Get criteria for an area
     */
    getCriteriaByArea(areaId: string): Observable<AreaCriteria[]> {
        // Use IRI format for API Platform filter
        const areaIri = `/api/v1/areas/${areaId}`;
        const params = new HttpParams().set('area', areaIri);

        return this.http.get<{ member: AreaCriteria[] }>(this.criteriaApiUrl, { params }).pipe(
            map(response => response.member || [])
        );
    }

    /**
     * Get a single criteria by ID
     */
    getAreaCriteria(id: string): Observable<AreaCriteria> {
        return this.http.get<AreaCriteria>(`${this.criteriaApiUrl}/${id}`);
    }

    /**
     * Create area criteria
     */
    createAreaCriteria(criteriaData: CreateAreaCriteriaDto): Observable<AreaCriteria> {
        return this.http.post<AreaCriteria>(this.criteriaApiUrl, criteriaData, this.httpOptions);
    }

    /**
     * Update area criteria
     */
    updateAreaCriteria(id: string, criteriaData: UpdateAreaCriteriaDto): Observable<AreaCriteria> {
        return this.http.patch<AreaCriteria>(`${this.criteriaApiUrl}/${id}`, criteriaData, {
            headers: new HttpHeaders({
                'Content-Type': 'application/merge-patch+json',
                'Accept': 'application/ld+json'
            })
        });
    }

    /**
     * Delete area criteria
     */
    deleteAreaCriteria(id: string): Observable<void> {
        return this.http.delete<void>(`${this.criteriaApiUrl}/${id}`);
    }

    // ==================== HELPER METHODS ====================

    /**
     * Transform the areas API response
     */
    private transformAreasResponse(response: AreasResponse, currentPage: number): TransformedAreasResponse {
        return {
            areas: response.member || [],
            totalAreas: response.totalItems || 0,
            pagination: {
                first: response.view?.first,
                last: response.view?.last,
                next: response.view?.next,
                previous: response.view?.previous
            },
            currentPage: currentPage,
            totalPages: this.extractTotalPages(response)
        };
    }

    /**
     * Transform the area managers API response
     */
    private transformAreaManagersResponse(response: AreaManagersResponse, currentPage: number): TransformedAreaManagersResponse {
        return {
            areaManagers: response.member || [],
            totalAreaManagers: response.totalItems || 0,
            pagination: {
                first: response.view?.first,
                last: response.view?.last,
                next: response.view?.next,
                previous: response.view?.previous
            },
            currentPage: currentPage,
            totalPages: this.extractTotalPagesFromManagers(response)
        };
    }

    /**
     * Extract total pages from areas response
     */
    private extractTotalPages(response: AreasResponse): number {
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
     * Extract total pages from area managers response
     */
    private extractTotalPagesFromManagers(response: AreaManagersResponse): number {
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
     * Search areas by name
     */
    searchAreasByName(name: string): Observable<Area[]> {
        const params = new HttpParams().set('name', name);

        return this.http.get<AreasResponse>(this.apiUrl, { params }).pipe(
            map(response => response.member || [])
        );
    }
}
