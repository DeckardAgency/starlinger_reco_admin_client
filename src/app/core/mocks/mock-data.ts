/**
 * Mock Data for RECO Client Development
 *
 * Test Users:
 * - super@test.com / password123 - Super Admin (Starlinger Admin)
 * - admin@test.com / password123 - Customer Admin
 * - user@test.com / password123 - Customer
 */

import { QuickActionCardData } from '@app/ui-kit/molecules/quick-action-card/quick-action-card.component';
import { OrderCardData } from '@app/ui-kit/molecules/order-card/order-card.component';

// =============================================================================
// MOCK USERS
// =============================================================================

export const mockUsers = {
  superAdmin: {
    id: 'usr-001',
    email: 'super@test.com',
    roles: ['ROLE_USER', 'ROLE_ADMIN'],
    firstName: 'Max',
    lastName: 'Starlinger',
    phoneNumber: '+43 1 234 5678',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-12-01T00:00:00Z'
  },
  customerAdmin: {
    id: 'usr-002',
    email: 'admin@test.com',
    roles: ['ROLE_USER', 'ROLE_CLIENT_ADMIN'],
    firstName: 'Anna',
    lastName: 'Müller',
    phoneNumber: '+49 30 123 4567',
    isActive: true,
    createdAt: '2024-02-15T00:00:00Z',
    updatedAt: '2024-11-20T00:00:00Z',
    client: {
      '@id': '/api/v1/clients/client-001',
      '@type': 'Client',
      id: 'client-001',
      name: 'Plastics GmbH',
      code: 'PLG',
      isActive: true,
      isArchived: false,
      maxActiveUsers: 10
    }
  },
  customer: {
    id: 'usr-003',
    email: 'user@test.com',
    roles: ['ROLE_USER', 'ROLE_CLIENT'],
    firstName: 'Thomas',
    lastName: 'Schmidt',
    phoneNumber: '+49 89 987 6543',
    isActive: true,
    createdAt: '2024-03-10T00:00:00Z',
    updatedAt: '2024-10-15T00:00:00Z',
    client: {
      '@id': '/api/v1/clients/client-001',
      '@type': 'Client',
      id: 'client-001',
      name: 'Plastics GmbH',
      code: 'PLG',
      isActive: true,
      isArchived: false,
      maxActiveUsers: 10
    }
  }
};

// =============================================================================
// MOCK CLIENTS / ACCOUNTS
// =============================================================================

export const mockClients = [
  {
    '@id': '/api/v1/clients/client-001',
    '@type': 'Client',
    id: 'client-001',
    name: 'Plastics GmbH',
    code: 'PLG',
    email: 'info@plastics-gmbh.de',
    phone: '+49 30 123 4567',
    address: 'Industriestraße 15, 10115 Berlin, Germany',
    isActive: true,
    isArchived: false,
    maxActiveUsers: 10,
    createdAt: '2023-01-15T00:00:00Z'
  },
  {
    '@id': '/api/v1/clients/client-002',
    '@type': 'Client',
    id: 'client-002',
    name: 'Recycling Solutions AG',
    code: 'RSA',
    email: 'contact@recycling-solutions.ch',
    phone: '+41 44 567 8901',
    address: 'Bahnhofstrasse 42, 8001 Zürich, Switzerland',
    isActive: true,
    isArchived: false,
    maxActiveUsers: 15,
    createdAt: '2023-03-20T00:00:00Z'
  },
  {
    '@id': '/api/v1/clients/client-003',
    '@type': 'Client',
    id: 'client-003',
    name: 'EcoPlast Industries',
    code: 'EPI',
    email: 'sales@ecoplast.at',
    phone: '+43 1 234 5678',
    address: 'Mariahilfer Straße 88, 1070 Wien, Austria',
    isActive: true,
    isArchived: false,
    maxActiveUsers: 8,
    createdAt: '2023-06-10T00:00:00Z'
  }
];

// =============================================================================
// MOCK PRODUCTS
// =============================================================================

export const mockProducts = [
  {
    '@id': '/api/v1/products/prod-001',
    '@type': 'Product',
    id: 'prod-001',
    sku: 'STL-BRG-001',
    name: 'Bearing Assembly',
    description: 'High-precision bearing assembly for recycling lines',
    price: 245.00,
    currency: 'EUR',
    stock: 150,
    category: 'Bearings',
    isActive: true,
    createdAt: '2024-01-10T00:00:00Z'
  },
  {
    '@id': '/api/v1/products/prod-002',
    '@type': 'Product',
    id: 'prod-002',
    sku: 'STL-MTR-002',
    name: 'Drive Motor 5.5kW',
    description: 'Industrial drive motor for extruder systems',
    price: 1850.00,
    currency: 'EUR',
    stock: 25,
    category: 'Motors',
    isActive: true,
    createdAt: '2024-01-15T00:00:00Z'
  },
  {
    '@id': '/api/v1/products/prod-003',
    '@type': 'Product',
    id: 'prod-003',
    sku: 'STL-FLT-003',
    name: 'Filter Screen Pack',
    description: 'Replacement filter screens for pelletizing systems',
    price: 89.50,
    currency: 'EUR',
    stock: 500,
    category: 'Filters',
    isActive: true,
    createdAt: '2024-02-01T00:00:00Z'
  },
  {
    '@id': '/api/v1/products/prod-004',
    '@type': 'Product',
    id: 'prod-004',
    sku: 'STL-BLD-004',
    name: 'Cutting Blade Set',
    description: 'Hardened steel cutting blades for granulators',
    price: 425.00,
    currency: 'EUR',
    stock: 75,
    category: 'Blades',
    isActive: true,
    createdAt: '2024-02-15T00:00:00Z'
  },
  {
    '@id': '/api/v1/products/prod-005',
    '@type': 'Product',
    id: 'prod-005',
    sku: 'STL-HTR-005',
    name: 'Barrel Heater Band',
    description: 'Ceramic heater band for extruder barrels',
    price: 315.00,
    currency: 'EUR',
    stock: 120,
    category: 'Heaters',
    isActive: true,
    createdAt: '2024-03-01T00:00:00Z'
  }
];

// =============================================================================
// MOCK ORDERS
// =============================================================================

export const mockOrders = [
  {
    '@id': '/api/v1/orders/ord-001',
    '@type': 'Order',
    id: 'ord-001',
    orderNumber: 'ORD-2024-001',
    status: 'completed',
    totalAmount: 2450.00,
    currency: 'EUR',
    createdAt: '2024-11-15T10:30:00Z',
    updatedAt: '2024-11-20T14:00:00Z',
    user: {
      firstName: 'Thomas',
      lastName: 'Schmidt',
      email: 'thomas@plastics-gmbh.de',
      client: { companyName: 'Plastics GmbH' }
    },
    items: [
      { product: 'Bearing Assembly', quantity: 10, unitPrice: 245.00 }
    ]
  },
  {
    '@id': '/api/v1/orders/ord-002',
    '@type': 'Order',
    id: 'ord-002',
    orderNumber: 'ORD-2024-002',
    status: 'processing',
    totalAmount: 5550.00,
    currency: 'EUR',
    createdAt: '2024-12-01T09:15:00Z',
    updatedAt: '2024-12-02T11:30:00Z',
    user: {
      firstName: 'Anna',
      lastName: 'Müller',
      email: 'anna@plastics-gmbh.de',
      client: { companyName: 'Plastics GmbH' }
    },
    items: [
      { product: 'Drive Motor 5.5kW', quantity: 3, unitPrice: 1850.00 }
    ]
  },
  {
    '@id': '/api/v1/orders/ord-003',
    '@type': 'Order',
    id: 'ord-003',
    orderNumber: 'ORD-2024-003',
    status: 'submitted',
    totalAmount: 895.00,
    currency: 'EUR',
    createdAt: '2024-12-10T14:45:00Z',
    updatedAt: '2024-12-10T14:45:00Z',
    user: {
      firstName: 'Michael',
      lastName: 'Weber',
      email: 'michael@recycling-solutions.ch',
      client: { companyName: 'Recycling Solutions AG' }
    },
    items: [
      { product: 'Filter Screen Pack', quantity: 10, unitPrice: 89.50 }
    ]
  },
  {
    '@id': '/api/v1/orders/ord-004',
    '@type': 'Order',
    id: 'ord-004',
    orderNumber: 'ORD-2024-004',
    status: 'dispatched',
    totalAmount: 1275.00,
    currency: 'EUR',
    createdAt: '2024-12-05T08:00:00Z',
    updatedAt: '2024-12-08T16:30:00Z',
    user: {
      firstName: 'Lisa',
      lastName: 'Bauer',
      email: 'lisa@ecoplast.at',
      client: { companyName: 'EcoPlast Industries' }
    },
    items: [
      { product: 'Cutting Blade Set', quantity: 3, unitPrice: 425.00 }
    ]
  },
  {
    '@id': '/api/v1/orders/ord-005',
    '@type': 'Order',
    id: 'ord-005',
    orderNumber: 'ORD-2024-005',
    status: 'confirmed',
    totalAmount: 3150.00,
    currency: 'EUR',
    createdAt: '2024-12-12T11:20:00Z',
    updatedAt: '2024-12-13T09:00:00Z',
    user: {
      firstName: 'Thomas',
      lastName: 'Schmidt',
      email: 'thomas@plastics-gmbh.de',
      client: { companyName: 'Plastics GmbH' }
    },
    items: [
      { product: 'Barrel Heater Band', quantity: 10, unitPrice: 315.00 }
    ]
  }
];

// =============================================================================
// MOCK DASHBOARD DATA
// =============================================================================

// New format for PerformanceOverviewComponent
export const mockDashboardPerformance = {
  '@context': '/api/v1/contexts/Dashboard',
  '@id': '/api/v1/dashboard/performance',
  '@type': 'DashboardPerformance',
  period: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString()
  },
  shopOrders: {
    value: 20,
    percentageChange: 123.0,
    trend: 'up' as const,
    history: [12, 15, 14, 18, 16, 19, 20]
  },
  activeCarts: {
    value: 5,
    percentageChange: 10.0,
    trend: 'up' as const,
    history: [3, 4, 4, 5, 4, 5, 5]
  },
  completedCarts: {
    value: 20,
    percentageChange: 20.0,
    trend: 'up' as const,
    history: [12, 14, 15, 17, 18, 19, 20]
  },
  totalShopRevenue: {
    value: 20504.30,
    formatted: '20.504,30 €',
    percentageChange: 93.0,
    trend: 'up' as const,
    history: [8500, 10200, 12400, 15600, 17800, 19200, 20504]
  },
  cancelledOrdersRevenue: {
    value: 8304.29,
    formatted: '8.304,29 €',
    percentageChange: 15.0,
    trend: 'up' as const,
    history: [5200, 5800, 6400, 7100, 7600, 8000, 8304]
  }
};

// Legacy format (keep for backward compatibility)
export const mockPerformanceData = {
  totalRevenue: 125430.50,
  totalOrders: 156,
  averageOrderValue: 804.04,
  revenueChange: 12.5,
  ordersChange: 8.3,
  avgOrderValueChange: 4.2
};

export const mockOrderStatusDistribution = {
  total: 156,
  distribution: [
    { status: 'draft', label: 'Draft', count: 12 },
    { status: 'submitted', label: 'Submitted', count: 28 },
    { status: 'confirmed', label: 'Confirmed', count: 35 },
    { status: 'processing', label: 'Processing', count: 22 },
    { status: 'dispatched', label: 'Dispatched', count: 18 },
    { status: 'completed', label: 'Completed', count: 38 },
    { status: 'canceled', label: 'Canceled', count: 3 }
  ]
};



// =============================================================================
// MOCK CONTACTS
// =============================================================================

export const mockContacts = [
  {
    id: 'cnt-001',
    firstName: 'Thomas',
    lastName: 'Schmidt',
    email: 'thomas@plastics-gmbh.de',
    phone: '+49 30 123 4567',
    position: 'Maintenance Manager',
    client: mockClients[0],
    isPrimary: true
  },
  {
    id: 'cnt-002',
    firstName: 'Anna',
    lastName: 'Müller',
    email: 'anna@plastics-gmbh.de',
    phone: '+49 30 123 4568',
    position: 'Purchasing',
    client: mockClients[0],
    isPrimary: false
  },
  {
    id: 'cnt-003',
    firstName: 'Michael',
    lastName: 'Weber',
    email: 'michael@recycling-solutions.ch',
    phone: '+41 44 567 8901',
    position: 'Plant Manager',
    client: mockClients[1],
    isPrimary: true
  }
];

