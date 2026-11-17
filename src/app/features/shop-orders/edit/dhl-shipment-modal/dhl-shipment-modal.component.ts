import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '@app/ui-kit/organisms/modal/modal.component';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { BadgeComponent } from '@app/ui-kit/atoms/badge/badge.component';
import { ToggleComponent } from '@app/ui-kit/atoms/toggle/toggle.component';
import { AlertService } from '@services/alert.service';
import { SelectComponent, SelectOption } from '@app/ui-kit/atoms/select/select.component';
import {
  DHL_INCOTERMS,
  DHL_LABEL_FORMATS,
  DHL_PRODUCTS,
  DhlLabelFormat,
  DhlLineItem,
  DhlPackage,
  DhlParty,
  DhlPrefill
} from '@core/models/dhl-shipment.model';

type PartyKey = 'shipper' | 'receiver';
type PartyField = keyof DhlParty;
type PackageField = 'weight' | 'length' | 'width' | 'height';
type LineField = 'description' | 'quantity' | 'unitPrice' | 'hsCode' | 'countryOfOrigin' | 'netWeight';

/**
 * Booking form for a DHL Express shipment. Receives the backend prefill, lets the
 * admin correct it (addresses, packages, customs data, pickup) and emits the
 * edited structure to book.
 */
