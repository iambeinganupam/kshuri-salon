# Exhaustive API Requirements (Mapped by Page UI)

This document provides a rigorous, 1:1 mapping of every single Page component in the **Kshuri Salon Hub** to its required backend API endpoints, ensuring no feature, table, or relation is left without a data-fetching contract.

---

## 1. Authentication & Onboarding
**Pages:** `LoginPage.tsx`, `SignupPage.tsx`

| Page Section | Action / Hook | Method | API Endpoint | Input Contract (Payload) | Output Contract (Response) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Signup** | Register Account | `POST` | `/api/v1/auth/register` | `{ email, password, phone, role: "freelancer" }` | `{ status: "success", data: { temp_user_id } }` |
| **Signup** | Verify OTP | `POST` | `/api/v1/auth/verify` | `{ temp_user_id, otp_code }` | `{ access_token, user: { id, email } }` |
| **Login** | Credentials Auth | `POST` | `/api/v1/auth/login` | `{ email, password }` | `{ access_token, refresh_token, user }` |

---

## 2. Global Dashboard & Analytics
**Pages:** `Dashboard.tsx`, `AnalyticsPage.tsx`, `TransactionsPage.tsx`, `ReportsPage.tsx`

| Page Section | Action / Hook | Method | API Endpoint | Input Contract (Payload) | Output Contract (Response) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Dashboard** | Fetch Header KPIs | `GET` | `/api/v1/analytics/kpi-summary` | `?date=today` | `{ today_bookings: 8, revenue: 28400, pending: 3 }` |
| **Dashboard** | Load Recent Appts | `GET` | `/api/v1/appointments/recent` | `?limit=5` | `[ { id, customerName, timeSlot, status } ]` |
| **Analytics** | Render Revenue Chart | `GET` | `/api/v1/analytics/revenue-series` | `?range=7d` | `[ { date: "Mar 1", revenue: 32000 } ]` |
| **Analytics** | Render Bookings Chart| `GET` | `/api/v1/analytics/booking-trends` | `?range=week` | `[ { day: "Mon", count: 58 } ]` |
| **Transactions**| List Ledger Items | `GET` | `/api/v1/finance/transactions` | `?page=1&limit=20` | `[ { tx_id, amount, platform_fee, status } ]` |
| **Reports** | Export CSV/PDF | `GET` | `/api/v1/reports/export` | `?type=tax&format=csv` | *(Binary File Blob / text/csv)* |

---

## 3. Booking & Schedule Management
**Pages:** `Bookings.tsx`, `CalendarPage.tsx`

| Page Section | Action / Hook | Method | API Endpoint | Input Contract (Payload) | Output Contract (Response) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Bookings List**| Fetch Agenda Grid | `GET` | `/api/v1/appointments` | `?start=2026-03-01&end=2026-03-31` | `[ { id, scheduled_start, status, services: [] } ]` |
| **Bookings List**| Change Status | `PUT` | `/api/v1/appointments/:id/status`| `{ status: "accepted" \| "rejected" }`| `{ message: "Status updated." }` |
| **Bookings List**| Complete & Verify | `POST` | `/api/v1/appointments/:id/verify-otp`| `{ otp_code: "123456" }` | `{ message: "Service marked completed." }` |
| **Calendar** | Fetch Month View | `GET` | `/api/v1/calendar/aggregate` | `?month=03&year=2026` | `{ "2026-03-08": { count: 4, revenue: 1500 } }` |
| **Calendar** | Block Time-Off | `POST` | `/api/v1/availability/blocks` | `{ start_time, end_time, reason }` | `{ id: "block_uuid" }` |

---

## 4. Profile & Portfolio Operations
**Pages:** `SalonProfilePage.tsx`, `SettingsPage.tsx`, `PortfolioPage.tsx`

| Page Section | Action / Hook | Method | API Endpoint | Input Contract (Payload) | Output Contract (Response) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Salon Profile**| Load Biz Details | `GET` | `/api/v1/profile/business` | `-` | `{ business_name, address, gst_number }` |
| **Salon Profile**| Update Details | `PUT` | `/api/v1/profile/business` | `{ business_name, bio, address }` | `{ message: "Profile updated" }` |
| **Settings** | Load Working Hrs | `GET` | `/api/v1/availability/working-hours`| `-` | `[ { day: 1, open: "09:00", is_closed: false } ]` |
| **Settings** | Update Hrs/Status | `PUT` | `/api/v1/availability/working-hours`| `{ schedule: [...], is_online: true }` | `{ message: "Settings saved" }` |
| **Portfolio** | Fetch Grid Media | `GET` | `/api/v1/portfolio/media` | `-` | `[ { id, media_url, caption } ]` |
| **Portfolio** | Upload Image | `POST` | `/api/v1/portfolio/media` | `FormData { file, caption }` | `{ id: "uuid", url: "https://..." }` |
| **Portfolio** | Delete Image | `DELETE`| `/api/v1/portfolio/media/:id` | `-` | `204 No Content` |

---

## 5. Catalog & Menu
**Pages:** `Services.tsx`

| Page Section | Action / Hook | Method | API Endpoint | Input Contract (Payload) | Output Contract (Response) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Services** | List Catalog | `GET` | `/api/v1/catalog/services` | `-` | `[ { id, name, price, duration_minutes } ]` |
| **Services** | Add New Item | `POST` | `/api/v1/catalog/services` | `{ name, category_id, price, duration }`| `{ id: "new-svc-uuid" }` |
| **Services** | Edit Pricing | `PUT` | `/api/v1/catalog/services/:id`| `{ price, is_active }` | `{ message: "Updated successfully." }` |
| **Services** | Delete Target | `DELETE`| `/api/v1/catalog/services/:id`| `-` | `204 No Content` |

---

## 6. Staff & Scalability
**Pages:** `StaffPage.tsx`, `StaffDetailPage.tsx`

| Page Section | Action / Hook | Method | API Endpoint | Input Contract (Payload) | Output Contract (Response) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Staff Roster** | List Employees | `GET` | `/api/v1/staff` | `-` | `[ { id, name, role, is_active } ]` |
| **Staff Roster** | Add Member | `POST` | `/api/v1/staff` | `{ name, email, role }` | `{ id: "staff-uuid" }` |
| **Staff Detail** | Get Deep Profile | `GET` | `/api/v1/staff/:id` | `-` | `{ id, name, kyc_status, commission }` |
| **Staff Detail** | Get Shift Roster | `GET` | `/api/v1/staff/:id/schedule`| `?range=current_week` | `[ { date, start_time, end_time } ]` |

---

## 7. Billing & Platform
**Pages:** `BillingPage.tsx`

| Page Section | Action / Hook | Method | API Endpoint | Input Contract (Payload) | Output Contract (Response) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Billing** | Get Sub Status | `GET` | `/api/v1/billing/subscription`| `-` | `{ current_tier: "Professional", valid_until }` |
| **Billing** | Payout Pending | `GET` | `/api/v1/finance/settlements` | `-` | `[ { id, amount_due, due_date } ]` |
| **Billing** | Bank Details | `GET` | `/api/v1/finance/bank-account`| `-` | `{ account_last4: "4567", routing: "..." }` |