// =============================================================================
// MOCK ADMIN CONTACTS (for Admin Contacts list page)
// =============================================================================

export const mockAdminContacts = [
  { id: 147144, firstName: 'Alexander', lastName: 'Pas', account: 'Alexander Pas', email: 'grafit.pas@grafit.net', phone: undefined },
  { id: 147145, firstName: 'Anja', lastName: 'Makas', account: 'Kuga Repora SL', email: 'emanuel@company.com', phone: undefined },
  { id: 147146, firstName: 'Paola', lastName: 'Alvarez', account: 'PET Recycling team Gmbh', email: 'eroghan@company.com', phone: '+34942835040' },
  { id: 147147, firstName: 'Christian', lastName: 'Jovanovic', account: 'Unistrap Gmbh', email: 'linda@company.com', phone: '+4366488903488' },
  { id: 147148, firstName: 'Christopher', lastName: 'Cenga', account: 'Rymoplast n.v.', email: 'allen@company.com', phone: '+4366460595847' },
  { id: 147149, firstName: 'David', lastName: 'Aerts', account: 'Unistrap Gmbh', email: 'dupton@company.com', phone: '098123456' },
  { id: 147160, firstName: 'Davor', lastName: 'Kemper', account: 'PET Recycling team', email: 'marissa@company.com', phone: undefined },
  { id: 147166, firstName: 'Erika', lastName: 'Gutierrez', account: 'Rymoplast n.v.', email: 'jason@company.com', phone: undefined },
  { id: 147142, firstName: 'Francesco', lastName: 'Lissak', account: 'Kuga Repora SL', email: 'carmen@company.com', phone: '0048533734241' },
  { id: 147131, firstName: 'Irfan', lastName: 'Nussbaumer', account: 'Kuga Repora SL', email: 'thomas@company.com', phone: '+32470595840' },
  { id: 147155, firstName: 'Lander', lastName: 'Dekkers', account: 'Unistrap Gmbh', email: 'natalie@company.com', phone: undefined },
  { id: 147189, firstName: 'Nancy', lastName: 'Roth', account: 'PET Recycling team Gmbh', email: 'paul@company.com', phone: undefined }
];

// =============================================================================
// MOCK ACCOUNTS (for Admin Accounts list page)
// =============================================================================

export const mockAccounts = [
  { id: 317330, code: '408170', oib: 'PL7151954741', name: 'Akpol Recykling Sp.z.o.o.', email: 'anes@company.com', status: 'active' as const, purchaseLimit: undefined, amountSpent: undefined },
  { id: 317331, code: '', oib: '1262330853', name: 'Alaxe Italia Recycling S.p.A.', email: 'emanuel@company.com', status: 'active' as const, purchaseLimit: undefined, amountSpent: undefined },
  { id: 317332, code: '542319', oib: 'ESAA3931358', name: 'Kugo Repara SL', email: 'eroghan@company.com', status: 'inactive' as const, purchaseLimit: 15000, amountSpent: 0 },
  { id: 317333, code: '693192', oib: 'ESAA4941362', name: 'OMT Recycling Project S.L.', email: 'linda@company.com', status: 'inactive' as const, purchaseLimit: 25000, amountSpent: 1500 },
  { id: 317334, code: '743123', oib: 'ATU72944977', name: 'PRT Rodomska', email: 'allen@company.com', status: 'active' as const, purchaseLimit: 0, amountSpent: 0 },
  { id: 317335, code: '852374', oib: 'BE043913824', name: 'Rymoplast n.v.', email: 'dupton@company.com', status: 'inactive' as const, purchaseLimit: 15000, amountSpent: 200 },
  { id: 317336, code: '912845', oib: 'PL7151954742', name: 'EcoCycle Solutions Inc.', email: 'marissa@company.com', status: 'active' as const, purchaseLimit: undefined, amountSpent: undefined },
  { id: 317337, code: '103672', oib: '1262330854', name: 'GreenTech Waste Management Co.', email: 'jason@company.com', status: 'active' as const, purchaseLimit: undefined, amountSpent: undefined },
  { id: 317338, code: '114589', oib: 'ESAA3931359', name: 'Reclaim Innovations Ltd.', email: 'carmen@company.com', status: 'inactive' as const, purchaseLimit: 15000, amountSpent: 0 },
  { id: 317339, code: '125678', oib: 'ESAA4941363', name: 'Sustainable Materials Group LLC', email: 'thomas@company.com', status: 'inactive' as const, purchaseLimit: 25000, amountSpent: 1500 },
  { id: 317340, code: '136789', oib: 'ATU72944978', name: 'TerraRenew Recycling Partners', email: 'natalie@company.com', status: 'active' as const, purchaseLimit: 0, amountSpent: 0 },
  { id: 317341, code: '147890', oib: 'BE043913825', name: 'WasteWise Environmental Services', email: 'paul@company.com', status: 'inactive' as const, purchaseLimit: undefined, amountSpent: 200 }
];

// =============================================================================
// MOCK DISCOUNTS
// =============================================================================

export const mockDiscounts = [
  {
    id: 'dsc-001',
    code: 'SUMMER24',
    description: 'Summer 2024 Promotion',
    type: 'percentage',
    value: 10,
    minOrderValue: 500,
    validFrom: '2024-06-01',
    validTo: '2024-08-31',
    isActive: false
  },
  {
    id: 'dsc-002',
    code: 'BULK15',
    description: 'Bulk Order Discount',
    type: 'percentage',
    value: 15,
    minOrderValue: 5000,
    validFrom: '2024-01-01',
    validTo: '2025-12-31',
    isActive: true
  },
  {
    id: 'dsc-003',
    code: 'NEWCLIENT',
    description: 'New Client Welcome Discount',
    type: 'fixed',
    value: 100,
    minOrderValue: 1000,
    validFrom: '2024-01-01',
    validTo: '2025-12-31',
    isActive: true
  }
];

// =============================================================================
// MOCK ADMIN DISCOUNTS (for Admin Discounts list page)
// =============================================================================

export interface AdminDiscount {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  priority: number;
  dateValidFrom: string;
  dateValidTo: string;
  selected?: boolean;
}

export const mockAdminDiscounts: AdminDiscount[] = [
  { id: '0001', name: 'ET -30%', status: 'active', priority: 0, dateValidFrom: '25/10/2024 00:00:25', dateValidTo: '01/11/2024 00:00:25' },
  { id: '0002', name: 'Black Friday -50%', status: 'active', priority: 3, dateValidFrom: '25/11/2024 00:00:11', dateValidTo: '10/11/2024 00:00:11' },
  { id: '0003', name: 'Spring -25%', status: 'active', priority: 2, dateValidFrom: '01/02/2025 00:00:19', dateValidTo: '25/02/2025 00:00:19' },
  { id: '0004', name: 'Special -50%', status: 'inactive', priority: 0, dateValidFrom: '15/03/2025 00:05:42', dateValidTo: '15/03/2025 00:05:45' }
];

// =============================================================================
// MOCK USER LIST (for Admin)
// =============================================================================

export const mockUserList = [
  mockUsers.superAdmin,
  mockUsers.customerAdmin,
  mockUsers.customer,
  {
    id: 'usr-004',
    email: 'michael@recycling-solutions.ch',
    roles: ['ROLE_USER', 'ROLE_CLIENT'],
    firstName: 'Michael',
    lastName: 'Weber',
    phoneNumber: '+41 44 567 8901',
    isActive: true,
    createdAt: '2024-04-01T00:00:00Z',
    client: mockClients[1]
  },
  {
    id: 'usr-005',
    email: 'lisa@ecoplast.at',
    roles: ['ROLE_USER', 'ROLE_CLIENT_ADMIN'],
    firstName: 'Lisa',
    lastName: 'Bauer',
    phoneNumber: '+43 1 345 6789',
    isActive: true,
    createdAt: '2024-05-15T00:00:00Z',
    client: mockClients[2]
  }
];

// =============================================================================
// MOCK COUNTRIES
// =============================================================================

