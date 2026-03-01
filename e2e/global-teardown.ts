import { FullConfig } from '@playwright/test';
import * as fs from 'fs';

const AUTH_FILE = 'e2e/.auth/user.json';
const API_BASE = 'http://localhost:8000/api/v1';
const LOGIN_URL = 'http://localhost:8000/api/login_check';

/**
 * Global Teardown — cleans up E2E test data after all tests complete.
 * Acquires a fresh JWT token via API login, then deletes any records matching "E2E" prefix.
 */

async function acquireFreshToken(): Promise<string | null> {
  try {
    const response = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin@starlinger.com',
        password: 'recouser123!',
      }),
    });
    if (!response.ok) {
      console.log(`  Login failed: ${response.status} ${response.statusText}`);
      return null;
    }
    const data = await response.json();
    return data.token || null;
  } catch (err) {
    console.log(`  Login error: ${(err as Error).message}`);
    return null;
  }
}

function getSavedToken(): string | null {
  try {
    const data = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));
    const origin = data.origins?.find((o: any) => o.localStorage);
    const tokenEntry = origin?.localStorage?.find((e: any) => e.name === 'auth_token');
    return tokenEntry?.value || null;
  } catch {
    return null;
  }
}

async function deleteMatchingRecords(
  endpoint: string,
  token: string,
  matchField: string = 'name'
): Promise<number> {
  let deleted = 0;

  try {
    const listResponse = await fetch(`${API_BASE}${endpoint}?itemsPerPage=500`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/ld+json',
      },
    });

    if (!listResponse.ok) {
      console.log(`  ${endpoint}: list failed (HTTP ${listResponse.status})`);
      return 0;
    }

    const data = await listResponse.json();
    const items = data.member || data['hydra:member'] || [];

    for (const item of items) {
      const fieldValue = item[matchField] || item.title || item.firstName || '';
      const lower = typeof fieldValue === 'string' ? fieldValue.toLowerCase() : '';
      if (lower.includes('e2e') || lower.startsWith('edited_')) {
        const deleteResponse = await fetch(`${API_BASE}${endpoint}/${item.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/ld+json',
          },
        });

        if (deleteResponse.ok || deleteResponse.status === 204) {
          deleted++;
        } else {
          console.log(`  ${endpoint}/${item.id}: delete failed (HTTP ${deleteResponse.status})`);
        }
      }
    }
  } catch (err) {
    console.log(`  ${endpoint}: error (${(err as Error).message})`);
  }

  return deleted;
}

async function globalTeardown(config: FullConfig) {
  console.log('\n🧹 Cleaning up E2E test data...');

  // Acquire fresh token via API login (most reliable)
  let token = await acquireFreshToken();
  if (token) {
    console.log('  Authenticated via fresh login');
  } else {
    // Fall back to saved token
    token = getSavedToken();
    if (token) {
      console.log('  Using saved auth token (fresh login failed)');
    } else {
      console.log('  No auth token available — skipping cleanup');
      return;
    }
  }

  const endpoints: Array<{ path: string; field: string }> = [
    { path: '/countries', field: 'name' },
    { path: '/warehouses', field: 'name' },
    { path: '/delivery_types', field: 'name' },
    { path: '/payment_types', field: 'name' },
    { path: '/tax_types', field: 'name' },
    { path: '/discounts', field: 'name' },
    { path: '/product_groups', field: 'name' },
    { path: '/delivery_prices', field: 'name' },
    { path: '/packaging_prices', field: 'name' },
    { path: '/fuel_surcharges', field: 'name' },
    { path: '/account_groups', field: 'name' },
    { path: '/clients', field: 'name' },
    { path: '/products', field: 'name' },
    { path: '/users', field: 'firstName' },
    { path: '/documentations', field: 'title' },
  ];

  let totalDeleted = 0;

  for (const { path, field } of endpoints) {
    const count = await deleteMatchingRecords(path, token, field);
    if (count > 0) {
      console.log(`  ✓ Cleaned ${count} E2E record(s) from ${path}`);
      totalDeleted += count;
    }
  }

  if (totalDeleted > 0) {
    console.log(`\n  Total E2E records cleaned: ${totalDeleted}`);
  } else {
    console.log('  No E2E test data found to clean up');
  }
}

export default globalTeardown;
