import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OrderErpService } from './order-erp.service';
import { OrderErpSendResponse, OrderErpState } from '@core/models/order-erp.model';
import { environment } from '@env/environment';

describe('OrderErpService', () => {
  let service: OrderErpService;
  let httpMock: HttpTestingController;
  const ordersUrl = `${environment.apiBaseUrl}/api/v1/orders`;

  const state: OrderErpState = {
    mode: 'log', status: null, attempts: 0, error: null, erpReference: null, abasReference: null,
    sentAt: null, resultAt: null, confirmedAt: null, deliveryCost: 25, problems: [],
    payload: { headData: { shopOrderNbr: '100123' } }, canSend: true, logs: []
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OrderErpService]
    });
    service = TestBed.inject(OrderErpService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('loads the ERP state of an order', () => {
    let result: OrderErpState | undefined;
    service.get(12).subscribe(s => (result = s));

    const req = httpMock.expectOne(`${ordersUrl}/12/erp`);
    expect(req.request.method).toBe('GET');
    req.flush(state);

    expect(result?.canSend).toBeTrue();
  });

  it('sends the order with an empty POST', () => {
    let result: OrderErpSendResponse | undefined;
    service.send(12).subscribe(r => (result = r));

    const req = httpMock.expectOne(`${ordersUrl}/12/erp/send`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBeNull();
    req.flush({ ...state, result: 'logged', status: 'logged', canSend: true });

    expect(result?.result).toBe('logged');
  });

  it('fetches an order document as a PDF blob, prefixing the relative API path', () => {
    let blob: Blob | undefined;
    service.downloadDocument('/api/v1/orders/12/documents/3').subscribe(b => (blob = b));

    const req = httpMock.expectOne(`${ordersUrl}/12/documents/3`);
    expect(req.request.responseType).toBe('blob');
    expect(req.request.headers.get('Accept')).toBe('application/pdf');
    req.flush(new Blob(['%PDF-1.4'], { type: 'application/pdf' }));

    expect(blob?.type).toBe('application/pdf');
  });

  it('keeps an absolute document URL as is', () => {
    service.downloadDocument('https://api.example.test/api/v1/orders/1/documents/2').subscribe();
    httpMock.expectOne('https://api.example.test/api/v1/orders/1/documents/2').flush(new Blob());
  });
});