export const mockCountries = [
  { id: '255', name: 'Afghanistan', code: 'AF', iso31661Alpha3Code: 'AFG', europeanUnion: false, dhlZone: 'Zone 8', defaultTaxPercent: 0 },
  { id: '256', name: 'Albania', code: 'AX', iso31661Alpha3Code: 'ALB', europeanUnion: false, dhlZone: 'Zone 5', defaultTaxPercent: 0 },
  { id: '7', name: 'Algeria', code: 'AL', iso31661Alpha3Code: 'DZA', europeanUnion: false, dhlZone: 'Zone 5', defaultTaxPercent: 0 },
  { id: '8', name: 'American Samoa', code: 'DZ', iso31661Alpha3Code: 'ASM', europeanUnion: false, dhlZone: 'Zone 4', defaultTaxPercent: 0 },
  { id: '9', name: 'Andorra', code: 'AS', iso31661Alpha3Code: 'AND', europeanUnion: false, dhlZone: 'Zone 4', defaultTaxPercent: 0 },
  { id: '10', name: 'Angola', code: 'AD', iso31661Alpha3Code: 'AGO', europeanUnion: false, dhlZone: 'Zone 5', defaultTaxPercent: 0 },
  { id: '11', name: 'Anguilla', code: 'AO', iso31661Alpha3Code: 'AIA', europeanUnion: false, dhlZone: 'Zone 6', defaultTaxPercent: 0 },
  { id: '12', name: 'Antarctica', code: 'AI', iso31661Alpha3Code: 'ATA', europeanUnion: false, dhlZone: 'Zone 6', defaultTaxPercent: 0 },
  { id: '13', name: 'Antigua and Barbuda', code: 'AQ', iso31661Alpha3Code: 'ATG', europeanUnion: false, dhlZone: 'Zone 2', defaultTaxPercent: 0 },
  { id: '14', name: 'Argentina', code: 'AG', iso31661Alpha3Code: 'ARG', europeanUnion: false, dhlZone: 'Zone 2', defaultTaxPercent: 0 },
  { id: '15', name: 'Armenia', code: 'AR', iso31661Alpha3Code: 'ARM', europeanUnion: false, dhlZone: 'Zone 1', defaultTaxPercent: 0 },
  { id: '16', name: 'Aruba', code: 'AM', iso31661Alpha3Code: 'ABW', europeanUnion: false, dhlZone: 'Zone 1', defaultTaxPercent: 0 },
  { id: '17', name: 'Australia', code: 'AW', iso31661Alpha3Code: 'AUS', europeanUnion: false, dhlZone: 'Zone 8', defaultTaxPercent: 0 },
  { id: '18', name: 'Austria', code: 'AU', iso31661Alpha3Code: 'AUT', europeanUnion: true, dhlZone: 'Zone 8', defaultTaxPercent: 20 },
  { id: '19', name: 'Azerbaijan', code: 'AT', iso31661Alpha3Code: 'AZE', europeanUnion: false, dhlZone: 'Zone 6', defaultTaxPercent: 0 },
  { id: '20', name: 'Bahamas', code: 'AZ', iso31661Alpha3Code: 'BHS', europeanUnion: false, dhlZone: 'Zone 6', defaultTaxPercent: 0 },
  { id: '21', name: 'Bahrain', code: 'BS', iso31661Alpha3Code: 'BHR', europeanUnion: false, dhlZone: 'Zone 6', defaultTaxPercent: 0 },
  { id: '22', name: 'Belgium', code: 'BE', iso31661Alpha3Code: 'BEL', europeanUnion: true, dhlZone: 'Zone 1', defaultTaxPercent: 21 },
  { id: '23', name: 'Bulgaria', code: 'BG', iso31661Alpha3Code: 'BGR', europeanUnion: true, dhlZone: 'Zone 2', defaultTaxPercent: 20 },
  { id: '24', name: 'Croatia', code: 'HR', iso31661Alpha3Code: 'HRV', europeanUnion: true, dhlZone: 'Zone 2', defaultTaxPercent: 25 },
  { id: '25', name: 'Cyprus', code: 'CY', iso31661Alpha3Code: 'CYP', europeanUnion: true, dhlZone: 'Zone 3', defaultTaxPercent: 19 },
  { id: '26', name: 'Czech Republic', code: 'CZ', iso31661Alpha3Code: 'CZE', europeanUnion: true, dhlZone: 'Zone 1', defaultTaxPercent: 21 },
  { id: '27', name: 'Denmark', code: 'DK', iso31661Alpha3Code: 'DNK', europeanUnion: true, dhlZone: 'Zone 1', defaultTaxPercent: 25 },
  { id: '28', name: 'Estonia', code: 'EE', iso31661Alpha3Code: 'EST', europeanUnion: true, dhlZone: 'Zone 2', defaultTaxPercent: 22 },
  { id: '29', name: 'Finland', code: 'FI', iso31661Alpha3Code: 'FIN', europeanUnion: true, dhlZone: 'Zone 2', defaultTaxPercent: 24 },
  { id: '30', name: 'France', code: 'FR', iso31661Alpha3Code: 'FRA', europeanUnion: true, dhlZone: 'Zone 1', defaultTaxPercent: 20 },
  { id: '31', name: 'Germany', code: 'DE', iso31661Alpha3Code: 'DEU', europeanUnion: true, dhlZone: 'Zone 1', defaultTaxPercent: 19 },
  { id: '32', name: 'Greece', code: 'GR', iso31661Alpha3Code: 'GRC', europeanUnion: true, dhlZone: 'Zone 2', defaultTaxPercent: 24 },
  { id: '33', name: 'Hungary', code: 'HU', iso31661Alpha3Code: 'HUN', europeanUnion: true, dhlZone: 'Zone 1', defaultTaxPercent: 27 },
  { id: '34', name: 'Ireland', code: 'IE', iso31661Alpha3Code: 'IRL', europeanUnion: true, dhlZone: 'Zone 2', defaultTaxPercent: 23 },
  { id: '35', name: 'Italy', code: 'IT', iso31661Alpha3Code: 'ITA', europeanUnion: true, dhlZone: 'Zone 1', defaultTaxPercent: 22 },
  { id: '36', name: 'Latvia', code: 'LV', iso31661Alpha3Code: 'LVA', europeanUnion: true, dhlZone: 'Zone 2', defaultTaxPercent: 21 },
  { id: '37', name: 'Lithuania', code: 'LT', iso31661Alpha3Code: 'LTU', europeanUnion: true, dhlZone: 'Zone 2', defaultTaxPercent: 21 },
  { id: '38', name: 'Luxembourg', code: 'LU', iso31661Alpha3Code: 'LUX', europeanUnion: true, dhlZone: 'Zone 1', defaultTaxPercent: 17 },
  { id: '39', name: 'Malta', code: 'MT', iso31661Alpha3Code: 'MLT', europeanUnion: true, dhlZone: 'Zone 3', defaultTaxPercent: 18 },
  { id: '40', name: 'Netherlands', code: 'NL', iso31661Alpha3Code: 'NLD', europeanUnion: true, dhlZone: 'Zone 1', defaultTaxPercent: 21 },
  { id: '41', name: 'Poland', code: 'PL', iso31661Alpha3Code: 'POL', europeanUnion: true, dhlZone: 'Zone 1', defaultTaxPercent: 23 },
  { id: '42', name: 'Portugal', code: 'PT', iso31661Alpha3Code: 'PRT', europeanUnion: true, dhlZone: 'Zone 2', defaultTaxPercent: 23 },
  { id: '43', name: 'Romania', code: 'RO', iso31661Alpha3Code: 'ROU', europeanUnion: true, dhlZone: 'Zone 2', defaultTaxPercent: 19 },
  { id: '44', name: 'Slovakia', code: 'SK', iso31661Alpha3Code: 'SVK', europeanUnion: true, dhlZone: 'Zone 1', defaultTaxPercent: 20 },
  { id: '45', name: 'Slovenia', code: 'SI', iso31661Alpha3Code: 'SVN', europeanUnion: true, dhlZone: 'Zone 1', defaultTaxPercent: 22 },
  { id: '46', name: 'Spain', code: 'ES', iso31661Alpha3Code: 'ESP', europeanUnion: true, dhlZone: 'Zone 2', defaultTaxPercent: 21 },
  { id: '47', name: 'Sweden', code: 'SE', iso31661Alpha3Code: 'SWE', europeanUnion: true, dhlZone: 'Zone 2', defaultTaxPercent: 25 },
  { id: '48', name: 'Switzerland', code: 'CH', iso31661Alpha3Code: 'CHE', europeanUnion: false, dhlZone: 'Zone 1', defaultTaxPercent: 7.7 },
  { id: '49', name: 'United Kingdom', code: 'GB', iso31661Alpha3Code: 'GBR', europeanUnion: false, dhlZone: 'Zone 2', defaultTaxPercent: 20 },
  { id: '50', name: 'United States', code: 'US', iso31661Alpha3Code: 'USA', europeanUnion: false, dhlZone: 'Zone 5', defaultTaxPercent: 0 }
];

// =============================================================================
// TAX TYPES
// =============================================================================

export const mockTaxTypes = [
  { id: '1', name: 'PDV 0', percent: 0, remoteId: 0, remoteCode: null },
  { id: '2', name: 'PDV 13', percent: 13, remoteId: 0, remoteCode: null },
  { id: '3', name: 'PDV 20', percent: 20, remoteId: 0, remoteCode: null },
  { id: '4', name: 'PDV 25', percent: 25, remoteId: 0, remoteCode: null },
  { id: '5', name: 'PDV 5', percent: 5, remoteId: 0, remoteCode: null }
];

// =============================================================================
// PAYMENT TYPES
// =============================================================================

// =============================================================================
// DELIVERY TYPES
// =============================================================================

// =============================================================================
// WAREHOUSES
// =============================================================================

// =============================================================================
// DELIVERY PRICES
// =============================================================================

export const mockDeliveryPrices = [
  { id: '1', name: 'Standard Zone 1', dhlZone: 'Zone 1', deliveryType: 'Standard', sizeFrom: 0, sizeTo: 5, priceBase: 5.99, stepStartsAt: 5, forEveryNextSize: 1, priceBaseStep: 1.50 },
  { id: '2', name: 'Standard Zone 2', dhlZone: 'Zone 2', deliveryType: 'Standard', sizeFrom: 0, sizeTo: 5, priceBase: 7.99, stepStartsAt: 5, forEveryNextSize: 1, priceBaseStep: 2.00 },
  { id: '3', name: 'Standard Zone 3', dhlZone: 'Zone 3', deliveryType: 'Standard', sizeFrom: 0, sizeTo: 10, priceBase: 9.99, stepStartsAt: 10, forEveryNextSize: 2, priceBaseStep: 2.50 },
  { id: '4', name: 'Express Zone 1', dhlZone: 'Zone 1', deliveryType: 'Express', sizeFrom: 0, sizeTo: 5, priceBase: 12.99, stepStartsAt: 5, forEveryNextSize: 1, priceBaseStep: 3.00 },
  { id: '5', name: 'Express Zone 2', dhlZone: 'Zone 2', deliveryType: 'Express', sizeFrom: 0, sizeTo: 5, priceBase: 15.99, stepStartsAt: 5, forEveryNextSize: 1, priceBaseStep: 3.50 },
  { id: '6', name: 'Express Zone 3', dhlZone: 'Zone 3', deliveryType: 'Express', sizeFrom: 0, sizeTo: 10, priceBase: 19.99, stepStartsAt: 10, forEveryNextSize: 2, priceBaseStep: 4.00 },
  { id: '7', name: 'Standard Zone 4', dhlZone: 'Zone 4', deliveryType: 'Standard', sizeFrom: 0, sizeTo: 15, priceBase: 12.99, stepStartsAt: 15, forEveryNextSize: 3, priceBaseStep: 3.00 },
  { id: '8', name: 'Standard Zone 5', dhlZone: 'Zone 5', deliveryType: 'Standard', sizeFrom: 0, sizeTo: 20, priceBase: 15.99, stepStartsAt: 20, forEveryNextSize: 4, priceBaseStep: 3.50 },
  { id: '9', name: 'Express Zone 4', dhlZone: 'Zone 4', deliveryType: 'Express', sizeFrom: 0, sizeTo: 15, priceBase: 24.99, stepStartsAt: 15, forEveryNextSize: 3, priceBaseStep: 5.00 },
  { id: '10', name: 'Express Zone 5', dhlZone: 'Zone 5', deliveryType: 'Express', sizeFrom: 0, sizeTo: 20, priceBase: 29.99, stepStartsAt: 20, forEveryNextSize: 4, priceBaseStep: 6.00 },
  { id: '11', name: 'Standard Zone 6', dhlZone: 'Zone 6', deliveryType: 'Standard', sizeFrom: 0, sizeTo: 25, priceBase: 19.99, stepStartsAt: 25, forEveryNextSize: 5, priceBaseStep: 4.00 },
  { id: '12', name: 'Standard Zone 7', dhlZone: 'Zone 7', deliveryType: 'Standard', sizeFrom: 0, sizeTo: 30, priceBase: 24.99, stepStartsAt: 30, forEveryNextSize: 5, priceBaseStep: 5.00 },
  { id: '13', name: 'Express Zone 6', dhlZone: 'Zone 6', deliveryType: 'Express', sizeFrom: 0, sizeTo: 25, priceBase: 34.99, stepStartsAt: 25, forEveryNextSize: 5, priceBaseStep: 7.00 },
  { id: '14', name: 'Express Zone 7', dhlZone: 'Zone 7', deliveryType: 'Express', sizeFrom: 0, sizeTo: 30, priceBase: 39.99, stepStartsAt: 30, forEveryNextSize: 5, priceBaseStep: 8.00 },
  { id: '15', name: 'Standard Zone 8', dhlZone: 'Zone 8', deliveryType: 'Standard', sizeFrom: 0, sizeTo: 35, priceBase: 29.99, stepStartsAt: 35, forEveryNextSize: 5, priceBaseStep: 6.00 },
  { id: '16', name: 'Express Zone 8', dhlZone: 'Zone 8', deliveryType: 'Express', sizeFrom: 0, sizeTo: 35, priceBase: 49.99, stepStartsAt: 35, forEveryNextSize: 5, priceBaseStep: 10.00 },
  { id: '17', name: 'Heavy Zone 1', dhlZone: 'Zone 1', deliveryType: 'Standard', sizeFrom: 35, sizeTo: 100, priceBase: 39.99, stepStartsAt: 40, forEveryNextSize: 10, priceBaseStep: 8.00 }
];

export const mockWarehouses = [
  {
    id: '1',
    name: 'Main Warehouse',
    contactPerson: 'John Smith',
    address: '123 Industrial Ave',
    city: 'Vienna',
    phone: '+43 1 234 5678',
    email: 'warehouse@example.com',
    url: 'https://warehouse.example.com',
    readyForShop: true,
    active: true,
    enableForCheckout: true,
    shortDescription: '',
    documents: [
      { id: 'doc-1', fileType: 'PDF', name: 'Floor plan.pdf', size: '2.5 MB' },
      { id: 'doc-2', fileType: 'PDF', name: 'Safety guidelines.pdf', size: '1.2 MB' }
    ]
  },
  {
    id: '2',
    name: 'Secondary Warehouse',
    contactPerson: 'Jane Doe',
    address: '456 Logistics Blvd',
    city: 'Salzburg',
    phone: '+43 662 987 6543',
    email: 'secondary@example.com',
    url: 'https://secondary.example.com',
    readyForShop: false,
    active: true,
    enableForCheckout: false,
    shortDescription: '',
    documents: []
  }
];

export const mockDeliveryTypes = [
  {
    id: '1',
    name: 'Standard Delivery',
    active: true,
    readyForShop: true,
    express: false,
    enableFreeDelivery: true,
    grossFactor: 1.0,
    order: 1,
    shortDescription: '',
    documents: [
      { id: 'doc-1', fileType: 'PDF', name: 'Delivery terms.pdf', size: '0.8 MB' },
      { id: 'doc-2', fileType: 'PDF', name: 'Shipping policy.pdf', size: '0.5 MB' }
    ]
  },
  {
    id: '2',
    name: 'Express Delivery',
    active: true,
    readyForShop: true,
    express: true,
    enableFreeDelivery: false,
    grossFactor: 1.5,
    order: 2,
    shortDescription: '',
    documents: []
  }
];

