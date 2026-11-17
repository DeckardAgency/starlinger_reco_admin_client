# Security

## Reporting a vulnerability

Send an email to **security@<owner-domain>** <!-- TODO(owner): replace with the real security contact -->.

Do not open a public issue and do not post details in pull requests or chat channels.

Please include:

- which application is affected (API, admin app, webshop) and the URL or endpoint
- the steps to reproduce, with the request and response if you have them
- what an attacker could do with it
- how to reach you for questions

Do **not** include real customer data in a report: no names, e-mail addresses, orders,
passwords, tokens or database extracts. Use a test account or describe the data instead.
If you came across real data while testing, say so, do not copy it, and stop there.

## What to expect (proposed, to be confirmed by the owner)

| Step | Target |
|------|--------|
| Acknowledgement of your report | within 3 working days |
| First assessment (confirmed or not, severity) | within 10 working days |
| Progress updates until the fix is deployed | at least every 10 working days |

## Supported version

Only the `dev` branch is supported: it is the branch that gets deployed. Fixes are made
on `dev` and deployed from there; older commits and feature branches receive no fixes.

## Handling secrets and data

Rules this repository follows. Pull requests that break them are rejected.

- **No credentials in git.** This is a browser application: everything in it is public
  once deployed. `src/environments/*.ts` may contain URLs and feature switches only,
  never keys, passwords or tokens.
- **No database dumps or customer data in git**, including in test fixtures and
  screenshots.
- **Authentication stays in HttpOnly cookies** set by the API. Do not store tokens in
  `localStorage`, `sessionStorage` or in code. The JWT keys exist only on the API server.
- **Test credentials come from the environment.** The end-to-end suite reads accounts
  from `E2E_*` environment variables (see `e2e/README.md`, "Test Credentials") and fails
  when they are missing; they are never committed.
- Every push and pull request is scanned for secrets (gitleaks) and for vulnerable
  dependencies (`npm audit`) by `.github/workflows/ci.yml`.

Operational procedures (incident response, backup and restore, suppliers) are kept in the
backend repository under `docs/security/`.
