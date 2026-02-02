import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TaxType, TaxTypesCollection } from '@core/models/tax-type.model';
import { BaseHttpService } from './base-http.service';

@Injectable({
  providedIn: 'root'
})
export class TaxTypeService extends BaseHttpService {
  private readonly endpoint = `${this.apiUrl}/tax_types`;

  getTaxTypes(page: number = 1, itemsPerPage: number = 100): Observable<TaxTypesCollection> {
    const params = this.buildParams({ page, itemsPerPage });
    return this.getWithJsonLd<TaxTypesCollection>(this.endpoint, params);
  }

  getTaxTypeById(id: string): Observable<TaxType> {
    return this.getWithJsonLd<TaxType>(`${this.endpoint}/${id}`);
  }

  createTaxType(taxType: Partial<TaxType>): Observable<TaxType> {
    return this.postWithJsonLd<TaxType>(this.endpoint, taxType);
  }

  updateTaxType(id: string, taxType: Partial<TaxType>): Observable<TaxType> {
    return this.patchWithJsonLd<TaxType>(`${this.endpoint}/${id}`, taxType);
  }

  deleteTaxType(id: string): Observable<void> {
    return this.deleteWithJsonLd<void>(`${this.endpoint}/${id}`);
  }
}
