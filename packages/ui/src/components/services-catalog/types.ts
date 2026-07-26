// ─────────────────────────────────────────────────────────────────────────────
// services-catalog — shared types
//
// Local view-model used by the catalog management UI (Add/Edit/List). Both
// the salon and freelancer dashboards normalise their `useServices()`
// responses into this shape before passing them to the shared components.
// Distinct from the public `VendorService` (profile/types.ts) — that one is
// for the customer-facing detail sheet; this one carries the management
// fields (subcategory, status, etc).
// ─────────────────────────────────────────────────────────────────────────────

export type ServiceGender = "male" | "female" | "unisex";
export type ServiceStatus = "active" | "inactive" | "pending-review";

export interface CatalogService {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  price: number;
  duration: number;
  description?: string;
  gender: ServiceGender;
  status: ServiceStatus;
  inclusions: string[];
  trending?: boolean;
  featured?: boolean;
}

export interface ServicePhoto {
  id: string;
  url: string;
  caption: string | null;
  service_id: string | null;
}

/**
 * Wire payload accepted by `POST/PUT /catalog/services`. Fields are optional
 * so partial-update calls (e.g. visibility toggle) can omit unrelated keys.
 */
export interface ServiceWritePayload {
  name?: string;
  category?: string;
  subcategory?: string;
  price?: number;
  duration_minutes?: number;
  description?: string;
  gender_target?: ServiceGender;
  inclusions?: string[];
  is_active?: boolean;
}

export interface ServiceFormValues {
  name: string;
  category: string;
  subcategory: string;
  price: string;
  duration: string;
  description: string;
  gender: ServiceGender;
  inclusions: string;
  isActive: boolean;
}

export const EMPTY_SERVICE_FORM: ServiceFormValues = {
  name: "",
  category: "",
  subcategory: "",
  price: "",
  duration: "30",
  description: "",
  gender: "unisex",
  inclusions: "",
  isActive: true,
};