export const mockPaymentTypes = [
  {
    id: '1',
    name: 'Bank transfer',
    active: true,
    readyForShop: true,
    enableInstallments: false,
    configuration: null,
    providerCode: null,
    shortDescription: '',
    useAsDefaultBase: true,
    remoteCode: '2',
    paymentFee: 0,
    minCartTotalBase: 0,
    maxCartTotalBase: 0,
    documents: [
      { id: 'doc-1', fileType: 'PDF', name: 'Payment info.pdf', size: '1.2 MB' },
      { id: 'doc-2', fileType: 'PDF', name: 'Payment details.pdf', size: '0.7 MB' }
    ]
  },
  {
    id: '2',
    name: 'Payment by card',
    active: false,
    readyForShop: false,
    enableInstallments: true,
    configuration: null,
    providerCode: 'CARD_PROVIDER',
    shortDescription: '',
    useAsDefaultBase: false,
    remoteCode: '3',
    paymentFee: 2.5,
    minCartTotalBase: 10,
    maxCartTotalBase: 5000,
    documents: []
  }
];

export const mockFuelSurcharges = [
  { id: '0001', name: 'DHL; DHL', date: '01/06/2024', fuelSurcharge: 1.2825, deliveryType: 'DHL' },
  { id: '0002', name: 'DHL; DHL', date: '01/07/2024', fuelSurcharge: 1.2725, deliveryType: 'DHL' },
  { id: '0003', name: 'DHL; DHL', date: '01/08/2024', fuelSurcharge: 1.2825, deliveryType: 'DHL' },
  { id: '0004', name: 'DHL; DHL', date: '01/09/2024', fuelSurcharge: 1.5571, deliveryType: 'DHL' },
  { id: '0005', name: 'DHL; DHL', date: '01/10/2024', fuelSurcharge: 1.4950, deliveryType: 'DHL' },
  { id: '0006', name: 'DHL; DHL', date: '01/11/2024', fuelSurcharge: 1.5075, deliveryType: 'DHL' },
  { id: '0007', name: 'DHL; DHL', date: '01/12/2024', fuelSurcharge: 1.5425, deliveryType: 'DHL' },
  { id: '0008', name: 'DHL; DHL', date: '01/13/2024', fuelSurcharge: 1.5475, deliveryType: 'DHL' },
  { id: '0009', name: 'DHL; DHL', date: '01/14/2024', fuelSurcharge: 1.5325, deliveryType: 'DHL' }
];

// =============================================================================
// PACKAGING PRICES
// =============================================================================

export const mockPackagingPrices = [
  { id: '0001', name: 'Box; Small', sizeFrom: 0, sizeTo: 5, priceBase: 2.50 },
  { id: '0002', name: 'Box; Medium', sizeFrom: 5, sizeTo: 10, priceBase: 4.00 },
  { id: '0003', name: 'Box; Large', sizeFrom: 10, sizeTo: 20, priceBase: 6.50 },
  { id: '0004', name: 'Box; Extra Large', sizeFrom: 20, sizeTo: 50, priceBase: 12.00 },
  { id: '0005', name: 'Pallet; Standard', sizeFrom: 50, sizeTo: 100, priceBase: 25.00 },
  { id: '0006', name: 'Pallet; Euro', sizeFrom: 100, sizeTo: 200, priceBase: 35.00 },
  { id: '0007', name: 'Container; Small', sizeFrom: 200, sizeTo: 500, priceBase: 75.00 },
  { id: '0008', name: 'Container; Large', sizeFrom: 500, sizeTo: 1000, priceBase: 120.00 },
  { id: '0009', name: 'Special; Fragile', sizeFrom: 0, sizeTo: 10, priceBase: 15.00 }
];

// =============================================================================
// ADMIN USERS (User Hub)
// =============================================================================

export const mockAdminUsers = [
  { id: '0001', firstName: 'John', lastName: 'Smith', username: 'john.smith', email: 'john.smith@example.com', role: 'admin' },
  { id: '0002', firstName: 'Jane', lastName: 'Doe', username: 'jane.doe', email: 'jane.doe@example.com', role: 'editor' },
  { id: '0003', firstName: 'Michael', lastName: 'Johnson', username: 'michael.j', email: 'michael.johnson@example.com', role: 'viewer' },
  { id: '0004', firstName: 'Emily', lastName: 'Williams', username: 'emily.w', email: 'emily.williams@example.com', role: 'profis' },
  { id: '0005', firstName: 'David', lastName: 'Brown', username: 'david.brown', email: 'david.brown@example.com', role: 'admin' },
  { id: '0006', firstName: 'Sarah', lastName: 'Miller', username: 'sarah.m', email: 'sarah.miller@example.com', role: 'editor' },
  { id: '0007', firstName: 'Robert', lastName: 'Davis', username: 'robert.d', email: 'robert.davis@example.com', role: 'viewer' },
  { id: '0008', firstName: 'Lisa', lastName: 'Garcia', username: 'lisa.garcia', email: 'lisa.garcia@example.com', role: 'profis' },
  { id: '0009', firstName: 'Thomas', lastName: 'Martinez', username: 'thomas.m', email: 'thomas.martinez@example.com', role: 'editor' },
  { id: '0010', firstName: 'Jennifer', lastName: 'Anderson', username: 'jennifer.a', email: 'jennifer.anderson@example.com', role: 'admin' },
  { id: '0011', firstName: 'Christopher', lastName: 'Taylor', username: 'chris.t', email: 'chris.taylor@example.com', role: 'viewer' },
  { id: '0012', firstName: 'Amanda', lastName: 'Thomas', username: 'amanda.t', email: 'amanda.thomas@example.com', role: 'editor' },
  { id: '0013', firstName: 'Daniel', lastName: 'Jackson', username: 'daniel.j', email: 'daniel.jackson@example.com', role: 'profis' },
  { id: '0014', firstName: 'Michelle', lastName: 'White', username: 'michelle.w', email: 'michelle.white@example.com', role: 'editor' },
  { id: '0015', firstName: 'Matthew', lastName: 'Harris', username: 'matthew.h', email: 'matthew.harris@example.com', role: 'viewer' },
  { id: '0016', firstName: 'Laura', lastName: 'Martin', username: 'laura.m', email: 'laura.martin@example.com', role: 'admin' },
  { id: '0017', firstName: 'Kevin', lastName: 'Thompson', username: 'kevin.t', email: 'kevin.thompson@example.com', role: 'profis' }
];

// =============================================================================
// ORDER HISTORY (for History tables in Shop Orders / Customer Admin)
// =============================================================================

export interface OrderHistoryItem {
  id: string;
  type: 'order';
  dateCreated: string;
  internalRef: string;
  customer: {
    name: string;
    initials: string;
    avatar?: string;
  };
  partsOrdered: number;
  status: 'completed' | 'cancelled' | 'pending';
}

// Order detail for "Order" type (with products table)
export interface OrderDetailProduct {
  partNo: string;
  productName: string;
  weight: string;
  quantity: number;
  unitPrice: number;
  discount: string;
  price: number;
}

export interface OrderDetailProductGroup {
  id: string;
  name: string;
  products: OrderDetailProduct[];
  isExpanded: boolean;
}

export interface OrderDetailLogMessage {
  status: string;
  statusVariant: 'success' | 'warning' | 'info' | 'secondary' | 'danger';
  dateTime: string;
  user: string;
  message: string;
}

export interface OrderDetail {
  id: string;
  type: 'order';
  internalRef: string;
  dateCreated: string;
  partsOrdered?: number;
  status: string;
  productGroups?: OrderDetailProductGroup[];
  totalPrice?: number;
  amountPaid?: number;
  logMessages: OrderDetailLogMessage[];
}

export const mockOrderDetails: Record<string, OrderDetail> = {
  '0001': {
    id: '0001',
    type: 'order',
    internalRef: '000123-ABC',
    dateCreated: '14-03-2024',
    partsOrdered: 12,
    status: 'completed',
    productGroups: [
      {
        id: 'group-1',
        name: '200XE Winding Machine',
        isExpanded: true,
        products: [
          { partNo: 'AIVV-01152', productName: 'Power panel T30 4,3" WQVGA color touch', weight: '0,4 kg', quantity: 2, unitPrice: 556.17, discount: '10 %', price: 1112.34 },
          { partNo: 'ZME-01171D', productName: 'Modul FU-Stacofil 200XE', weight: '1,4 kg', quantity: 3, unitPrice: 442.46, discount: '20 %', price: 1327.38 },
          { partNo: 'AEPI-01072', productName: 'ABTASTKOPF f. induktives Winkelmesssystem', weight: '0,263 kg', quantity: 2, unitPrice: 868.10, discount: '–', price: 1736.36 }
        ]
      },
      {
        id: 'group-2',
        name: 'Alpha 6.0 Machine',
        isExpanded: true,
        products: [
          { partNo: 'AIHR-01039', productName: 'Heating element', weight: '1,5 kg', quantity: 3, unitPrice: 1855.01, discount: '10 %', price: 5565.03 },
          { partNo: 'VYC-00245F', productName: 'SL 6 Shuttle Wheel (6,5°) for Reed 10°', weight: '0,09 kg', quantity: 2, unitPrice: 11.54, discount: '–', price: 23.08 }
        ]
      }
    ],
    totalPrice: 9764.19,
    amountPaid: 7811.35,
    logMessages: [
      { status: 'Completed', statusVariant: 'success', dateTime: '19-03-2024 | 16:30', user: '#username', message: 'Order completed' },
      { status: 'In progress', statusVariant: 'warning', dateTime: '19-03-2024 | 16:30', user: 'Starlinger', message: 'Order in progress' },
      { status: 'Information provided', statusVariant: 'warning', dateTime: '18-03-2024 | 09:15', user: '#username', message: 'Missing information provided by the customer.' },
      { status: 'More info', statusVariant: 'warning', dateTime: '17-03-2024 | 14:45', user: 'Starlinger', message: 'Missing information requested by the admin.' },
      { status: 'In review', statusVariant: 'warning', dateTime: '16-03-2024 | 10:00', user: 'Starlinger', message: 'Order in review by the admin.' },
      { status: 'Submitted', statusVariant: 'info', dateTime: '15-03-2024 | 19:30', user: '#username', message: 'Order submitted by the customer.' }
    ]
  }
};

