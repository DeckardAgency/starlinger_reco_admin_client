// Test credentials
export const TEST_USERS = {
  superAdmin: {
    email: 'super@starlinger.com',
    password: 'recouser123!',
    role: 'ROLE_SUPER_ADMIN',
  },
  admin: {
    email: 'admin@starlinger.com',
    password: 'recouser123!',
    role: 'ROLE_ADMIN',
  },
};

// CRUD module configurations
export const CRUD_MODULES = {
  countries: {
    name: 'Countries',
    listUrl: '/admin/countries/list',
    apiEndpoint: '/countries',
    testData: {
      name: 'E2E Test Country',
      code: 'E2',
    },
    updateData: {
      name: 'E2E Updated Country',
    },
  },
  warehouses: {
    name: 'Warehouses',
    listUrl: '/admin/warehouses/list',
    apiEndpoint: '/warehouses',
    testData: {
      name: 'E2E Test Warehouse',
      code: 'E2W',
    },
    updateData: {
      name: 'E2E Updated Warehouse',
    },
  },
  deliveryTypes: {
    name: 'Delivery Types',
    listUrl: '/admin/delivery-types/list',
    apiEndpoint: '/delivery_types',
    testData: {
      name: 'E2E Test Delivery',
      code: 'E2D',
    },
    updateData: {
      name: 'E2E Updated Delivery',
    },
  },
  paymentTypes: {
    name: 'Payment Types',
    listUrl: '/admin/payment-types/list',
    apiEndpoint: '/payment_types',
    testData: {
      name: 'E2E Test Payment',
      code: 'E2P',
    },
    updateData: {
      name: 'E2E Updated Payment',
    },
  },
  taxTypes: {
    name: 'Tax Types',
    listUrl: '/admin/tax-types/list',
    apiEndpoint: '/tax_types',
    testData: {
      name: 'E2E Test Tax',
      percent: '15',
    },
    updateData: {
      name: 'E2E Updated Tax',
    },
  },
  fuelSurcharges: {
    name: 'Fuel Surcharges',
    listUrl: '/admin/fuel-surcharges/list',
    apiEndpoint: '/fuel_surcharges',
    testData: {
      name: 'E2E Test Surcharge',
      percent: '5',
    },
    updateData: {
      name: 'E2E Updated Surcharge',
    },
  },
  discounts: {
    name: 'Discounts',
    listUrl: '/admin/discounts/list',
    apiEndpoint: '/discounts',
    testData: {
      name: 'E2E Test Discount',
      value: '10',
    },
    updateData: {
      name: 'E2E Updated Discount',
    },
  },
  productGroups: {
    name: 'Product Groups',
    listUrl: '/admin/product-groups/list',
    apiEndpoint: '/product_groups',
    testData: {
      name: 'E2E Test Group',
      code: 'E2G',
    },
    updateData: {
      name: 'E2E Updated Group',
    },
  },
  packagingPrices: {
    name: 'Packaging Prices',
    listUrl: '/admin/packaging-prices/list',
    apiEndpoint: '/packaging_prices',
    testData: {
      name: 'E2E Test Packaging',
      price: '10',
    },
    updateData: {
      name: 'E2E Updated Packaging',
    },
  },
  deliveryPrices: {
    name: 'Delivery Prices',
    listUrl: '/admin/delivery-prices/list',
    apiEndpoint: '/delivery_prices',
    testData: {
      name: 'E2E Test Delivery Price',
      price: '25',
    },
    updateData: {
      name: 'E2E Updated Delivery Price',
    },
  },
};

// Generate unique test identifier
export function uniqueId(): string {
  return `e2e_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

// Generate unique test data for a module
export function generateTestData(moduleName: keyof typeof CRUD_MODULES) {
  const module = CRUD_MODULES[moduleName];
  const suffix = uniqueId();
  const data: Record<string, string> = {};

  for (const [key, value] of Object.entries(module.testData)) {
    if (key === 'name') {
      data[key] = `${value} ${suffix}`;
    } else if (key === 'code') {
      data[key] = `${value}${Date.now() % 1000}`.substring(0, 10);
    } else {
      data[key] = String(value);
    }
  }

  return data;
}
