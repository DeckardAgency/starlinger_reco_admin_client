# E2E Testing Guide

This guide covers the End-to-End testing setup for the RECO Admin Client.

## Overview

The E2E tests use **Playwright** with a **Page Object Model (POM)** pattern for maintainable, reusable test code.

## Test Structure

```
e2e/
├── pages/                    # Page Object Models
│   ├── base.page.ts         # Base page with common methods
│   ├── login.page.ts        # Login page object
│   ├── admin-module.page.ts # Generic admin module POM
│   ├── crud-list.page.ts    # CRUD list page object
│   ├── crud-form.page.ts    # CRUD form page object
│   └── index.ts             # Exports all page objects
├── fixtures/                 # Test fixtures and data
│   ├── auth.fixture.ts      # Authentication fixture
│   └── test-data.ts         # Test data configurations
├── .auth/                    # Auth state storage (gitignored)
├── auth.spec.ts             # Authentication tests
├── simple-crud.spec.ts      # Simple CRUD modules (POM-based)
├── users.spec.ts            # Users module tests
├── products.spec.ts         # Products module tests
├── accounts.spec.ts         # Accounts module tests
├── contacts.spec.ts         # Contacts module tests
├── shop-orders.spec.ts      # Shop Orders (read-only) tests
├── active-inquiries.spec.ts # Active Inquiries (read-only) tests
└── README.md                # This file
```

## Running Tests

### Prerequisites

1. **Start the backend server:**
   ```bash
   cd ../starlinger_reco_backend_api
   php -S localhost:8000 -t public
   ```

2. **Start the frontend server:**
   ```bash
   cd starlinger_reco_admin_client
   npm run start -- --port 4201
   ```

### Run All Tests

```bash
npx playwright test
```

### Run Specific Test File

```bash
npx playwright test simple-crud.spec.ts
```

### Run Tests with UI

```bash
npx playwright test --ui
```

### Run Tests in Debug Mode

```bash
npx playwright test --debug
```

### Run Tests with HTML Report

```bash
npx playwright test --reporter=html
npx playwright show-report
```

## Test Categories

### 1. Authentication Tests (`auth.spec.ts`)
- Login with valid credentials
- Login with invalid credentials
- Session persistence
- Redirect to login for unauthenticated users

### 2. Simple CRUD Modules (`simple-crud.spec.ts`)
Uses the generic `AdminModulePage` POM to test:
- Countries
- Warehouses
- Delivery Types
- Payment Types
- Tax Types
- Discounts
- Product Groups
- Delivery Prices
- Packaging Prices
- Fuel Surcharges

Each module has 8 tests:
1. List view displays data
2. Navigate to create form
3. Create new item
4. Navigate to edit page
5. Edit existing item
6. Delete item
7. Search/filter
8. Cancel and go back

### 3. Complex Module Tests
These modules have custom logic that requires dedicated test files:

- **Users** (`users.spec.ts`) - Role selection, password handling
- **Products** (`products.spec.ts`) - Tabs, toggles, related products
- **Accounts** (`accounts.spec.ts`) - Tabs, contacts, addresses
- **Contacts** (`contacts.spec.ts`) - Toggle states

### 4. Read-Only Module Tests
- **Shop Orders** (`shop-orders.spec.ts`) - List, tabs, export
- **Active Inquiries** (`active-inquiries.spec.ts`) - Card grid display

## Page Object Model

### AdminModulePage

The generic POM for simple CRUD modules:

```typescript
import { AdminModulePage, MODULE_CONFIGS } from './pages';

const modulePage = new AdminModulePage(page, MODULE_CONFIGS.countries);

// Navigation
await modulePage.gotoList();
await modulePage.gotoCreate();
await modulePage.clickAdd();
await modulePage.clickEdit(0);

// Form interactions
await modulePage.fillField('Enter name', 'Test');
await modulePage.selectOption(0);
await modulePage.saveAndExpectList();

// List interactions
await modulePage.search('query');
const rowIndex = await modulePage.findRowWithText('E2E');
await modulePage.clickDelete(rowIndex);
```

### Adding a New Module

1. Add config to `admin-module.page.ts`:
```typescript
export const MODULE_CONFIGS = {
  // ...
  newModule: {
    name: 'New Module',
    listPath: 'new-module',
    apiEndpoint: '/new_modules',
    formFields: [
      { name: 'name', placeholder: 'Enter name', required: true },
      { name: 'description', placeholder: 'Enter description' },
    ],
  },
};
```

2. Add to `SIMPLE_CRUD_MODULES` in `simple-crud.spec.ts`:
```typescript
const SIMPLE_CRUD_MODULES = [
  // ...
  'newModule',
];
```

## Authentication

Tests use a global setup to authenticate once and reuse the session:

1. `global-setup.ts` logs in and saves auth state to `.auth/user.json`
2. Tests use the saved auth state via `storageState` config
3. Auth state is cached for the test session

### Test Credentials

```
Email: super@starlinger.com
Password: recouser123!
```

## Best Practices

### 1. Use Page Objects
Always use page objects instead of raw selectors:
```typescript
// Good
await modulePage.clickAdd();

// Avoid
await page.locator('button:has-text("Add")').click();
```

### 2. Wait for Data
Use explicit waits for API responses:
```typescript
await page.waitForResponse(
  resp => resp.url().includes('/api') && resp.status() === 200
);
```

### 3. Handle Missing Data
Skip tests gracefully when test data doesn't exist:
```typescript
if (rowIndex === -1) {
  test.skip(true, 'No test data found');
  return;
}
```

### 4. Use Test Data Prefixes
Mark test data with 'E2E' prefix for easy cleanup:
```typescript
const testData = {
  name: `E2E Test ${Date.now()}`,
};
```

### 5. Clean Up Test Data
Delete test data at the end of test runs to prevent accumulation.

## Troubleshooting

### Tests Timing Out
- Check if servers are running
- Increase timeout in `playwright.config.ts`
- Use `--debug` flag to see what's happening

### Authentication Failures
- Delete `.auth/user.json` and re-run
- Verify credentials are correct
- Check if backend is responding

### Flaky Tests
- Add explicit waits for data loading
- Use `toPass()` for polling assertions
- Check for race conditions

## Configuration

See `playwright.config.ts` for:
- Browser settings
- Timeout configurations
- Base URL
- Screenshot/video settings
- Retry policies
