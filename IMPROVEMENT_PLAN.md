# RECO Admin Client — Improvement Plan (target: ≥ 9/10)

**Current: 6.5/10** (Angular 20.3, TS 5.9 strict, ~25 CRUD features, 196 TS files)
The best-engineered of the three apps: fully standalone + lazy, a real `BaseHttpService`
+ refresh interceptor, centralized role model, a genuine atomic-design ui-kit applied
consistently. Held back by two ~1000–1300 line edit components, `as any` at every save path,
inconsistent error UX/logging, a dead route guard, and tests that stop at auth.

> Definition of 9/10: typed save/update flow (no `as any`), edit components decomposed,
> uniform error→toast+logger handling, a generic data-table with loading/error states, dead
> code removed, and feature/service tests beyond auth.

---

## P0 — Correctness fixes (small, high-signal)

### 0.1 Dead route-guard redirects
`RoleGuard.getHomeUrlForUser` redirects to `/customer-admin/orders` and `/customer/dashboard`
(`core/auth/role.guard.ts:53-57`) — **neither route exists in this admin app** (copy-paste
from a shared multi-app template). Non-admin users hit a dead redirect.
**Fix:** redirect to a real admin route (e.g. `/admin/dashboard`) or `/login`; add a test.

### 0.2 Remove dead/inaccurate model types
`core/models/account.model.ts:40-51` declares `AccountsResponse { data; total; page; pageSize }`
+ `AccountDetailResponse`/`AccountContact`/`AccountAddress` that don't match the Hydra
collections actually used (lists map `response.clients`). Remove or align to the real
`ClientsResponse`/`ClientDetail` shapes.

### 0.3 Remove debug logging
27 `console.log` (address.service ×5, client.service ×4, shop-orders-edit ×3, products-edit
×2, …). Delete; add ESLint `no-console` (allow warn/error).

---

## P1 — Type safety on the write path

The systemic hole: typed `Partial<Dto>` create/update methods are called with untyped
payloads cast away — `createClient(data as any)` / `updateClient(…, data as any)`
(`features/accounts/edit/accounts-edit.component.ts:720-721`), `updateUser(…, { client: null }
as any)` (`:647,:860,:934`). ~86 `: any`/`as any` total.

**Fix:**
- Build the save payload as a real `CreateClientDto`/`UpdateClientDto` (the DTOs already exist
  and now include `isClientAgent`/`managedClients`) and drop the cast.
- Type the `updateUser` partial (`{ client: string | null }`).
- Make the data-table generic: `data!: any[]` / `getCellValue(row: any): any`
  (`ui-kit/organisms/data-table/data-table.component.ts:45,160`) → `DataTableComponent<T>`.
- Add ESLint `@typescript-eslint/no-explicit-any` (warn → error).

**Acceptance:** no `as any` on any `create*/update*` call; data-table is generic; `any` count
in single digits.

---

## P2 — Decompose the fat edit components

`accounts-edit.component.ts` (**1054 lines**) owns 5 data tables, 3 modals (address/user/
managed-clients), validation, currency formatting, and 6 inline mappers
(`mapClientToAccount`, `mapOrdersToShopOrders`, `mapOrderStatus`, …). `products-edit` is 1279.

**Fix (accounts-edit first):**
- Extract each tab into a child component: `<account-users-tab>`, `<account-addresses-tab>`,
  `<account-orders-tab>`, `<account-managed-clients-tab>` — each owns its table + modal +
  load/save, taking the client id as input.
- Move mappers (`mapClientToAccount`, order mappers) into a small mapper/util or the service.
- Parent keeps the form + tab orchestration only. Target < ~300 lines.

**Acceptance:** accounts-edit < ~300 lines; each tab is an independently testable component;
behaviour unchanged (build green).

---

## P3 — Uniform error handling & logging

- A `LoggerService` exists but is used in only **2 feature files**; **181 raw `console.error/
  warn`** bypass it. Route all through `LoggerService` (no-op in prod).
- **Inconsistent UX:** edit screens toast on save error (`accounts-edit.component.ts:725,736`)
  but lists silently `console.error` (`accounts-list.component.ts:233,270`) and many loads
  swallow → `[]` (`accounts-edit.component.ts:415,438`). Standardize: every failed mutation →
  toast; every failed load → inline error state + retry.
- Add a global HTTP-error interceptor + `ErrorHandler` so feature code stops swallowing.
- Replace inline role strings with `USER_ROLES` constants
  (`accounts-edit.component.ts:428-431,:897-900`).

---

## P4 — Design-system polish (locks in the architecture score)

- Make `DataTableComponent` carry **loading** and **error** states (today only
  `emptyMessage`); removes the per-component spinner bolt-ons.
- Standardize teardown on `takeUntilDestroyed` (dominant in 18 files); convert the stragglers
  still using manual `destroy$` (`accounts-edit.component.ts:116`, admin-dashboard).
- Replace the per-call `isLocalStorageAvailable()` write/remove probe
  (`auth.service.ts:344-367`) with a one-time `PLATFORM_ID`/feature check; guard
  `parseToken`'s `split('.')[1]` (`auth.service.ts`).

---

## P5 — Testing (3/10 → real coverage)

Today: 5 spec files / 196 TS (~2.5%), all auth (substantive: service 366, interceptor 172,
guard 101) + scaffolding.

1. **Service** tests for `ClientService`, `UserService`, `ProductService` (param building,
   merge-patch headers, Hydra mapping).
2. **Component** tests for the new tab components (P2) — especially the **managed-clients**
   tab: add/remove persists IRIs via PATCH, agent toggle shows/hides the tab.
3. **ui-kit** tests for `DataTableComponent` (sorting, templates, the new loading/error states)
   and a couple of atoms.
4. Target **≥60%** overall, **≥80%** on `core/services` + the accounts feature.

**Acceptance:** `ng test` green in CI with coverage gates; the 1000-line-era logic now covered
by its decomposed, tested children.

---

## P6 — CI / tooling

- CI: `ng lint` (with `no-console` + `no-explicit-any`), `ng build` (prod),
  `ng test --watch=false --code-coverage`.
- Bundle-size budgets in `angular.json` (the products-edit chunk is large — watch it).
- Node ≥ 20.19 required (default here is 20.10; build with Node 22). Note: this repo had **no
  `node_modules`** — `npm ci` before building.

---

## Done-when checklist
- [ ] 0.1 RoleGuard redirects to real routes (+ test)
- [ ] 0.2 dead account.model types removed/aligned
- [ ] 0 `console.log`; logging via `LoggerService`; `no-console` rule
- [ ] no `as any` on create/update; data-table generic; `any` single digits
- [ ] accounts-edit (+ products-edit) decomposed into tab components < ~300 lines
- [ ] uniform error→toast/inline+retry; global HTTP-error interceptor
- [ ] data-table has loading/error states; teardown unified on `takeUntilDestroyed`
- [ ] service + component + ui-kit tests; CI gates green
