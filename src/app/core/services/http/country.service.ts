import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { Country, CountriesCollection } from '@core/models/country.model';
import { BaseHttpService } from './base-http.service';

@Injectable({
  providedIn: 'root'
})
export class CountryService extends BaseHttpService {
  private readonly endpoint = `${this.apiUrl}/countries`;

  getCountries(page: number = 1, itemsPerPage: number = 100): Observable<CountriesCollection> {
    const params = this.buildParams({ page, itemsPerPage });
    return this.getWithJsonLd<CountriesCollection>(this.endpoint, params);
  }

  getCountryById(id: string): Observable<Country> {
    return this.getWithJsonLd<Country>(`${this.endpoint}/${id}`);
  }

  createCountry(country: Partial<Country>): Observable<Country> {
    return this.postWithJsonLd<Country>(this.endpoint, country);
  }

  updateCountry(id: string, country: Partial<Country>): Observable<Country> {
    return this.patchWithJsonLd<Country>(`${this.endpoint}/${id}`, country);
  }

  deleteCountry(id: string): Observable<void> {
    return this.deleteWithJsonLd<void>(`${this.endpoint}/${id}`);
  }
}
