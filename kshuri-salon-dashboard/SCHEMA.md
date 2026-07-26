# Enterprise Database Architecture & Entities (Freelancer Node)

This document outlines the rigorous, industry-standard relational database design meant to back the **Kshuri Salon Hub**. In a modular microservice or monolithic architecture (like PostgreSQL + Prisma/TypeORM), these entities enforce strict referential integrity and normalization (3NF constraints).

## 1. Authentication & RBAC (Role-Based Access Control)
Manages login and multi-tenant security.

### `users` (Global)
*   `id` (UUID, Primary Key)
*   `email` (VARCHAR 255, Unique, Indexed)
*   `password_hash` (VARCHAR 255)
*   `phone_number` (VARCHAR 20, Unique)
*   `role` (ENUM: `'customer', 'freelancer', 'salon_manager', 'staff'`)
*   `refresh_token_version` (INT) - Used for mass logout
*   `created_at`, `updated_at`, `deleted_at` (Soft Delete)

## 2. Freelancer Professional Identity
Separates the core user from their business identity.

### `freelancer_profiles`
*   `id` (UUID, Primary Key)
*   `user_id` (UUID, Foreign Key -> `users.id`, Unique)
*   `business_name` (VARCHAR 100)
*   `bio` (TEXT)
*   `is_verified` (BOOLEAN) - KYC/Aadhaar status
*   `commission_rate` (DECIMAL 5,2) - Platform take rate
*   `geolocation` (GEOMETRY/Point) - PostGIS enabled for radius search
*   `average_rating` (DECIMAL 3,2)
*   `total_reviews` (INT)

### `freelancer_kyc` (1:1 Relation)
*   `id` (UUID, PK)
*   `freelancer_id` (UUID, FK -> `freelancer_profiles.id`)
*   `document_type` (ENUM: `'aadhaar', 'pan', 'trade_license'`)
*   `document_number` (VARCHAR 100)
*   `verification_status` (ENUM: `'pending', 'approved', 'rejected'`)

## 3. Catalog & Operations
Defines what the freelancer sells and when they work.

### `service_categories`
*   `id` (UUID, PK)
*   `name` (VARCHAR 50) e.g., "Hair", "Skin"
*   `parent_id` (UUID, Nullable FK -> `service_categories.id`) - Enables Subcategories

### `freelancer_services` (N:M intersection with specific pricing)
*   `id` (UUID, PK)
*   `freelancer_id` (UUID, FK -> `freelancer_profiles.id`)
*   `category_id` (UUID, FK -> `service_categories.id`)
*   `name` (VARCHAR 100)
*   `price` (DECIMAL 10,2)
*   `duration_minutes` (INT)
*   `is_active` (BOOLEAN)

### `working_hours` (1:N Relation)
*   `id` (UUID, PK)
*   `freelancer_id` (UUID, FK -> `freelancer_profiles.id`)
*   `day_of_week` (INT 0-6)
*   `open_time` (TIME)
*   `close_time` (TIME)
*   `is_closed` (BOOLEAN)

### `time_blocks` (Exceptions/Leaves)
*   `id` (UUID, PK)
*   `freelancer_id` (UUID, FK -> `freelancer_profiles.id`)
*   `start_datetime` (TIMESTAMPZ)
*   `end_datetime` (TIMESTAMPZ)
*   `reason` (VARCHAR 255)

## 4. Booking & Execution
The transactional core of the platform.

### `appointments`
*   `id` (UUID, PK)
*   `freelancer_id` (UUID, FK -> `freelancer_profiles.id`, Indexed)
*   `customer_user_id` (UUID, FK -> `users.id`, Indexed)
*   `scheduled_start` (TIMESTAMPZ)
*   `scheduled_end` (TIMESTAMPZ)
*   `status` (ENUM: `'pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'`)
*   `total_price` (DECIMAL 10,2)
*   `otp_code` (VARCHAR 6, Nullable) - Service commencement verification

### `appointment_services` (1:N line items)
*   `id` (UUID, PK)
*   `appointment_id` (UUID, FK -> `appointments.id`)
*   `service_id` (UUID, FK -> `freelancer_services.id`)
*   `locked_price` (DECIMAL 10,2) - Snapshot of price at time of booking

## 5. Media & Portfolio
Visual proof of work.

### `portfolio_media`
*   `id` (UUID, PK)
*   `freelancer_id` (UUID, FK -> `freelancer_profiles.id`)
*   `media_url` (VARCHAR 500)
*   `media_type` (ENUM: `'image', 'video'`)
*   `caption` (TEXT)
*   `is_featured` (BOOLEAN)
*   `created_at` (TIMESTAMPZ)

## 6. Financials
Double-entry ledger basics for settlements.

### `transactions`
*   `id` (UUID, PK)
*   `appointment_id` (UUID, FK -> `appointments.id`)
*   `amount` (DECIMAL 10,2)
*   `platform_fee` (DECIMAL 10,2)
*   `net_freelancer_payout` (DECIMAL 10,2)
*   `status` (ENUM: `'pending', 'settled', 'refunded'`)
*   `payment_method` (ENUM: `'upi', 'card', 'cash'`)

### `payout_settlements`
*   `id` (UUID, PK)
*   `freelancer_id` (UUID, FK -> `freelancer_profiles.id`)
*   `amount` (DECIMAL 10,2)
*   `settlement_date` (DATE)
*   `status` (ENUM: `'processing', 'paid', 'failed'`)
*   `transfer_reference` (VARCHAR 255)