export const mockOrderHistory: OrderHistoryItem[] = [
  { id: '0001', type: 'order', dateCreated: '14-03-2024', internalRef: '000123-ABC', customer: { name: 'Anes Kapetanovic', initials: 'AK' }, partsOrdered: 12, status: 'completed' },
  { id: '0002', type: 'order', dateCreated: '14-03-2024', internalRef: '000987-EAD', customer: { name: 'Anes Kapetanovic', initials: 'AK' }, partsOrdered: 192, status: 'pending' },
  { id: '0003', type: 'order', dateCreated: '14-03-2024', internalRef: '004231-UGR', customer: { name: 'Martin Ertl', initials: 'ME' }, partsOrdered: 48, status: 'completed' },
  { id: '0004', type: 'order', dateCreated: '14-03-2024', internalRef: '001456-ZXY', customer: { name: 'Martin Ertl', initials: 'ME' }, partsOrdered: 36, status: 'cancelled' },
  { id: '0005', type: 'order', dateCreated: '14-03-2024', internalRef: '002789-WPQ', customer: { name: 'Anes Kapetanovic', initials: 'AK', avatar: 'assets/avatars/anes.jpg' }, partsOrdered: 24, status: 'cancelled' },
  { id: '0006', type: 'order', dateCreated: '14-03-2024', internalRef: '005678-MNB', customer: { name: 'Anes Kapetanovic', initials: 'AK' }, partsOrdered: 60, status: 'completed' },
  { id: '0007', type: 'order', dateCreated: '14-03-2024', internalRef: '003234-LJK', customer: { name: 'Ivan Jozic', initials: 'IJ' }, partsOrdered: 72, status: 'completed' },
  { id: '0008', type: 'order', dateCreated: '14-03-2024', internalRef: '007890-QWE', customer: { name: 'Mira Kulic', initials: 'MK' }, partsOrdered: 15, status: 'completed' },
  { id: '0009', type: 'order', dateCreated: '14-03-2024', internalRef: '009876-RYT', customer: { name: 'Sofia Lichtenstein', initials: 'SL' }, partsOrdered: 84, status: 'completed' },
  { id: '0010', type: 'order', dateCreated: '14-03-2024', internalRef: '006543-PLM', customer: { name: 'Tommy Barlow', initials: 'TB' }, partsOrdered: 30, status: 'cancelled' },
  { id: '0011', type: 'order', dateCreated: '14-03-2024', internalRef: '008765-VBN', customer: { name: 'Yara Nasr', initials: 'YN' }, partsOrdered: 99, status: 'cancelled' },
  { id: '0012', type: 'order', dateCreated: '15-03-2024', internalRef: '010101-XYZ', customer: { name: 'Diana Patel', initials: 'DP' }, partsOrdered: 57, status: 'completed' },
  { id: '0013', type: 'order', dateCreated: '15-03-2024', internalRef: '011213-ABC', customer: { name: 'Roger Lee', initials: 'RL' }, partsOrdered: 81, status: 'completed' },
  { id: '0014', type: 'order', dateCreated: '16-03-2024', internalRef: '012345-DEF', customer: { name: 'Sara Wong', initials: 'SW' }, partsOrdered: 40, status: 'cancelled' },
  { id: '0015', type: 'order', dateCreated: '16-03-2024', internalRef: '013456-GHI', customer: { name: 'Jack Monroe', initials: 'JM' }, partsOrdered: 22, status: 'cancelled' },
  { id: '0016', type: 'order', dateCreated: '17-03-2024', internalRef: '014567-JKL', customer: { name: 'Clara Thompson', initials: 'CT' }, partsOrdered: 66, status: 'cancelled' },
  { id: '0017', type: 'order', dateCreated: '17-03-2024', internalRef: '015678-MNO', customer: { name: 'Zara Nguyen', initials: 'ZN' }, partsOrdered: 3, status: 'completed' }
];

// =============================================================================
// MOCK CUSTOMER ADMIN USERS
// =============================================================================

export interface CustomerAdminUser {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
  dateCreated: string;
  role: 'admin' | 'standard';
  email: string;
  status: 'active' | 'inactive';
  transactions: number;
}

export const mockCustomerAdminUsers: CustomerAdminUser[] = [
  { id: 'cu-001', name: 'Anes Kapetanovic', initials: 'AK', avatar: 'assets/avatars/anes.jpg', dateCreated: '14-03-2024', role: 'admin', email: 'anes@company.com', status: 'active', transactions: 3 },
  { id: 'cu-002', name: 'Emanuel Toy', initials: 'ET', dateCreated: '14-03-2024', role: 'standard', email: 'emanuel@company.com', status: 'active', transactions: 5 },
  { id: 'cu-003', name: 'Eleanor Rogahn', initials: 'ER', dateCreated: '14-03-2024', role: 'standard', email: 'eroghan@company.com', status: 'inactive', transactions: 2 },
  { id: 'cu-004', name: 'Linda Wisozk', initials: 'LW', dateCreated: '14-03-2024', role: 'standard', email: 'linda@company.com', status: 'inactive', transactions: 12 },
  { id: 'cu-005', name: 'Allen Miller', initials: 'AM', dateCreated: '14-03-2024', role: 'standard', email: 'allen@company.com', status: 'active', transactions: 1 },
  { id: 'cu-006', name: 'Deanna Upton', initials: 'DU', dateCreated: '14-03-2024', role: 'standard', email: 'dupton@company.com', status: 'inactive', transactions: 40 },
  { id: 'cu-007', name: 'Marcus Chen', initials: 'MC', dateCreated: '15-03-2024', role: 'standard', email: 'marcus@company.com', status: 'active', transactions: 8 },
  { id: 'cu-008', name: 'Sophie Williams', initials: 'SW', dateCreated: '16-03-2024', role: 'admin', email: 'sophie@company.com', status: 'active', transactions: 15 }
];

// =============================================================================
// MOCK SHOP PRODUCTS (Customer Shop)
// =============================================================================

export interface ShopProduct {
  id: string;
  code: string;
  name: string;
  price: number;
  image: string;
  isFavorite: boolean;
  group: string;
}

export const mockShopProducts: ShopProduct[] = [
  // Pelletizer group products
  { id: 'sp-001', code: 'Z4T-03627', name: 'ROTOR KNIFE HSS', price: 12.90, image: 'https://placehold.co/200x200/f5f5f5/666?text=Knife', isFavorite: false, group: 'pelletizer' },
  { id: 'sp-004', code: 'Z4K-06202', name: 'STATOR KNIFE', price: 14.02, image: 'https://placehold.co/200x200/f5f5f5/666?text=Knife', isFavorite: false, group: 'pelletizer' },
  { id: 'sp-005', code: 'Z4T-03628', name: 'ROTOR KNIFE HSS', price: 12.90, image: 'https://placehold.co/200x200/f5f5f5/666?text=Knife', isFavorite: false, group: 'pelletizer' },
  { id: 'sp-006', code: 'Z4T-03629', name: 'ROTOR KNIFE HSS', price: 12.90, image: 'https://placehold.co/200x200/f5f5f5/666?text=Knife', isFavorite: false, group: 'pelletizer' },
  // Electrical component group
  { id: 'sp-008', code: 'VEGA-00123', name: 'PRESSURE SENSOR', price: 156.50, image: 'https://placehold.co/200x200/f5f5f5/666?text=Sensor', isFavorite: false, group: 'electrical' },
  { id: 'sp-010', code: 'MTR-08712', name: 'DRIVE MOTOR 2.2KW', price: 890.00, image: 'https://placehold.co/200x200/f5f5f5/666?text=Motor', isFavorite: false, group: 'electrical' },
  { id: 'sp-012', code: 'HTR-09981', name: 'HEATER BAND 400W', price: 125.00, image: 'https://placehold.co/200x200/f5f5f5/666?text=Heater', isFavorite: false, group: 'electrical' },
  // Filtration group
  { id: 'sp-011', code: 'FLT-03344', name: 'FILTER SCREEN 80 MESH', price: 67.25, image: 'https://placehold.co/200x200/f5f5f5/666?text=Filter', isFavorite: false, group: 'filtration' },
  { id: 'sp-013', code: 'FLT-03345', name: 'FILTER ELEMENT 100 MESH', price: 72.50, image: 'https://placehold.co/200x200/f5f5f5/666?text=Filter', isFavorite: false, group: 'filtration' },
  // Knives group
  { id: 'sp-014', code: 'Z4T-03630', name: 'ROTOR KNIFE HSS', price: 12.90, image: 'https://placehold.co/200x200/f5f5f5/666?text=Knife', isFavorite: false, group: 'knives' },
  { id: 'sp-015', code: 'Z4T-03631', name: 'CUTTER BLADE', price: 15.40, image: 'https://placehold.co/200x200/f5f5f5/666?text=Knife', isFavorite: false, group: 'knives' },
  // Seals group
  { id: 'sp-002', code: 'AZZK-00177', name: 'SEALING DIE PLATE', price: 24.11, image: 'https://placehold.co/200x200/f5f5f5/666?text=Seal', isFavorite: false, group: 'seals' },
  { id: 'sp-003', code: 'AZZK-00356', name: 'SEALING DIE PLATE', price: 32.32, image: 'https://placehold.co/200x200/f5f5f5/666?text=Seal', isFavorite: false, group: 'seals' },
  // Category X group
  { id: 'sp-009', code: 'BRG-04521', name: 'BALL BEARING 6205', price: 45.80, image: 'https://placehold.co/200x200/f5f5f5/666?text=Bearing', isFavorite: false, group: 'category-x' },
  { id: 'sp-016', code: 'BRG-04522', name: 'BALL BEARING 6207', price: 52.90, image: 'https://placehold.co/200x200/f5f5f5/666?text=Bearing', isFavorite: false, group: 'category-x' },
  // Category Y group
  { id: 'sp-017', code: 'GKT-00123', name: 'GASKET SET', price: 28.50, image: 'https://placehold.co/200x200/f5f5f5/666?text=Gasket', isFavorite: false, group: 'category-y' },
  // Category Z group
  { id: 'sp-018', code: 'SPR-00456', name: 'SPRING ASSEMBLY', price: 34.20, image: 'https://placehold.co/200x200/f5f5f5/666?text=Spring', isFavorite: false, group: 'category-z' },
  { id: 'sp-019', code: 'SPR-00457', name: 'TENSION SPRING', price: 18.75, image: 'https://placehold.co/200x200/f5f5f5/666?text=Spring', isFavorite: false, group: 'category-z' }
];

export const mockProductGroups = [
  { id: 'pelletizer', label: 'Pelletizer' },
  { id: 'electrical', label: 'Electrical component' },
  { id: 'filtration', label: 'Filtration' },
  { id: 'category-x', label: 'Category X' },
  { id: 'category-y', label: 'Category Y' },
  { id: 'category-z', label: 'Category Z' },
  { id: 'knives', label: 'Knives' },
  { id: 'seals', label: 'Seals' }
];

// Extended Product Groups with image and total products
export interface ProductGroupExtended {
  id: string;
  name: string;
  totalProducts: number;
  imageUrl?: string;
}

export const mockProductGroupsExtended: ProductGroupExtended[] = [
  { id: 'pelletizer', name: 'Pelletizer', totalProducts: 4, imageUrl: 'https://placehold.co/268x178/f5f5f5/666?text=Pelletizer' },
  { id: 'electrical', name: 'Electrical component', totalProducts: 3 },
  { id: 'filtration', name: 'Filtration', totalProducts: 2 },
  { id: 'category-x', name: 'Category X', totalProducts: 2 },
  { id: 'category-y', name: 'Category Y', totalProducts: 1 },
  { id: 'category-z', name: 'Category Z', totalProducts: 2 },
  { id: 'knives', name: 'Knives', totalProducts: 2 },
  { id: 'seals', name: 'Seals', totalProducts: 2 }
];

// =============================================================================
// WISHLIST
// =============================================================================

export const mockWishlistItems = [
  {
    id: 'wl-001',
    productCode: 'ZME-01171D',
    productName: 'Modul frequency converter',
    imageUrl: 'https://placehold.co/120x120/f5f5f5/666?text=Module',
    price: 549.20,
    quantity: 1,
    isFavorite: true
  },
  {
    id: 'wl-002',
    productCode: 'ZME-01171D',
    productName: 'Modul frequency converter',
    imageUrl: 'https://placehold.co/120x120/f5f5f5/666?text=Converter',
    price: 549.20,
    quantity: 1,
    isFavorite: true
  },
  {
    id: 'wl-003',
    productCode: 'ZME-01171D',
    productName: 'Modul frequency converter',
    imageUrl: 'https://placehold.co/120x120/f5f5f5/666?text=Part',
    price: 549.20,
    quantity: 1,
    isFavorite: true
  },
  {
    id: 'wl-004',
    productCode: 'ZME-01171D',
    productName: 'Modul frequency converter',
    imageUrl: 'https://placehold.co/120x120/f5f5f5/666?text=Motor',
    price: 549.20,
    quantity: 1,
    isFavorite: true
  }
];


// =============================================================================
// MOCK ADMIN PRODUCTS (for Products list page)
// =============================================================================

