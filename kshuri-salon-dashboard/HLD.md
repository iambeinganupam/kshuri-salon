# Kshuri Salon Hub: High-Level Design (HLD)

## 1. Introduction
The **Kshuri Salon Hub** is the dedicated B2B portal for independent grooming professionals, freelancers, and micro-salon owners. It allows them to manage their calendar, catalogue pricing, and track financial earnings without the complexity of an enterprise multi-location system.

## 2. System Architecture
The application is structured as a Single Page Application (SPA) driven by React 18 and Vite.

### 2.1 Architectural Pattern
*   **Client-Side Rendering (CSR):** Enables a desktop-like, fluid experience for professionals who keep the app open for hours during their shifts.
*   **API-Driven (REST):** The frontend strictly interacts with a remote backend service via asynchronous HTTP JSON payloads, decoupling the UI from the database layer.
*   **Stateless Local Session:** Auth is maintained via HTTP-Only JWT cookies or local storage Bearer tokens, hydrating a top-level React Context.

### 2.2 Core Components
1.  **Auth & Identity Manager:** Intercepts routing, handles login/signup, and provisions the `tenant_id` (Freelancer ID).
2.  **Scheduling Engine:** A client-side mathematical matrix that takes global `working_hours`, subtracts `time_blocks` (leaves), and maps `appointments` onto a visual calendar grid.
3.  **Catalog Service:** A CRUD interface managing the local `freelancer_services` mapped to global taxonomies.
4.  **Financial Dashboard:** Aggregates ledger `transactions` into visualizations (charts/graphs) and tracks `payout_settlements` via Stripe Connect integrations.

## 3. Data Flow
1.  **Session Init:** User authenticates -> API returns JWT -> Bootstraps React `AuthProvider`.
2.  **Dashboard Load:** React Query fires parallel, cached `GET` requests to `/api/v1/analytics/kpi` and `/api/v1/appointments/recent`.
3.  **Booking Execution:** Service requested -> API validates slot -> Writes to `appointments` -> React Query invalidates local cache -> UI re-renders calendar automatically.

## 4. Technology Stack
*   **Frontend:** React 18, TypeScript, Vite.
*   **State:** React Query (Server State), Local React Context (UI State).
*   **Styling:** Tailwind CSS v3, shadcn/ui (Radix Primitives).
*   **Routing:** React Router DOM v6.
*   **Charting:** Recharts.

## 5. Non-Functional Requirements (NFRs)
*   **Performance:** TTI (Time to Interactive) under 2.0 seconds on mobile 4G networks.
*   **Availability:** Designed for offline-first PWA caching of schedule data.
*   **Security:** Role-Based Access Control (RBAC) ensuring `/api/v1/*` endpoints only return data matching the authenticated `tenant_id`.
