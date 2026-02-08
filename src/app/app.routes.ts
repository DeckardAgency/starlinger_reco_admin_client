import { Routes } from '@angular/router';
import { AuthGuard } from '@core/auth/auth.guard';
import { RoleGuard } from '@core/auth/role.guard';
import { USER_ROLES } from '@core/models/auth.model';

export const routes: Routes = [
  // ============================================================================
  // PUBLIC ROUTES
  // ============================================================================
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('@features/login/login.component').then(m => m.LoginComponent),
    title: 'Admin | Login'
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('@features/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    title: 'Admin | Reset Password'
  },

  // ============================================================================
  // ADMIN ROUTES (Starlinger Admin)
  // ============================================================================
  {
    path: 'admin',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN] },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('@features/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
        title: 'Admin | Dashboard'
      },

      // Accounts
      { path: 'accounts', redirectTo: 'accounts/list', pathMatch: 'full' },
      {
        path: 'accounts/list',
        loadComponent: () => import('@features/accounts/list/accounts-list.component').then(m => m.AccountsListComponent),
        title: 'Admin | Accounts'
      },
      {
        path: 'accounts/new',
        loadComponent: () => import('@features/accounts/edit/accounts-edit.component').then(m => m.AccountsEditComponent),
        title: 'Admin | New Account'
      },
      {
        path: 'accounts/:id/edit',
        loadComponent: () => import('@features/accounts/edit/accounts-edit.component').then(m => m.AccountsEditComponent),
        title: 'Admin | Account Detail'
      },

      // Account Groups
      { path: 'account-groups', redirectTo: 'account-groups/list', pathMatch: 'full' },
      {
        path: 'account-groups/list',
        loadComponent: () => import('@features/account-groups/list/account-groups-list.component').then(m => m.AccountGroupsListComponent),
        title: 'Admin | Account Groups'
      },
      {
        path: 'account-groups/new',
        loadComponent: () => import('@features/account-groups/edit/account-groups-edit.component').then(m => m.AccountGroupsEditComponent),
        title: 'Admin | New Account Group'
      },
      {
        path: 'account-groups/:id/edit',
        loadComponent: () => import('@features/account-groups/edit/account-groups-edit.component').then(m => m.AccountGroupsEditComponent),
        title: 'Admin | Account Group Detail'
      },

      // Contacts
      { path: 'contacts', redirectTo: 'contacts/list', pathMatch: 'full' },
      {
        path: 'contacts/list',
        loadComponent: () => import('@features/contacts/list/contacts-list.component').then(m => m.ContactsListComponent),
        title: 'Admin | Contacts'
      },
      {
        path: 'contacts/new',
        loadComponent: () => import('@features/contacts/edit/contacts-edit.component').then(m => m.ContactsEditComponent),
        title: 'Admin | New Contact'
      },
      {
        path: 'contacts/:id/edit',
        loadComponent: () => import('@features/contacts/edit/contacts-edit.component').then(m => m.ContactsEditComponent),
        title: 'Admin | Contact Detail'
      },

      // Shop Orders
      { path: 'shop-orders', redirectTo: 'shop-orders/list', pathMatch: 'full' },
      {
        path: 'shop-orders/list',
        loadComponent: () => import('@features/shop-orders/list/shop-orders-list.component').then(m => m.ShopOrdersListComponent),
        title: 'Admin | Shop Orders'
      },
      {
        path: 'shop-orders/new',
        loadComponent: () => import('@features/shop-orders/edit/shop-orders-edit.component').then(m => m.ShopOrdersEditComponent),
        title: 'Admin | New Shop Order'
      },
      {
        path: 'shop-orders/:id/edit',
        loadComponent: () => import('@features/shop-orders/edit/shop-orders-edit.component').then(m => m.ShopOrdersEditComponent),
        title: 'Admin | Shop Order Detail'
      },

      // Products
      { path: 'products', redirectTo: 'products/list', pathMatch: 'full' },
      {
        path: 'products/list',
        loadComponent: () => import('@features/products/list/products-list.component').then(m => m.ProductsListComponent),
        title: 'Admin | Products'
      },
      {
        path: 'products/new',
        loadComponent: () => import('@features/products/edit/products-edit.component').then(m => m.ProductsEditComponent),
        title: 'Admin | New Product'
      },
      {
        path: 'products/:id/edit',
        loadComponent: () => import('@features/products/edit/products-edit.component').then(m => m.ProductsEditComponent),
        title: 'Admin | Product Detail'
      },

      // Product Groups (Categories)
      { path: 'product-groups', redirectTo: 'product-groups/list', pathMatch: 'full' },
      {
        path: 'product-groups/list',
        loadComponent: () => import('@features/product-groups/list/product-groups-list.component').then(m => m.ProductGroupsListComponent),
        title: 'Admin | Categories'
      },
      {
        path: 'product-groups/new',
        loadComponent: () => import('@features/product-groups/edit/product-groups-edit.component').then(m => m.ProductGroupsEditComponent),
        title: 'Admin | New Category'
      },
      {
        path: 'product-groups/:id/edit',
        loadComponent: () => import('@features/product-groups/edit/product-groups-edit.component').then(m => m.ProductGroupsEditComponent),
        title: 'Admin | Category Detail'
      },

      // Discounts
      { path: 'discounts', redirectTo: 'discounts/list', pathMatch: 'full' },
      {
        path: 'discounts/list',
        loadComponent: () => import('@features/discounts/list/discounts-list.component').then(m => m.DiscountsListComponent),
        title: 'Admin | Discounts'
      },
      {
        path: 'discounts/new',
        loadComponent: () => import('@features/discounts/edit/discounts-edit.component').then(m => m.DiscountsEditComponent),
        title: 'Admin | New Discount'
      },
      {
        path: 'discounts/:id/edit',
        loadComponent: () => import('@features/discounts/edit/discounts-edit.component').then(m => m.DiscountsEditComponent),
        title: 'Admin | Discount Detail'
      },

      // Countries
      { path: 'countries', redirectTo: 'countries/list', pathMatch: 'full' },
      {
        path: 'countries/list',
        loadComponent: () => import('@features/countries/list/countries-list.component').then(m => m.CountriesListComponent),
        title: 'Admin | Countries'
      },
      {
        path: 'countries/new',
        loadComponent: () => import('@features/countries/edit/countries-edit.component').then(m => m.CountriesEditComponent),
        title: 'Admin | New Country'
      },
      {
        path: 'countries/:id/edit',
        loadComponent: () => import('@features/countries/edit/countries-edit.component').then(m => m.CountriesEditComponent),
        title: 'Admin | Country Detail'
      },

      // Tax Types
      { path: 'tax-types', redirectTo: 'tax-types/list', pathMatch: 'full' },
      {
        path: 'tax-types/list',
        loadComponent: () => import('@features/tax-types/list/tax-types-list.component').then(m => m.TaxTypesListComponent),
        title: 'Admin | Tax Types'
      },
      {
        path: 'tax-types/new',
        loadComponent: () => import('@features/tax-types/edit/tax-types-edit.component').then(m => m.TaxTypesEditComponent),
        title: 'Admin | New Tax Type'
      },
      {
        path: 'tax-types/:id/edit',
        loadComponent: () => import('@features/tax-types/edit/tax-types-edit.component').then(m => m.TaxTypesEditComponent),
        title: 'Admin | Tax Type Detail'
      },

      // Payment Types
      { path: 'payment-types', redirectTo: 'payment-types/list', pathMatch: 'full' },
      {
        path: 'payment-types/list',
        loadComponent: () => import('@features/payment-types/list/payment-types-list.component').then(m => m.PaymentTypesListComponent),
        title: 'Admin | Payment Types'
      },
      {
        path: 'payment-types/new',
        loadComponent: () => import('@features/payment-types/edit/payment-types-edit.component').then(m => m.PaymentTypesEditComponent),
        title: 'Admin | New Payment Type'
      },
      {
        path: 'payment-types/:id/edit',
        loadComponent: () => import('@features/payment-types/edit/payment-types-edit.component').then(m => m.PaymentTypesEditComponent),
        title: 'Admin | Payment Type Detail'
      },

      // Delivery Types
      { path: 'delivery-types', redirectTo: 'delivery-types/list', pathMatch: 'full' },
      {
        path: 'delivery-types/list',
        loadComponent: () => import('@features/delivery-types/list/delivery-types-list.component').then(m => m.DeliveryTypesListComponent),
        title: 'Admin | Delivery Types'
      },
      {
        path: 'delivery-types/new',
        loadComponent: () => import('@features/delivery-types/edit/delivery-types-edit.component').then(m => m.DeliveryTypesEditComponent),
        title: 'Admin | New Delivery Type'
      },
      {
        path: 'delivery-types/:id/edit',
        loadComponent: () => import('@features/delivery-types/edit/delivery-types-edit.component').then(m => m.DeliveryTypesEditComponent),
        title: 'Admin | Delivery Type Detail'
      },

      // Warehouses
      { path: 'warehouses', redirectTo: 'warehouses/list', pathMatch: 'full' },
      {
        path: 'warehouses/list',
        loadComponent: () => import('@features/warehouses/list/warehouses-list.component').then(m => m.WarehousesListComponent),
        title: 'Admin | Warehouses'
      },
      {
        path: 'warehouses/new',
        loadComponent: () => import('@features/warehouses/edit/warehouses-edit.component').then(m => m.WarehousesEditComponent),
        title: 'Admin | New Warehouse'
      },
      {
        path: 'warehouses/:id/edit',
        loadComponent: () => import('@features/warehouses/edit/warehouses-edit.component').then(m => m.WarehousesEditComponent),
        title: 'Admin | Warehouse Detail'
      },

      // Delivery Prices
      { path: 'delivery-prices', redirectTo: 'delivery-prices/list', pathMatch: 'full' },
      {
        path: 'delivery-prices/list',
        loadComponent: () => import('@features/delivery-prices/list/delivery-prices-list.component').then(m => m.DeliveryPricesListComponent),
        title: 'Admin | Delivery Prices'
      },
      {
        path: 'delivery-prices/new',
        loadComponent: () => import('@features/delivery-prices/edit/delivery-prices-edit.component').then(m => m.DeliveryPricesEditComponent),
        title: 'Admin | New Delivery Price'
      },
      {
        path: 'delivery-prices/:id/edit',
        loadComponent: () => import('@features/delivery-prices/edit/delivery-prices-edit.component').then(m => m.DeliveryPricesEditComponent),
        title: 'Admin | Delivery Price Detail'
      },

      // Users
      { path: 'users', redirectTo: 'users/list', pathMatch: 'full' },
      {
        path: 'users/list',
        loadComponent: () => import('@features/users/list/users-list.component').then(m => m.UsersListComponent),
        title: 'Admin | Users'
      },
      {
        path: 'users/new',
        loadComponent: () => import('@features/users/edit/users-edit.component').then(m => m.UsersEditComponent),
        title: 'Admin | New User'
      },
      {
        path: 'users/:id/edit',
        loadComponent: () => import('@features/users/edit/users-edit.component').then(m => m.UsersEditComponent),
        title: 'Admin | User Detail'
      },

      // Fuel Surcharges
      { path: 'fuel-surcharges', redirectTo: 'fuel-surcharges/list', pathMatch: 'full' },
      {
        path: 'fuel-surcharges/list',
        loadComponent: () => import('@features/fuel-surcharges/list/fuel-surcharges-list.component').then(m => m.FuelSurchargesListComponent),
        title: 'Admin | Fuel Surcharges'
      },
      {
        path: 'fuel-surcharges/new',
        loadComponent: () => import('@features/fuel-surcharges/edit/fuel-surcharges-edit.component').then(m => m.FuelSurchargesEditComponent),
        title: 'Admin | New Fuel Surcharge'
      },
      {
        path: 'fuel-surcharges/:id/edit',
        loadComponent: () => import('@features/fuel-surcharges/edit/fuel-surcharges-edit.component').then(m => m.FuelSurchargesEditComponent),
        title: 'Admin | Fuel Surcharge Detail'
      },

      // Packaging Prices
      { path: 'packaging-prices', redirectTo: 'packaging-prices/list', pathMatch: 'full' },
      {
        path: 'packaging-prices/list',
        loadComponent: () => import('@features/packaging-prices/list/packaging-prices-list.component').then(m => m.PackagingPricesListComponent),
        title: 'Admin | Packaging Prices'
      },
      {
        path: 'packaging-prices/new',
        loadComponent: () => import('@features/packaging-prices/edit/packaging-prices-edit.component').then(m => m.PackagingPricesEditComponent),
        title: 'Admin | New Packaging Price'
      },
      {
        path: 'packaging-prices/:id/edit',
        loadComponent: () => import('@features/packaging-prices/edit/packaging-prices-edit.component').then(m => m.PackagingPricesEditComponent),
        title: 'Admin | Packaging Price Detail'
      },

      // Active Inquiries (list only)
      { path: 'active-inquiries', redirectTo: 'active-inquiries/list', pathMatch: 'full' },
      {
        path: 'active-inquiries/list',
        loadComponent: () => import('@features/active-inquiries/list/active-inquiries-list.component').then(m => m.ActiveInquiriesListComponent),
        title: 'Admin | Active Inquiries'
      }
    ]
  },

  // ============================================================================
  // 404 - Not Found
  // ============================================================================
  {
    path: '404',
    loadComponent: () => import('@shared/components/not-found/not-found.component').then(m => m.NotFoundComponent),
    title: 'Admin | Page Not Found'
  },

  // ============================================================================
  // WILDCARD - Redirect unknown routes to 404
  // ============================================================================
  {
    path: '**',
    redirectTo: '404'
  }
];
