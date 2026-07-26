// ─────────────────────────────────────────────────────────────────────────────
// Assignment Types — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────
// Salon→Freelancer gig contracts. Mirrors the response shape of
// /api/v1/assignments/*.
// ─────────────────────────────────────────────────────────────────────────────

export type AssignmentStatus =
  | 'requested'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'declined'
  | 'cancelled';

export type AssignmentAction =
  | 'accept'
  | 'decline'
  | 'start'
  | 'complete'
  | 'cancel';

export interface Assignment {
  id: string;
  business_id: string;
  salon_location_id: string;
  freelancer_id: string;
  freelancer_user_id: string;
  created_by_user_id: string;

  service_category: string | null;
  notes: string | null;
  start_time: string;
  end_time: string;
  proposed_amount: number | string;

  status: AssignmentStatus;
  decline_reason: string | null;
  cancel_reason: string | null;
  responded_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;

  created_at: string;
  updated_at: string;

  // Display fields joined server-side
  salon_brand_name: string | null;
  salon_display_name: string | null;
  freelancer_business_name: string;
  freelancer_logo_url: string | null;
}

export interface CreateAssignmentPayload {
  salon_location_id: string;
  freelancer_id: string;
  service_category?: string;
  notes?: string;
  start_time: string;          // ISO timestamp
  end_time: string;            // ISO timestamp
  proposed_amount: number;
}

export interface AssignmentActionPayload {
  action: AssignmentAction;
  reason?: string;             // required when action === 'cancel' or 'decline'
}

export interface ListAssignmentsParams {
  status?: AssignmentStatus;
  limit?: number;
}