export const mockAdminProducts = [
  { id: '0001', code: 'AIVS-01197', name: 'Analog input module', shortDescription: 'BC0083_X20BC0083; BC0083_X20BC0083', qty: 9999, qtyStep: 1 },
  { id: '0002', code: 'AIVS-01199', name: 'Block: Klotz', shortDescription: 'BM11_X20BM11; STANDARD_X20BM11', qty: 9999, qtyStep: 1 },
  { id: '0003', code: 'AESA-0002', name: 'Bus Controller', shortDescription: '3 - 12 A / 24 VDC_LUCL 12BL; (FU) 3 - 12 A / 24 VDC_LUCL 12BL', qty: 9999, qtyStep: 1 },
  { id: '0004', code: 'AESA-0001', name: 'Bus Modul', shortDescription: 'T0,15 - 0,6 A / 24 VDC_LUCB X6BL; 0,15 - 0,6 A / 24 VDC_LUCB X6BL', qty: 9999, qtyStep: 1 },
  { id: '0005', code: 'Z3I-10337A', name: 'Cartridge heater', shortDescription: '36 X D3,4 X 6,0 FT04; 36 X D3,4 X 6,0 FT04', qty: 9999, qtyStep: 1 },
  { id: '0006', code: 'AESA-0001', name: 'Control unit adjusted', shortDescription: 'DI9371_X20DI9371; DI9371_X20DI9371', qty: 9999, qtyStep: 1 },
  { id: '0007', code: 'AIVS-01197', name: 'Control unit extension', shortDescription: '24 X D3,4 X 6,0 FT04; 24 X D3,4 X 6,0 FT04', qty: 9999, qtyStep: 1 },
  { id: '0008', code: 'Z3I-10337A', name: 'Die plate', shortDescription: '1kW, 460V, 20 x 90, IP54; 1kW, 460V, 20 x 90, IP54', qty: 9999, qtyStep: 1 },
  { id: '0009', code: 'AESA-0001', name: 'Digital input module', shortDescription: 'DO8332_X20DO8332; DO8332_X20DO8332', qty: 9999, qtyStep: 1 },
  { id: '0010', code: 'AIVS-01197', name: 'Energy measurement module', shortDescription: 'D125,3 / MESH 12; D125,3 / MESH 12 / 1250my', qty: 9999, qtyStep: 1 },
  { id: '0011', code: 'AESA-0001', name: 'Fill level limit switch', shortDescription: 'D250 / MESH 25; D250 / MESH 25', qty: 9999, qtyStep: 1 },
  { id: '0012', code: 'AESA-0001', name: 'Filter blank', shortDescription: 'D250 / MESH 50/250 / 50my; D250 / MESH 50/250 / 50my', qty: 9999, qtyStep: 10 },
  { id: '0013', code: 'AIVS-01197', name: 'Filter blank', shortDescription: '80M3/MIN; AUFSTECKBAR 80M3/MIN', qty: 9999, qtyStep: 10 },
  { id: '0014', code: 'Z3I-10337A', name: 'Filter blank', shortDescription: 'NR. 618.50; NR. 618.50', qty: 9999, qtyStep: 100 },
  { id: '0015', code: 'Z3I-10337A', name: 'Filter blank', shortDescription: 'MATERIAL HSS; MATERIAL HSS', qty: 9999, qtyStep: 100 },
  { id: '0016', code: 'Z3I-10337A', name: 'Filter blank', shortDescription: 'MESSERBESTIGUNG UEBER M12', qty: 9999, qtyStep: 100 },
  { id: '0017', code: 'AESA-0001', name: 'Granulating knife', shortDescription: 'Fe-CuNi, 1/2-20 UNF, l=1,0m; Fe-CuNi, 1/2-20 UNF, l=1,0m', qty: 9999, qtyStep: 100 }
];

// =============================================================================
// MOCK MANUAL ENTRIES
// =============================================================================

export const mockManualEntries = [
  { id: '0001', type: 'order', dateCreated: '14-03-2024', internalRef: '000123-ABC', customer: { name: 'Anes Kapetanovic', initials: 'AK' }, partsOrdered: 12, status: 'completed' },
  { id: '0002', type: 'order', dateCreated: '14-03-2024', internalRef: '000987-EAD', customer: { name: 'Anes Kapetanovic', initials: 'AK' }, partsOrdered: 192, status: 'completed' },
  { id: '0003', type: 'order', dateCreated: '14-03-2024', internalRef: '004231-UGR', customer: { name: 'Martin Ertl', initials: 'ME' }, partsOrdered: 48, status: 'archived' },
  { id: '0004', type: 'order', dateCreated: '14-03-2024', internalRef: '001456-ZXY', customer: { name: 'Martin Ertl', initials: 'ME' }, partsOrdered: 36, status: 'rejected' },
  { id: '0005', type: 'order', dateCreated: '14-03-2024', internalRef: '002789-WPQ', customer: { name: 'Anes Kapetanovic', initials: 'AK', avatar: 'assets/avatars/anes.jpg' }, partsOrdered: 24, status: 'cancelled' },
  { id: '0006', type: 'order', dateCreated: '14-03-2024', internalRef: '005678-MNB', customer: { name: 'Anes Kapetanovic', initials: 'AK' }, partsOrdered: 60, status: 'completed' },
  { id: '0007', type: 'order', dateCreated: '14-03-2024', internalRef: '003234-LJK', customer: { name: 'Ivan Jozic', initials: 'IJ' }, partsOrdered: 72, status: 'completed' },
  { id: '0008', type: 'order', dateCreated: '14-03-2024', internalRef: '007890-QWE', customer: { name: 'Mira Kulic', initials: 'MK' }, partsOrdered: 15, status: 'completed' },
  { id: '0009', type: 'order', dateCreated: '14-03-2024', internalRef: '009876-RYT', customer: { name: 'Sofia Lichtenstein', initials: 'SL' }, partsOrdered: 84, status: 'completed' },
  { id: '0010', type: 'order', dateCreated: '14-03-2024', internalRef: '006543-PLM', customer: { name: 'Tommy Barlow', initials: 'TB' }, partsOrdered: 30, status: 'archived' },
  { id: '0011', type: 'order', dateCreated: '14-03-2024', internalRef: '008765-VBN', customer: { name: 'Yara Nasr', initials: 'YN' }, partsOrdered: 99, status: 'rejected' },
  { id: '0012', type: 'order', dateCreated: '14-03-2024', internalRef: '010101-XYZ', customer: { name: 'Diana Patel', initials: 'DP' }, partsOrdered: 57, status: 'completed' },
  { id: '0013', type: 'order', dateCreated: '14-03-2024', internalRef: '011213-ABC', customer: { name: 'Roger Lee', initials: 'RL' }, partsOrdered: 81, status: 'completed' },
  { id: '0014', type: 'order', dateCreated: '14-03-2024', internalRef: '012345-DEF', customer: { name: 'Sara Wong', initials: 'SW' }, partsOrdered: 40, status: 'archived' },
  { id: '0015', type: 'order', dateCreated: '14-03-2024', internalRef: '013456-GHI', customer: { name: 'Jack Monroe', initials: 'JM' }, partsOrdered: 22, status: 'rejected' },
  { id: '0016', type: 'order', dateCreated: '14-03-2024', internalRef: '014567-JKL', customer: { name: 'Clara Thompson', initials: 'CT' }, partsOrdered: 66, status: 'cancelled' },
  { id: '0017', type: 'order', dateCreated: '14-03-2024', internalRef: '015678-MNO', customer: { name: 'Zara Nguyen', initials: 'ZN' }, partsOrdered: 3, status: 'completed' }
];

// =============================================================================
// MOCK ACTIVE ORDERS
// =============================================================================

export const mockActiveOrders = [
  { id: '#0001', type: 'order', internalReference: '000123-ABC', dateCreated: '14-03-2024', partsOrdered: 12, status: 'submitted' },
  { id: '#0002', type: 'order', internalReference: '000987-EAD', dateCreated: '14-03-2024', partsOrdered: 12, status: 'submitted' },
  { id: '#0003', type: 'order', internalReference: '004231-UGR', dateCreated: '14-03-2024', partsOrdered: 12, status: 'in-review' },
  { id: '#0004', type: 'order', internalReference: '000987-EAD', dateCreated: '14-03-2024', partsOrdered: 12, status: 'more-info' },
  { id: '#0005', type: 'order', internalReference: '000123-ABC', dateCreated: '14-03-2024', partsOrdered: 12, status: 'submitted' },
  { id: '#0006', type: 'order', internalReference: '004231-UGR', dateCreated: '14-03-2024', partsOrdered: 12, status: 'dispatched' },
  { id: '#0007', type: 'order', internalReference: '000987-EAD', dateCreated: '14-03-2024', partsOrdered: 12, status: 'in-progress' }
];

// =============================================================================
// MOCK SHOP ORDERS
// =============================================================================

export const mockShopOrders = [
  { id: '0001', type: 'order', dateCreated: '14-03-2024', internalRef: '000123-ABC', customer: { name: 'Anes Kapetanovic', initials: 'AK' }, partsOrdered: 12, status: 'completed' },
  { id: '0002', type: 'order', dateCreated: '14-03-2024', internalRef: '000987-EAD', customer: { name: 'Anes Kapetanovic', initials: 'AK' }, partsOrdered: 192, status: 'completed' },
  { id: '0003', type: 'order', dateCreated: '14-03-2024', internalRef: '004231-UGR', customer: { name: 'Martin Ertl', initials: 'ME' }, partsOrdered: 48, status: 'completed' },
  { id: '0004', type: 'order', dateCreated: '14-03-2024', internalRef: '001456-ZXY', customer: { name: 'Martin Ertl', initials: 'ME' }, partsOrdered: 36, status: 'completed' },
  { id: '0005', type: 'order', dateCreated: '14-03-2024', internalRef: '002789-WPQ', customer: { name: 'Anes Kapetanovic', initials: 'AK', avatar: 'assets/avatars/anes.jpg' }, partsOrdered: 24, status: 'cancelled' },
  { id: '0006', type: 'order', dateCreated: '14-03-2024', internalRef: '005678-MNB', customer: { name: 'Anes Kapetanovic', initials: 'AK' }, partsOrdered: 60, status: 'completed' },
  { id: '0007', type: 'order', dateCreated: '14-03-2024', internalRef: '003234-LJK', customer: { name: 'Ivan Jozic', initials: 'IJ' }, partsOrdered: 72, status: 'completed' },
  { id: '0008', type: 'order', dateCreated: '14-03-2024', internalRef: '007890-QWE', customer: { name: 'Mira Kulic', initials: 'MK' }, partsOrdered: 15, status: 'completed' },
  { id: '0009', type: 'order', dateCreated: '14-03-2024', internalRef: '009876-RYT', customer: { name: 'Sofia Lichtenstein', initials: 'SL' }, partsOrdered: 84, status: 'completed' },
  { id: '0010', type: 'order', dateCreated: '14-03-2024', internalRef: '006543-PLM', customer: { name: 'Tommy Barlow', initials: 'TB' }, partsOrdered: 30, status: 'cancelled' },
  { id: '0011', type: 'order', dateCreated: '14-03-2024', internalRef: '008765-VBN', customer: { name: 'Yara Nasr', initials: 'YN' }, partsOrdered: 99, status: 'cancelled' },
  { id: '0012', type: 'order', dateCreated: '14-03-2024', internalRef: '010101-XYZ', customer: { name: 'Diana Patel', initials: 'DP' }, partsOrdered: 57, status: 'completed' },
  { id: '0013', type: 'order', dateCreated: '14-03-2024', internalRef: '011213-ABC', customer: { name: 'Roger Lee', initials: 'RL' }, partsOrdered: 81, status: 'completed' },
  { id: '0014', type: 'order', dateCreated: '14-03-2024', internalRef: '012345-DEF', customer: { name: 'Sara Wong', initials: 'SW' }, partsOrdered: 40, status: 'cancelled' },
  { id: '0015', type: 'order', dateCreated: '14-03-2024', internalRef: '013456-GHI', customer: { name: 'Jack Monroe', initials: 'JM' }, partsOrdered: 22, status: 'cancelled' },
  { id: '0016', type: 'order', dateCreated: '14-03-2024', internalRef: '014567-JKL', customer: { name: 'Clara Thompson', initials: 'CT' }, partsOrdered: 66, status: 'cancelled' },
  { id: '0017', type: 'order', dateCreated: '14-03-2024', internalRef: '015678-MNO', customer: { name: 'Zara Nguyen', initials: 'ZN' }, partsOrdered: 3, status: 'completed' }
];

// =============================================================================
// DETAIL PAGE MOCK DATA
// =============================================================================

