/**
 * DHL Express booking (backend: DhlShipmentService / OrderDhlShipmentController).
 * The prefill structure is also the booking input — the admin edits it in the modal
 * and sends it back as-is.
 */

export interface DhlParty {
  companyName: string;
  fullName: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  cityName: string;
  countryCode: string;
  email: string;
  phone: string;
  vatNumber: string;
}

export interface DhlPackage {
  weight: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  trackingNumber?: string | null;
}

export interface DhlLineItem {
  orderItemId: number | null;
  partNo?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  hsCode: string;
  countryOfOrigin: string;
  netWeight: number | null;
}

export interface DhlRateQuote {
  productCode: string;
  productName: string;
  price: number | null;
  currency: string | null;
  estimatedDeliveryAt: string | null;
  pickupCutoffAt: string | null;
  requiresAgreement: boolean;
}

export interface DhlPickupInput {
  requested: boolean;
  readyTime: string;
  closeTime: string;
  location: string;
}

export type DhlLabelFormat = 'a4' | 'thermal';

export interface DhlPrefill {
  shipper: DhlParty;
  receiver: DhlParty;
  isCustomsDeclarable: boolean;
  productCode: string;
  plannedShippingDate: string;
  labelFormat: DhlLabelFormat;
  packages: DhlPackage[];
  description: string;
  incoterm: string;
  currency: string;
  declaredValue: number;
  lineItems: DhlLineItem[];
  pickup: DhlPickupInput;
  rates: DhlRateQuote[];
  rateError: string | null;
  isTestEnvironment: boolean;
  /** What the backend would still reject (missing phone, HS codes, …) */
  issues: string[];
}

export interface DhlShipment {
  id: number;
  status: 'booked' | 'cancelled';
  awb: string;
  productCode: string;
  productName: string | null;
  plannedShippingAt: string;
  isCustomsDeclarable: boolean;
  packages: DhlPackage[];
  totalWeight: string;
  shipper: DhlParty;
  receiver: DhlParty;
  /** e.g. ["label", "invoice"] */
  documentTypes: string[];
  labelFormat: DhlLabelFormat;
  price: string | null;
  currency: string | null;
  estimatedDeliveryAt: string | null;
  pickupConfirmationNumber: string | null;
  pickupReadyAt: string | null;
  pickupCloseTime: string | null;
  pickupCancelledAt: string | null;
  pickupError: string | null;
  warnings: string[];
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Order fields every booking action returns so the page never saves stale tracking/status back. */
export interface DhlOrderState {
  id: number;
  status: string;
  trackingNumber: string | null;
  trackingCarrier: string | null;
  trackingUrl: string | null;
  dispatchedAt: string | null;
}

export interface DhlBookingResponse {
  shipment: DhlShipment;
  order: DhlOrderState;
}

export interface DhlPickupBookingInput {
  date?: string;
  readyTime: string;
  closeTime: string;
  location: string;
}

/** Error body of the booking endpoints (409/422/502). */
export interface DhlApiError {
  message: string;
  errors?: string[];
  details?: string[];
  dhlReference?: string;
}

export const DHL_LABEL_FORMATS: Array<{ value: DhlLabelFormat; label: string }> = [
  { value: 'a4', label: 'A4 (laser printer)' },
  { value: 'thermal', label: '4×6" thermal label' },
];

export const DHL_INCOTERMS = ['DAP', 'DDP', 'EXW', 'FCA', 'CPT', 'CIP', 'DPU'];

/** MyDHL products the Starlinger account is priced for (EU code; dutiable code is mapped server-side). */
export const DHL_PRODUCTS: Array<{ value: string; label: string }> = [
  { value: 'U', label: 'Express Worldwide (U/P)' },
  { value: 'T', label: 'Express 12:00 (T/Y)' },
  { value: 'K', label: 'Express 9:00 (K/E)' },
  { value: 'W', label: 'Economy Select (W/H)' },
  { value: '7', label: 'Express Easy (7/8)' },
];
