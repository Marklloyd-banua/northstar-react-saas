# Northstar React SaaS Admin Dashboard Template (Frontend)

**Northstar React SaaS Admin Dashboard Template** is a **frontend-only** admin dashboard template built with **React 19**, **TypeScript (strict)**, and **Vite 8**, styled with **Bootstrap 5** and **Bootstrap Icons**, and using **Recharts** for chart visualizations. It is designed for SaaS-style back-office/admin interfaces and runs in **mock/demo mode by default**.

> **Important — frontend template/demo, not a production SaaS backend.** This package does **not** include a production backend, database, real authentication/authorization server, payment gateway, or server-side security controls. **Mock authentication and browser-local demo data are not production persistence or production security.** Frontend role/permission checks are for UI/demo behavior only and are **not server-side authorization**. Buyers must implement, secure, and verify their own backend, API contracts, authentication, authorization, data storage, payments, and operational security for production use.

## Technology stack (verified from this package)

- **React 19** (`react`, `react-dom`)
- **TypeScript 5** (strict TypeScript build via `tsc -b`)
- **Vite 8** (dev server and production build)
- **Bootstrap 5** and **Bootstrap Icons**
- **React Router 7** (client-side routing)
- **Recharts** (charts/visualizations)
- **Redux Toolkit** dependency present in the package; UI/data behavior follows the repository/adapter patterns described below (verify specific usage in source as needed)

## Requirements

- **Node.js and npm** are required.
- **Tested in the packaging environment (available evidence):** Node.js **v24.17.0**, npm **12.2.0**.
- **Buyer environment:** Node.js/npm versions are **not universally verified** for every environment. Use a compatible modern Node.js/npm setup (Node.js LTS is a reasonable starting point) and run your own install/build verification.
- A modern browser for development/testing.

## Installation and startup

1. Install dependencies (recommended with the included lockfile):

```bash
npm ci
```

2. Create a local environment file from the template:

```bash
# Windows PowerShell
Copy-Item .env.example .env.local

# macOS/Linux
cp .env.example .env.local
```

3. Review `.env.local`. **Only public `VITE_*` frontend variables belong here.** Never put secrets, service-role keys, database passwords, or private API tokens in frontend environment variables.

4. For local mock/demo evaluation, ensure:

```env
VITE_USE_MOCK_API=true
```

(`.env.example` already defaults to `VITE_USE_MOCK_API=true`.)

5. Start the development server:

```bash
npm run dev
```

## Environment configuration (`.env.example`)

`.env.example` includes:

```env
# Public frontend configuration only. Do not put secrets in VITE_* variables.
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_API_TIMEOUT=15000
# true uses browser-local fixtures; false requires an HTTPS API URL outside localhost.
VITE_USE_MOCK_API=true
```

- **`VITE_USE_MOCK_API=true` (default):** uses **browser-local mock fixtures/demo data**. **Not a production backend.**
- **`VITE_USE_MOCK_API=false`:** API-ready mode. Requires a valid `VITE_API_BASE_URL` (production URLs should use HTTPS; localhost is allowed for local development). **No live backend or API contracts are included** in this package — buyers must implement and secure compatible backend endpoints and contracts.

## TypeScript and production build commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start Vite development server |
| `npm run build` | **TypeScript build + production bundle** (`tsc -b && vite build`) |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run Oxlint (if used in your workflow) |

Run `npm run build` before delivery/customization verification.

## Demo accounts (mock mode only)

When using mock/demo behavior, the template may display demo credentials for convenience. These are **demo-only** and must **not** be used as production authentication:

- `admin@northstar.demo` / `AdminDemo123!`
- `manager@northstar.demo` / `ManagerDemo123!`
- `viewer@northstar.demo` / `ViewerDemo123!`

## Feature inventory (implemented UI/features vs. mock/demo data)

The template includes implemented frontend pages, layouts, navigation, forms/tables, and reusable UI components. **Data, metrics, accounts, and operational workflows may be mock/demo, illustrative, or browser-local unless connected to a real, buyer-implemented backend.**

### Dashboard and analytics
- Platform overview/dashboard-style UI
- Platform analytics-style UI and chart visualizations (Recharts)
- **Illustrative/demo metrics possible** — verify before presenting as real business data

