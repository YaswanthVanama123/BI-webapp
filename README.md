# EnviroMaster BI — Frontend

Operational & financial BI dashboard for the RouteStar / ADP / Mapbox data platform. React + Vite +
Tailwind, matching the conventions of the org's `inventory-webapp`. Consumes the BI API documented in
[`../backend/docs/07-apis.md`](../backend/docs/07-apis.md).

## Run

```bash
cd frontend
npm install
cp .env.example .env      # set VITE_API_BASE_URL if the backend isn't on :4000
npm run dev               # http://localhost:5174
```

The dashboard uses **only real data from the backend BI API** — there is no mock/offline mode. Start the
backend first (`cd ../backend && npm run dev`, default `http://localhost:4000`) and point the frontend at
it via `VITE_API_BASE_URL` (default `http://localhost:4000/api/v1`). All report data, and the filter
dropdowns (routes, technicians, categories), are loaded from the API. Reports show empty/error states
until the backend has data.

## Stack

React 19 · React Router 7 · Vite 6 · Tailwind 3 · Recharts · Axios · lucide-react · PapaParse.

## Architecture

Feature-based, with a clear separation between the app shell, shared presentational components, the
data layer, and per-domain feature modules. Everything imports via the `@/` alias (→ `src/`), so pages
can be relocated without touching their own imports.

```
src/
├── index.jsx                 entry (mounts <App/>)
├── App.jsx                   providers + <AppRouter/>
├── app/
│   ├── navigation.jsx        SINGLE SOURCE of routes + sidebar nav (path, label, icon, element, hideFilters)
│   ├── AppRouter.jsx         builds <Routes> from navigation
│   └── NotFoundPage.jsx
├── config/index.js           env flags (API base URL, reporting tz)
├── styles/index.css          Tailwind entry + component classes
├── contexts/FiltersContext   global filter set (dates/route/tech/category/status/granularity)
├── hooks/                    useApi (fetch) · useFilterOptions (loads routes/techs/categories from API)
├── services/                 DATA LAYER
│   ├── api.js                axios instance; unwraps the { data, meta, page } envelope
│   └── biService.js          all BI endpoints (../backend/docs/07-apis.md)
├── utils/                    format.js · exportCsv.js
├── components/               SHARED, presentational (domain-agnostic)
│   ├── layout/               AppLayout · Sidebar · Topbar
│   ├── filters/FilterBar
│   ├── charts/               ChartFrame · BarChartCard · LineChartCard · PieChartCard · palette (barrel: index.js)
│   └── ui/                   Card · PageHeader · Badge · StatCard · Spinner · EmptyState · ErrorState ·
│                             DataTable · ExportButton · AsyncSection (barrel: index.js)
└── features/                 DOMAIN MODULES (one page component per report)
    ├── dashboard/            DashboardPage
    ├── operations/           Utilization · StopsPerTechnician · StopVolumeTrends · ServiceVsDriveTime
    ├── revenue/              ByCategory · ByRoute · ByCustomer · PerStop
    ├── cost/                 PayrollCost · LaborPerStop · RouteProfitability
    ├── reference/            Customers
    └── governance/           DataQuality · UnmappedItems · ImportBatches · SyncStatus
```

**Layering:** `config`/`utils` → `services` (data) → `components` (presentational) → `features` (pages)
→ `app` (routing/shell). Adding a report = drop a `*Page.jsx` in the right `features/` folder and add one
entry to `app/navigation.jsx` (it appears in both the router and the sidebar automatically).

## Reports

Overview dashboard · Technician Utilization · Stops per Technician · Stop Volume Trends · Service vs
Drive Time (route legs) · Revenue by Category / Route / Customer · Revenue per Stop · Payroll Cost ·
Labor Cost per Stop · Route Profitability · Customers · Data Quality (with resolve) · Unmapped Items ·
Import Batches · Sync Status.

## CSV export

Every report table has an **Export CSV** button (`components/ui/ExportButton` + `utils/exportCsv`).
Exports use the **same column definitions** the table renders (`{ key, header, accessor, render, csv }`),
so the file matches what's on screen and respects the current sort/filters. A UTF-8 BOM is prepended so
Excel opens it cleanly. To make any table exportable, pass `exportFilename` to `<DataTable>`; to export
arbitrary data elsewhere, call `exportRowsToCsv(rows, columns, filename)` or `exportObjectsToCsv(rows, filename)`.

## Backend API

`services/api.js` targets `VITE_API_BASE_URL` (default `http://localhost:4000/api/v1`) and expects the
documented response envelope `{ data, meta, page }`. Every request goes to the backend — there is no mock
path. Auth: a `localStorage.authToken` is sent as `Bearer` if present, and the active tenant can be set
via an `x-tenant-code` header (RBAC/tenant resolution is enforced server-side per the API spec).