export const mockShopOrderDetail = {
  id: '0001',
  internalRef: '000123-ABC',
  dateCreated: '14-03-2024',
  partsOrdered: 12,
  status: 'new',
  enableSale: true,
  account: 'Unistrap Gmbh - finanz.ke@starlinger.com',
  contact: 'Martina Kemper - Unistrap Gmbh',
  contactDropdown: 'martina',
  billingAddress: 'wien',
  date: '09/04/2025',
  paymentType: 'bank-transfer',
  deliveryType: 'dhl',
  priceWithoutTax: 4764.74,
  totalPrice: 5724.20,
  priceTax: 956.40,
  productGroups: [
    {
      id: 'group-1',
      name: '200XE Winding Machine',
      isExpanded: true,
      products: [
        { partNo: 'AIVV-01152', productName: 'Power panel T30 4,3" WQVGA color touch', weight: '0,4 kg', quantity: 2, unitPrice: 556.17, discount: '10 %', price: 1112.34 },
        { partNo: 'ZME-01171D', productName: 'Modul FU-Stacofil 200XE', weight: '1,4 kg', quantity: 3, unitPrice: 442.46, discount: '20 %', price: 1327.38 },
        { partNo: 'AEPI-01072', productName: 'ABTASTKOPF f. induktives Winkelmesssystem', weight: '0,263 kg', quantity: 2, unitPrice: 868.10, discount: '–', price: 1736.36 }
      ]
    },
    {
      id: 'group-2',
      name: 'Alpha 6.0 Machine',
      isExpanded: true,
      products: [
        { partNo: 'AIHR-01039', productName: 'Heating element', weight: '1,5 kg', quantity: 3, unitPrice: 1855.01, discount: '10 %', price: 5565.03 },
        { partNo: 'VYC-00245F', productName: 'SL 6 Shuttle Wheel (6,5°) for Reed 10°', weight: '0,09 kg', quantity: 2, unitPrice: 11.54, discount: '–', price: 23.08 }
      ]
    }
  ],
  orderTotal: 9764.19,
  amountPaid: 7811.352,
  logMessages: [
    { status: 'Completed', statusVariant: 'success' as const, dateTime: '19-03-2024 | 16:30', user: '#username', message: 'Order completed' },
    { status: 'In progress', statusVariant: 'warning' as const, dateTime: '19-03-2024 | 16:30', user: 'Starlinger', message: 'Order in progress' },
    { status: 'Information provided', statusVariant: 'warning' as const, dateTime: '18-03-2024 | 09:15', user: '#username', message: 'Missing information provided by the customer.' },
    { status: 'More info', statusVariant: 'warning' as const, dateTime: '17-03-2024 | 14:45', user: 'Starlinger', message: 'Missing information requested by the admin.' },
    { status: 'In review', statusVariant: 'warning' as const, dateTime: '16-03-2024 | 10:00', user: 'Starlinger', message: 'Order in review by the admin.' },
    { status: 'Submitted', statusVariant: 'info' as const, dateTime: '15-03-2024 | 19:30', user: '#username', message: 'Order submitted by the customer.' }
  ]
};

export const mockManualEntryDetail = {
  id: '0002',
  internalRef: '000123-ABC',
  dateCreated: '14-03-2024',
  status: 'new',
  enableSale: true,
  account: 'Unistrap Gmbh - finanz.ke@starlinger.com',
  contact: 'Martina Kemper - Unistrap Gmbh',
  contactDropdown: 'martina',
  billingAddress: 'wien',
  date: '09/04/2025',
  paymentType: 'bank-transfer',
  deliveryType: 'dhl',
  priceWithoutTax: 4764.74,
  totalPrice: 5724.20,
  priceTax: 956.40,
  orderParts: [
    {
      id: 'part-1',
      partNumber: 'Part 1',
      equipmentName: 'ad*StarKON Machine',
      productName: 'Power panel T30 4,3" WQVGA color touch',
      detailedDescription: 'Hello! I need a replacement part for my 200XE Winding Machine. Not sure about the exact part needed, please check the attached files for more info.',
      attachedFiles: [
        { name: 'electric_response.pdf', size: '3.4 MB', type: 'pdf' },
        { name: 'machine_side_view_99.jpg', size: '1.2 MB', type: 'image' },
        { name: 'system_error_report.xls', size: '0.3MB', type: 'spreadsheet' }
      ],
      additionalNotes: 'Please get back to us ASAP, we need this part urgent, production stopped!',
      isExpanded: true
    },
    {
      id: 'part-2',
      partNumber: 'Part 2',
      equipmentName: 'EX200 Weaving Machine',
      productName: 'Power panel T30 4,3" WQVGA color touch',
      detailedDescription: 'Hello! I need a replacement part for my 200XE Winding Machine. Not sure about the exact part needed, please check the attached files for more info.',
      attachedFiles: [
        { name: 'electric_response.pdf', size: '3.4 MB', type: 'pdf' },
        { name: 'machine_side_view_99.jpg', size: '1.2 MB', type: 'image' },
        { name: 'system_error_report.xls', size: '0.3MB', type: 'spreadsheet' }
      ],
      additionalNotes: 'Please get back to us ASAP, we need this part urgent, production stopped!',
      isExpanded: true
    }
  ],
  logMessages: [
    { status: 'Completed', statusVariant: 'success' as const, dateTime: '19-03-2024 | 16:30', user: '#username', message: 'Order completed' },
    { status: 'In progress', statusVariant: 'warning' as const, dateTime: '19-03-2024 | 16:30', user: 'Starlinger', message: 'Order in progress' },
    { status: 'Information provided', statusVariant: 'warning' as const, dateTime: '18-03-2024 | 09:15', user: '#username', message: 'Missing information provided by the customer.' },
    { status: 'More info', statusVariant: 'warning' as const, dateTime: '17-03-2024 | 14:45', user: 'Starlinger', message: 'Missing information requested by the admin.' },
    { status: 'In review', statusVariant: 'warning' as const, dateTime: '16-03-2024 | 10:00', user: 'Starlinger', message: 'Order in review by the admin.' },
    { status: 'Submitted', statusVariant: 'info' as const, dateTime: '15-03-2024 | 19:30', user: '#username', message: 'Order submitted by the customer.' }
  ]
};

export const mockCountryDetail = {
  id: '1',
  name: 'Afghanistan',
  code: 'AF',
  iso31661Alpha3Code: '-',
  dhlZone: 'zone8',
  defaultTaxPercent: 0
};

export const mockProductDetail = {
  id: '001',
  code: 'AIVS-01197',
  name: 'Analog input module',
  active: true,
  readyForShop: true,
  url: 'analog-input-module-a4922-x29a4822',
  quantity: 9999,
  quantityStep: 1.00,
  quoteItemLimit: 2.00,
  fixedQuantity: 0.00,
  weight: 'kg 0,0220',
  productGroup: 'electrical',
  catalogCode: 'AIVS-01197',
  basePrice: 284.23,
  retailPrice: 0.00,
  taxPercent: 'PDV20',
  currency: 'EUR',
  discountPercent: 0.00,
  discountPrice: 0.00,
  shortDescription: ''
};

export const mockProductAvailable = [
  { id: '1', productId: '0001', code: 'AIVS-01197', name: 'Analog input module', status: 'active', available: true },
  { id: '2', productId: '0002', code: 'AIVS-01199', name: 'Block: Klotz', status: 'active', available: true },
  { id: '3', productId: '0003', code: 'AESA-0002', name: 'Bus Controller', status: 'active', available: true },
  { id: '4', productId: '0004', code: 'AESA-0001', name: 'Bus Modul', status: 'active', available: true },
  { id: '5', productId: '0005', code: 'Z3I-10337A', name: 'Cartridge heater', status: 'active', available: true },
  { id: '6', productId: '0006', code: 'AESA-0001', name: 'Control unit adjusted', status: 'active', available: true },
  { id: '7', productId: '0007', code: 'AIVS-01197', name: 'Control unit extension', status: 'active', available: true },
  { id: '8', productId: '0008', code: 'Z3I-10337A', name: 'Die plate', status: 'active', available: true },
  { id: '9', productId: '0009', code: 'AESA-0001', name: 'Digital input module', status: 'active', available: true },
  { id: '10', productId: '0010', code: 'AIVS-01197', name: 'Energy measurement module', status: 'active', available: true },
  { id: '11', productId: '0011', code: 'AESA-0001', name: 'Fill level limit switch', status: 'active', available: true }
];

export const mockProductRelated = [
  { id: '1', productId: '0001', code: 'AIVS-01197', name: 'Analog input module', status: 'active', available: true, sortOrder: 1 },
  { id: '2', productId: '0002', code: 'AIVS-01199', name: 'Block: Klotz', status: 'active', available: true, sortOrder: 3 },
  { id: '3', productId: '0003', code: 'AESA-0002', name: 'Bus Controller', status: 'active', available: true, sortOrder: 2 }
];

export const mockProductGallery = [
  { id: '1', name: 'Image-1.jpg', url: '/images/image-placeholder-16-9.jpg', isPrimary: true },
  { id: '2', name: 'Image-2.jpg', url: '/images/image-placeholder-16-9.jpg' },
  { id: '3', name: 'Image-truncated-text.jpg', url: '/images/image-placeholder-16-9.jpg' },
  { id: '4', name: 'Image-4.jpg', url: '/images/image-placeholder-16-9.jpg' }
];

export const mockProductDocuments = [
  { id: '1', fileType: 'PDF', name: 'Product brochure.pdf', size: '1.2 MB' },
  { id: '2', fileType: 'PDF', name: 'Product warranty.pdf', size: '0.7 MB' }
];

export const mockProductAppliedDiscounts = [
  { id: '8099336', dateValidFrom: '25/10/2024 00:00:25', dateValidTo: '01/11/2024 00:00:25', discountPriceBase: '€ 198,96', discountPercent: '30,00', appliedTo: 'Recycling team Gmbh' },
  { id: '8099592', dateValidFrom: '25/11/2024 00:00:11', dateValidTo: '10/11/2024 00:00:11', discountPriceBase: '€ 220,40', discountPercent: '25,00', appliedTo: 'Rodomsko recycling' },
  { id: '8099905', dateValidFrom: '01/02/2025 00:00:19', dateValidTo: '25/02/2025 00:00:19', discountPriceBase: '€ 1.084,20', discountPercent: '15,00', appliedTo: 'General recycling group' }
];

export const mockDiscountDetail = {
  id: '1',
  name: 'ET -30%',
  active: true,
  dateFrom: '01/01/2025',
  dateTo: '01/01/2025',
  discountPercent: 30,
  priority: 0,
  accountGroups: ['group1'],
  accounts: ['acc1', 'acc2']
};

export const mockDiscountProducts = [
  { id: '1', code: 'BC0083_X20BC0083', shortDescription: 'BC0083_X20BC0083; BC0083_X20BC0083' },
  { id: '2', code: 'BC0083_X20BC0083', shortDescription: 'BC0083_X20BC0083; BC0083_X20BC0083' },
  { id: '3', code: 'BC0083_X20BC0083', shortDescription: 'BC0083_X20BC0083; BC0083_X20BC0083' },
  { id: '4', code: 'BC0083_X20BC0083', shortDescription: 'BC0083_X20BC0083; BC0083_X20BC0083' },
  { id: '5', code: 'BC0083_X20BC0083', shortDescription: 'BC0083_X20BC0083; BC0083_X20BC0083' },
  { id: '6', code: 'BC0083_X20BC0083', shortDescription: 'BC0083_X20BC0083; BC0083_X20BC0083' },
  { id: '7', code: 'BC0083_X20BC0083', shortDescription: 'BC0083_X20BC0083; BC0083_X20BC0083' },
  { id: '8', code: 'BC0083_X20BC0083', shortDescription: 'BC0083_X20BC0083; BC0083_X20BC0083' },
  { id: '9', code: 'BC0083_X20BC0083', shortDescription: 'BC0083_X20BC0083; BC0083_X20BC0083' },
  { id: '10', code: 'BC0083_X20BC0083', shortDescription: 'BC0083_X20BC0083; BC0083_X20BC0083' },
  { id: '11', code: 'BC0083_X20BC0083', shortDescription: 'BC0083_X20BC0083; BC0083_X20BC0083' },
  { id: '12', code: 'BC0083_X20BC0083', shortDescription: 'BC0083_X20BC0083; BC0083_X20BC0083' }
];

// =============================================================================
// CUSTOMER DASHBOARD MOCK DATA
// =============================================================================