### Platform resources and administration (UI areas)
- Stores and tenant-management style views
- Tenants, platform users, roles & permissions style views (some areas may be gated by demo/UI permissions)
- SaaS/subscription-style views: plans, subscriptions, billing/invoices, payments/transactions, discounts/promotions
- Integrations, monitoring, notifications, audit-logs style views
- Global/security settings and support/helpdesk style views
- **Implementation note:** these are frontend/admin UI areas and mock/API-ready patterns where applicable; **not a complete production SaaS backend**.

### Store Workspace
- Store-scoped workspace routes/pages: overview, products, categories, orders, inventory, store settings
- Designed around store context/isolation patterns in the frontend implementation (verify behavior in source)
- **No checkout/payment processing or backend inventory reservation system included** unless separately implemented by the buyer

### UI building blocks
- Charts, tables, forms, navigation/sidebar/header patterns, modals/common components, layouts, and reusable frontend components (see `src/components/`, `src/layouts/`, `src/pages/`)

## Architecture overview

- **React frontend (SPA-style admin UI):** routes/pages/layouts/components render the dashboard experience.
- **Repository/data-adapter pattern:** UI data access is structured to separate page logic from data sources (see `src/services/dataRepository.ts`, `src/services/repositoryConfig.ts`, and related service modules).
- **Mock repository + API adapter:** in mock mode, data can be served from browser-local fixtures/mock repository behavior; in API mode, requests are intended to go through the API adapter/configured base URL.
- **Environment-based configuration:** `VITE_USE_MOCK_API`, `VITE_API_BASE_URL`, and `VITE_API_TIMEOUT` control frontend data mode/endpoint configuration (public `VITE_*` variables only).

**Not included:** backend application, database, real user authentication system, server-side authorization/RBAC enforcement, payment gateway integration, production security controls, deployment infrastructure, or finalized live API contracts. **Buyers must implement and secure their own backend and API contracts** and validate all data/permissions on the server.

## Buyer warnings (please read)

- **Mock authentication is not production authentication.** Demo credentials and mock login flows are for evaluation only.
- **Browser-local demo data is not production persistence.** Mock/local data can be reset, edited in-browser, or differ from real backend behavior.
- **Frontend role checks are not server-side authorization.** Never rely on UI-only restrictions for security.
- **No production payment gateway or backend is included.** Billing/payment/subscription screens, if present, are template UI/demo patterns unless connected to real, secured services.
- **Do not store secrets in `VITE_*` variables.** Frontend env values are exposed to client-side builds.
- **API mode is not plug-and-play.** Disabling mock mode requires compatible, secured backend endpoints/contracts implemented by the buyer.

## Customization and support boundaries

Common customization starting points:

- **Routes/pages:** `src/App.tsx`, `src/pages/`, `src/layouts/`
- **Navigation:** `src/data/navigation.ts`
- **Styles/theme:** `src/index.css`, component styles
- **Mock data/fixtures:** `src/data/mockData.ts`, mock services
- **Data access/adapters:** `src/services/dataRepository.ts`, `src/services/repositoryConfig.ts`, `src/services/api/*`
- **Auth/demo behavior:** `src/auth/*`, `src/contexts/AuthContext.tsx`
- **Store Workspace:** `src/pages/store-workspace/`

**Boundaries (no guarantees implied):** This README does not promise support response times, updates, bug-fix periods, custom feature development, backend integration, deployment, security audits, or legal/compliance services. Custom backend integration, API contract design, hosting, authentication, payments, data migration, and production security hardening are the buyer’s responsibility unless explicitly agreed in separate written terms with the seller/rights holder.

## Third-party notices and legal status

- **Third-party notices:** see `THIRD_PARTY_NOTICES.md` and `docs/legal/THIRD_PARTY_LICENSE_TEXTS.md`. These documents include third-party license/notice information (including references relevant to MPL, Apache-2.0, SIL OFL, and compound-license packages where documented). They are provided for reference and **do not constitute legal advice or legal clearance**.
- **Commercial license status:** a **finalized commercial license file is not included** in this package. **Do not assume third-party compliance has received legal clearance.** Obtain and review the applicable commercial license/terms from the seller or rights holder before commercial use or redistribution, and review third-party obligations for your specific distribution.

## Quality checklist before production use

- Run `npm run build` (includes TypeScript build) and fix issues in your environment.
- Perform accessibility, responsive, browser/device, and integration QA.
- Replace mock/demo data and demo auth with secured backend services.
- Validate API contracts, error handling, loading states, permissions, and security on the server.
- Review license/third-party obligations for your actual distribution.
