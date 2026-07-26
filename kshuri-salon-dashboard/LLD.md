# Kshuri Salon Hub: Low-Level Design (LLD)

## 1. Class & Component Architecture

### 1.1 UI Component Hierarchy
The UI is broken down into atomic design principles.

*   `App.tsx` (Root Auth Provider & Router Guard)
    *   `AuthLayout.tsx` (Public Shell)
        *   `LoginPage.tsx`, `SignupPage.tsx`
    *   `DashboardLayout.tsx` (Private Shell with Sidebar)
        *   `Sidebar.tsx` (Nav Links)
        *   `Header.tsx` (User Avatar, Global Notifications)
        *   `CalendarPage.tsx` -> `TimeGrid.tsx`, `AppointmentCard.tsx`
        *   `Services.tsx` -> `ServiceTable.tsx`, `ServiceFormModal.tsx`

### 1.2 State Management (`react-query` Keys)
To prevent unnecessary network waterfalls, remote data fetches are strictly keyed and cached.
*   `['appointments', dateRange]` -> Caches calendar fetches. Invalidated on any `PUT /appointment` action.
*   `['catalog', 'freelancer_id']` -> Caches the service menu. Stale time set to 30 minutes.
*   `['kpi', 'today']` -> Caches dashboard metrics. Polling interval set to 5 minutes.

## 2. Sequence Diagrams (Critical Paths)

### 2.1 Updating a Service Price
1.  **Actor (Freelancer):** Clicks "Edit" on a service row in `ServiceTable.tsx`.
2.  **UI:** Opens `ServiceFormModal.tsx` populated with current values.
3.  **Actor:** Changes price from $25 to $30 and clicks "Save".
4.  **UI:** Parses form via Zod schema. If valid, triggers `useMutation`.
5.  **Network:** `PUT /api/v1/catalog/services/:id` with payload `{ price: 30 }`.
6.  **Backend:** Validates Token, verifies ownership of `service_id`, updates DB, returns `200 OK`.
7.  **react-query:** Resolves mutation, calls `queryClient.invalidateQueries(['catalog'])`.
8.  **UI:** Re-fetches catalog and smoothly re-renders table with the new $30 price.

### 2.2 Commencing an Appointment
1.  **Actor (Customer):** Arrives at salon.
2.  **Actor (Freelancer):** Clicks "Start" on the appointment in `Dashboard.tsx`.
3.  **UI:** Prompts for OTP (sent to user's app).
4.  **Network:** `POST /api/v1/appointments/:id/verify-otp { otp_code }`.
5.  **Backend:** Validates OTP. Transitions `appointments.status` to `in_progress`.
6.  **UI:** Re-renders status badge from yellow (pending) to green (in-progress).

## 3. Data Models (TypeScript Interfaces)
These strictly mirror the JSON contracts defined in `API_REQUIREMENTS.md`.

```typescript
export interface FreelancerService {
  id: string;
  category_id: string;
  name: string;
  default_price: number;
  duration_minutes: number;
  is_active: boolean;
}

export interface ShiftBlock {
  id: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string;
  type: 'regular' | 'time_off';
}
```

## 4. API Integration Layer
Constructed via Axios Interceptors to handle Authorization seamlessly.

```typescript
// lib/api.ts
import axios from 'axios';

export const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```