export const mockCustomerQuickActions: QuickActionCardData[] = [
  {
    type: 'new-order',
    title: 'New order',
    description: 'Initiate a spare part request by completing our custom tailored ordering solutions.',
    buttonLabel: 'Create',
    routerLink: '/customer/shop'
  },
  {
    type: 'contact-sales',
    title: 'Contact Sales Manager',
    description: 'Access direct communication channel for expert support, technical consultations and order status.',
    buttonLabel: 'Contact'
  }
];

export const mockCustomerActiveOrders: OrderCardData[] = [
  { id: '#0001', type: 'order', internalReference: '000123-ABC', dateCreated: '14-03-2024', partsOrdered: 12, status: 'submitted' },
  { id: '#0002', type: 'order', internalReference: '000987-EAD', dateCreated: '14-03-2024', partsOrdered: 12, status: 'confirmed' },
  { id: '#0003', type: 'order', internalReference: '004231-UGR', dateCreated: '14-03-2024', partsOrdered: 12, status: 'in-review' }
];

export type HistoryStatus = 'completed' | 'cancelled' | 'in-review';
export type HistoryType = 'order' | 'manual';

export interface HistoryItem {
  id: string;
  type: HistoryType;
  dateCreated: string;
  internalReference: string;
  partsOrdered: number;
  status: HistoryStatus;
}

export const mockCustomerHistoryData: HistoryItem[] = [
  { id: '0001', type: 'order', dateCreated: '14-03-2024', internalReference: '000123-ABC', partsOrdered: 12, status: 'completed' },
  { id: '0002', type: 'order', dateCreated: '14-03-2024', internalReference: '000987-EAD', partsOrdered: 192, status: 'cancelled' },
  { id: '0003', type: 'manual', dateCreated: '14-03-2024', internalReference: '004231-UGR', partsOrdered: 48, status: 'completed' },
  { id: '0004', type: 'manual', dateCreated: '14-03-2024', internalReference: '001456-ZXY', partsOrdered: 36, status: 'completed' },
  { id: '0005', type: 'order', dateCreated: '14-03-2024', internalReference: '002789-WPQ', partsOrdered: 24, status: 'cancelled' },
  { id: '0006', type: 'manual', dateCreated: '14-03-2024', internalReference: '005678-MNB', partsOrdered: 60, status: 'completed' },
  { id: '0007', type: 'order', dateCreated: '14-03-2024', internalReference: '003234-LJK', partsOrdered: 72, status: 'completed' }
];

// =============================================================================
// CUSTOMER ORDER PAGE MOCK DATA
// =============================================================================

export const mockCustomerActiveOrdersExtended: OrderCardData[] = [
  { id: '#0001', type: 'order', internalReference: '000123-ABC', dateCreated: '14-03-2024', partsOrdered: 12, status: 'submitted' },
  { id: '#0002', type: 'order', internalReference: '000987-EAD', dateCreated: '14-03-2024', partsOrdered: 12, status: 'confirmed' },
  { id: '#0003', type: 'order', internalReference: '004231-UGR', dateCreated: '14-03-2024', partsOrdered: 12, status: 'in-review' },
  { id: '#0004', type: 'order', internalReference: '000987-EAD', dateCreated: '14-03-2024', partsOrdered: 12, status: 'more-info' },
  { id: '#0005', type: 'order', internalReference: '000123-ABC', dateCreated: '14-03-2024', partsOrdered: 12, status: 'submitted' },
  { id: '#0006', type: 'order', internalReference: '004231-UGR', dateCreated: '14-03-2024', partsOrdered: 12, status: 'dispatched' },
  { id: '#0007', type: 'order', internalReference: '000987-EAD', dateCreated: '14-03-2024', partsOrdered: 12, status: 'in-progress' }
];

export const mockCustomerHistoryOrdersExtended: OrderCardData[] = [
  { id: '#0008', type: 'order', internalReference: '000555-XYZ', dateCreated: '10-02-2024', partsOrdered: 8, status: 'completed' },
  { id: '#0009', type: 'order', internalReference: '000666-ABC', dateCreated: '05-02-2024', partsOrdered: 15, status: 'completed' },
  { id: '#0010', type: 'order', internalReference: '000777-DEF', dateCreated: '01-02-2024', partsOrdered: 6, status: 'cancelled' }
];

export const mockCustomerDraftOrdersExtended: OrderCardData[] = [
  { id: '#0011', type: 'order', internalReference: '000888-GHI', dateCreated: '20-03-2024', partsOrdered: 3, status: 'draft' },
  { id: '#0012', type: 'order', internalReference: '000999-JKL', dateCreated: '18-03-2024', partsOrdered: 20, status: 'draft' }
];

// =============================================================================
// COMMON ICONS (SVG strings for reuse)
// =============================================================================

export const ICON_QUICK_ACTIONS = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
  <path d="M11.6667 1.66675L3.33334 11.6667H10L8.33334 18.3334L16.6667 8.33341H10L11.6667 1.66675Z" stroke="#232323" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export const ICON_ACTIVE_ORDERS = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
  <path d="M10 7.50008V10.8334M10 14.1667H10.0083M12.5 1.66675H5C4.55798 1.66675 4.13405 1.84234 3.82149 2.1549C3.50893 2.46746 3.33334 2.89139 3.33334 3.33341V16.6667C3.33334 17.1088 3.50893 17.5327 3.82149 17.8453C4.13405 18.1578 4.55798 18.3334 5 18.3334H15C15.442 18.3334 15.866 18.1578 16.1785 17.8453C16.4911 17.5327 16.6667 17.1088 16.6667 16.6667V5.83341L12.5 1.66675Z" stroke="#232323" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export const ICON_HISTORY = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
  <path d="M11.6667 1.66675V5.00008C11.6667 5.44211 11.8423 5.86603 12.1548 6.17859C12.4674 6.49115 12.8913 6.66675 13.3333 6.66675H16.6667M7.5 12.5001L9.16667 14.1667L12.5 10.8334M12.5 1.66675H5C4.55798 1.66675 4.13405 1.84234 3.82149 2.1549C3.50893 2.46746 3.33334 2.89139 3.33334 3.33341V16.6667C3.33334 17.1088 3.50893 17.5327 3.82149 17.8453C4.13405 18.1578 4.55798 18.3334 5 18.3334H15C15.442 18.3334 15.866 18.1578 16.1785 17.8453C16.4911 17.5327 16.6667 17.1088 16.6667 16.6667V5.83341L12.5 1.66675Z" stroke="#232323" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// =============================================================================
// DEVELOPMENT USER (for auth service)
// =============================================================================

export const DUMMY_USER_CREDENTIALS = {
  email: 'recouser@starlinger.com',
  password: 'recouser123!'
};

export const mockDevelopmentUser = {
  id: 0,
  email: DUMMY_USER_CREDENTIALS.email,
  username: DUMMY_USER_CREDENTIALS.email,
  roles: ['ROLE_USER', 'ROLE_CLIENT'] as string[],
  firstName: 'Reco',
  lastName: 'Developer',
  phoneNumber: '+43 1 234 5678',
  isActive: true,
  client: {
    '@id': '/api/clients/dev-001',
    '@type': 'Client',
    id: 0,
    name: 'Starlinger Development',
    code: 'STL-DEV',
    isActive: true,
    isArchived: false,
    maxActiveUsers: 10
  }
};

// =============================================================================
// PRODUCT GENERATION HELPERS (for ProductService)
// =============================================================================

// Helper function to generate UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper function to generate random price
function randomPrice(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

// Helper function to generate random weight
function randomWeight(): string {
  const weights = ['0,2kg', '0,4kg', '0,8kg', '1,2kg', '1,5kg', '2,0kg', '3,5kg', '5,0kg', '7,5kg', '10,0kg'];
  return weights[Math.floor(Math.random() * weights.length)];
}

// Product name prefixes for variety
const PART_PREFIXES = ['AIVV', 'BCSM', 'CTRL', 'DRVS', 'ELEC', 'FILT', 'GEAR', 'HYDR', 'INSP', 'JUNC'];

const PRODUCT_NAMES = [
  'Power Panel Touch Display',
  'Control Module Unit',
  'Servo Motor Assembly',
  'Hydraulic Pump System',
  'Temperature Sensor Kit',
  'Pressure Valve Controller',
  'Electric Drive Unit',
  'Gear Box Assembly',
  'Filter Replacement Set',
  'Cable Connector Pack',
  'Main Board Controller',
  'Cooling Fan Module',
  'Belt Drive System',
  'Bearing Assembly Kit',
  'Encoder Sensor Unit',
  'Pneumatic Cylinder',
  'Safety Switch Module',
  'PLC Interface Card',
  'Frequency Inverter',
  'Relay Control Board',
  'Terminal Block Set',
  'Fuse Protection Kit',
  'Motor Starter Unit',
  'Transformer Module',
  'Capacitor Bank',
  'Resistor Array',
  'LED Indicator Panel',
  'Emergency Stop Button',
  'Hand Wheel Assembly',
  'Lubrication Pump'
];

const TECHNICAL_DESCRIPTIONS = [
  'without battery, 24VDC; 130mA; 5.5W;',
  'IP65 rated, operating temp -20°C to +60°C',
  'Max torque 15Nm, 3000 RPM, brushless',
  'Flow rate 25L/min, max pressure 350 bar',
  'Range -50°C to +200°C, accuracy ±0.5°C',
  'DN25, PN16, stainless steel body',
  'Output 5.5kW, 400V 3-phase',
  'Ratio 1:10, input speed max 1500 RPM',
  '10 micron filtration, flow 50L/min',
  'M12 connector, 5-pin, shielded',
  'ARM Cortex-M4, 32-bit, 180MHz',
  '120mm, 24VDC, 2500 RPM, 45dB',
  'Width 25mm, length 1500mm, HTD profile',
  'Bore 35mm, OD 72mm, sealed',
  '1024 PPR, incremental, TTL output',
  'Bore 40mm, stroke 200mm, double acting',
  'NC contact, 24VDC, LED indicator',
  '16 DI/16 DO, 24VDC, modular',
  '0.75kW, 400V input, 0-400Hz output',
  '8 channels, 24VDC coil, LED status',
  '12-position, 4mm², DIN rail mount',
  '10A, 250VAC, fast-blow, ceramic',
  'DOL, 7.5kW, 400V, thermal overload',
  '230V/24V, 100VA, DIN rail',
  '3x470µF, 400V, electrolytic',
  '10kΩ, 10W, wirewound, ±5%',
  '8 LEDs, red/green, 24VDC',
  'Twist release, 40mm, NC+NO',
  'Dia 80mm, graduated, 6mm bore',
  'Flow 0.5L/min, 24VDC, automatic'
];

// Generate API products with full structure
export function generateMockProducts(count: number = 30): any[] {
  const products: any[] = [];
  const baseDate = new Date('2025-01-01');

  for (let i = 0; i < count; i++) {
    const productId = generateUUID();
    const mediaId = generateUUID();
    const prefix = PART_PREFIXES[i % PART_PREFIXES.length];
    const partNumber = `${prefix}-${String(10000 + i).padStart(5, '0')}`;
    const name = partNumber.toLowerCase();
    const createdDate = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);
    const updatedDate = new Date(createdDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000);

    products.push({
      '@id': `/api/v1/products/${productId}`,
      '@type': 'Product',
      id: productId,
      name: name,
      slug: name,
      partNo: partNumber,
      shortDescription: PRODUCT_NAMES[i % PRODUCT_NAMES.length],
      unit: 'piece',
      price: randomPrice(50, 2500),
      weight: randomWeight(),
      technicalDescription: TECHNICAL_DESCRIPTIONS[i % TECHNICAL_DESCRIPTIONS.length],
      machineText: '',
      statistic: 'ET',
      featuredImage: {
        '@id': `/api/v1/media_items/${mediaId}`,
        '@type': 'MediaItem',
        id: mediaId,
        filename: `${name}-01.jpg`,
        mimeType: 'image/jpeg',
        filePath: `/uploads/${name}-01.jpg`,
        createdAt: createdDate.toISOString(),
        updatedAt: createdDate.toISOString()
      },
      createdAt: createdDate.toISOString(),
      updatedAt: updatedDate.toISOString(),
      imageGallery: [],
      documents: []
    });
  }

  return products;
}

// Pre-generated products for use in ProductService
export const mockGeneratedProducts = generateMockProducts(30);