@Component({
  selector: 'app-dhl-shipment-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, IconComponent, BadgeComponent, ToggleComponent, SelectComponent],
  templateUrl: './dhl-shipment-modal.component.html',
  styleUrls: ['./dhl-shipment-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DhlShipmentModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() prefill: DhlPrefill | null = null;
  @Input() orderNumber = '';
  @Input() saving = false;
  /** Errors returned by the last booking attempt (backend validation or DHL). */
  @Input() errors: string[] = [];

  @Output() closeModal = new EventEmitter<void>();
  @Output() book = new EventEmitter<DhlPrefill>();

  private alertService = inject(AlertService);

  form = signal<DhlPrefill | null>(null);

  readonly parties: PartyKey[] = ['shipper', 'receiver'];
  readonly labelFormats = DHL_LABEL_FORMATS;
  readonly incotermOptions: SelectOption[] = DHL_INCOTERMS.map(i => ({ value: i, label: i }));

  readonly partyFields: Array<{ key: PartyField; label: string; required: boolean; width?: 'half' }> = [
    { key: 'companyName', label: 'Company', required: true },
    { key: 'fullName', label: 'Contact person', required: true },
    { key: 'addressLine1', label: 'Street', required: true },
    { key: 'addressLine2', label: 'Address line 2', required: false },
    { key: 'postalCode', label: 'Postal code', required: true, width: 'half' },
    { key: 'cityName', label: 'City', required: true, width: 'half' },
    { key: 'countryCode', label: 'Country (ISO-2)', required: true, width: 'half' },
    { key: 'vatNumber', label: 'VAT number', required: false, width: 'half' },
    { key: 'email', label: 'Email', required: true, width: 'half' },
    { key: 'phone', label: 'Phone', required: true, width: 'half' },
  ];

  /** Products to choose from: DHL's quotes for this route when available, otherwise the known list. */
  productOptions = computed<SelectOption[]>(() => {
    const f = this.form();
    if (!f) return [];
    const rates = f.rates.filter(r => r.price !== null || r.productCode === f.productCode);
    if (rates.length > 0) {
      return rates.map(r => ({
        value: r.productCode,
        label: r.price !== null
          ? `${r.productName} — ${this.money(r.price, r.currency)}${r.requiresAgreement ? ' (agreement)' : ''}`
          : `${r.productName} (no price)`
      }));
    }
    return DHL_PRODUCTS.map(p => ({ value: p.value, label: p.label }));
  });

  selectedRate = computed(() => {
    const f = this.form();
    return f?.rates.find(r => r.productCode === f.productCode) ?? null;
  });

  totalWeight = computed(() =>
    (this.form()?.packages ?? []).reduce((sum, p) => sum + (p.weight ?? 0), 0)
  );

  declaredValue = computed(() =>
    (this.form()?.lineItems ?? []).reduce((sum, l) => sum + (l.unitPrice || 0) * (l.quantity || 0), 0)
  );

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['prefill'] && this.prefill) {
      // Work on a copy — the parent's prefill stays pristine for a retry
      this.form.set(JSON.parse(JSON.stringify(this.prefill)));
    }
  }

  // --- field handlers -----------------------------------------------------

  updateParty(which: PartyKey, field: PartyField, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.form.update(f => f && ({ ...f, [which]: { ...f[which], [field]: value } }));
  }

  updateField(field: 'plannedShippingDate' | 'plannedShippingTime' | 'reference' | 'description', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.form.update(f => f && ({ ...f, [field]: value }));
  }

  setProduct(value: string | number): void {
    this.form.update(f => f && ({ ...f, productCode: String(value) }));
  }

  setIncoterm(value: string | number): void {
    this.form.update(f => f && ({ ...f, incoterm: String(value) }));
  }

  setLabelFormat(format: DhlLabelFormat): void {
    this.form.update(f => f && ({ ...f, labelFormat: format }));
  }

  updatePackage(index: number, field: PackageField, event: Event): void {
    const value = this.num((event.target as HTMLInputElement).value);
    this.form.update(f => f && ({
      ...f,
      packages: f.packages.map((p, i) => i === index ? { ...p, [field]: value } : p)
    }));
  }

  addPackage(): void {
    this.form.update(f => f && ({
      ...f,
      packages: [...f.packages, { weight: null, length: null, width: null, height: null }]
    }));
  }

  copyPackage(index: number): void {
    this.form.update(f => f && ({
      ...f,
      packages: [...f.packages, { ...f.packages[index], trackingNumber: null }]
    }));
  }

  removePackage(index: number): void {
    this.form.update(f => f && f.packages.length > 1
      ? { ...f, packages: f.packages.filter((_, i) => i !== index) }
      : f);
  }

  updateLine(index: number, field: LineField, event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const value: string | number | null = field === 'quantity' ? Math.max(0, Math.round(this.num(raw) ?? 0))
      : field === 'unitPrice' ? (this.num(raw) ?? 0)
      : field === 'netWeight' ? this.num(raw)
      : field === 'countryOfOrigin' ? raw.toUpperCase()
      : raw;
    this.form.update(f => f && ({
      ...f,
      lineItems: f.lineItems.map((l, i) => i === index ? { ...l, [field]: value } : l)
    }));
  }

  togglePickup(requested: boolean): void {
    this.form.update(f => f && ({ ...f, pickup: { ...f.pickup, requested } }));
  }

  updatePickup(field: 'readyTime' | 'closeTime' | 'location', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.form.update(f => f && ({ ...f, pickup: { ...f.pickup, [field]: value } }));
  }

  // --- actions ------------------------------------------------------------

  onClose(): void {
    if (!this.saving) this.closeModal.emit();
  }

  async onSubmit(): Promise<void> {
    const f = this.form();
    if (!f || this.saving) return;
    // Same "Please confirm!" step the warehouse team knows from the old parcel form.
    const ok = await this.alertService.confirm(
      'Request a DHL Express shipment for this order? A waybill and label will be created.',
      'Request DHL'
    );
    if (ok) this.book.emit(f);
  }

  // --- display helpers ----------------------------------------------------

  money(value: number | null | undefined, currency: string | null | undefined): string {
    if (value === null || value === undefined) return '—';
    return `${value.toFixed(2)} ${currency ?? ''}`.trim();
  }

  shortDate(value: string | null | undefined): string {
    if (!value) return '';
    const d = new Date(value);
    return isNaN(d.getTime()) ? value : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  shortTime(value: string | null | undefined): string {
    if (!value) return '';
    const d = new Date(value);
    return isNaN(d.getTime()) ? value : d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }

  packageLabel(p: DhlPackage): string {
    return [p.length, p.width, p.height].every(v => v) ? `${p.length}×${p.width}×${p.height} cm` : '';
  }

  lineLabel(l: DhlLineItem): string {
    return l.partNo ? `${l.partNo} — ${l.description}` : l.description;
  }

  trackByIndex(index: number): number {
    return index;
  }

  private num(raw: string): number | null {
    const v = parseFloat(String(raw).replace(',', '.'));
    return isNaN(v) || v < 0 ? null : v;
  }
}
