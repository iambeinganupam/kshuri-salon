// ─────────────────────────────────────────────────────────────────────────────
// Event-Manager Types — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────
// Domain types for the event-manager dashboard. Distinct from `events.types.ts`
// (which models the customer event-booking flow).
// ─────────────────────────────────────────────────────────────────────────────

export type ManagedEventStatus = 'planning' | 'confirmed' | 'completed' | 'cancelled';

export interface ManagedEventListItem {
  id: string;
  event_manager_id: string;
  title: string;
  event_date: string;
  venue: string | null;
  venue_address_line1: string | null;
  venue_address_line2: string | null;
  venue_city: string | null;
  venue_state: string | null;
  venue_postal_code: string | null;
  venue_country_code: string | null;
  venue_latitude: number | null;
  venue_longitude: number | null;
  total_budget: string | null;
  spent_budget: string;
  status: ManagedEventStatus;
  notes: string | null;
  client_name: string | null;
  client_contact: string | null;
  client_email: string | null;
  services: string[];
  created_at: string;
  updated_at: string;
  hire_count?: string | number;
  vendor_count?: string | number;
  guest_count?: string | number;
}

export interface ManagedEventFreelancerHire {
  id: string;
  event_id: string;
  freelancer_id: string;
  agreed_rate: string | null;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes: string | null;
  business_name?: string;
  display_name?: string;
  avg_rating?: string;
  created_at: string;
  updated_at: string;
}

export type EventVendorStatus = 'shortlisted' | 'confirmed' | 'rejected';

export interface EventVendor {
  id: string;
  event_id: string;
  name: string;
  category: string;
  subcategory: string | null;
  freelancer_id: string | null;
  rating: string | null;
  reviews_count: number;
  price: string | null;
  location: string | null;
  contact: string | null;
  verified: boolean;
  availability: string | null;
  status: EventVendorStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type RsvpStatus = 'pending' | 'attending' | 'declined';
export type GuestCategory = 'family' | 'friends' | 'colleagues';
export type GuestSide = 'host' | 'client' | 'mutual';

export interface EventGuest {
  id: string;
  event_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  rsvp_status: RsvpStatus;
  dietary_restrictions: string | null;
  plus_one: boolean;
  category: GuestCategory | null;
  side: GuestSide | null;
  created_at: string;
  updated_at: string;
}

export type BudgetItemStatus = 'pending' | 'paid' | 'overdue';

export interface EventBudgetItem {
  id: string;
  event_id: string;
  category: string;
  item: string;
  budgeted_amount: string;
  actual_amount: string;
  status: BudgetItemStatus;
  vendor_name: string | null;
  vendor_id: string | null;
  created_at: string;
  updated_at: string;
}

export type EventTaskStatus = 'pending' | 'in_progress' | 'completed';

export interface EventTask {
  id: string;
  event_id: string;
  title: string;
  due_date: string | null;
  status: EventTaskStatus;
  assignee: string | null;
  assigned_vendor_id: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export type EventPaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue';

export interface EventPayment {
  id: string;
  event_id: string;
  vendor_id: string | null;
  vendor_name: string;
  amount: string;
  paid_amount: string;
  status: EventPaymentStatus;
  due_date: string | null;
  paid_date: string | null;
  category: string | null;
  description: string | null;
  related_budget_item_id: string | null;
  created_at: string;
  updated_at: string;
}

export type EventTxType = 'payment' | 'refund' | 'advance';
export type EventTxMethod = 'cash' | 'bank-transfer' | 'upi' | 'card' | 'cheque';
export type EventTxStatus = 'completed' | 'pending' | 'failed';

export interface EventTransaction {
  id: string;
  event_id: string;
  payment_id: string | null;
  vendor_id: string | null;
  vendor_name: string;
  amount: string;
  tx_type: EventTxType;
  tx_method: EventTxMethod;
  status: EventTxStatus;
  tx_date: string;
  reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ManagedEventDetail extends ManagedEventListItem {
  hires: ManagedEventFreelancerHire[];
  vendors: EventVendor[];
  guests: EventGuest[];
  budget_items: EventBudgetItem[];
  tasks: EventTask[];
  payments: EventPayment[];
  transactions: EventTransaction[];
}

export interface CreateManagedEventPayload {
  title: string;
  event_date: string;
  venue?: string;
  venue_address_line1?: string;
  venue_address_line2?: string;
  venue_city?: string;
  venue_state?: string;
  venue_postal_code?: string;
  venue_country_code?: string;
  venue_latitude?: number;
  venue_longitude?: number;
  total_budget?: number;
  notes?: string;
  client_name?: string;
  client_contact?: string;
  client_email?: string;
  services?: string[];
}

export interface UpdateManagedEventPayload {
  title?: string;
  event_date?: string;
  venue?: string;
  venue_address_line1?: string;
  venue_address_line2?: string;
  venue_city?: string;
  venue_state?: string;
  venue_postal_code?: string;
  venue_country_code?: string;
  venue_latitude?: number;
  venue_longitude?: number;
  total_budget?: number;
  notes?: string;
  status?: ManagedEventStatus;
  client_name?: string;
  client_contact?: string;
  client_email?: string;
  services?: string[];
}

export interface MarketplaceVendor {
  id: string;
  name: string;
  display_name: string | null;
  category: string | null;
  location: string | null;
  rating: string | null;
  reviews_count: number;
  starting_price: string | null;
  verified: boolean;
  contact: string | null;
}

export interface EventManagerPortfolio {
  user_id: string;
  display_name: string | null;
  bio: string | null;
  city: string | null;
  years_experience: number | null;
  starting_price: string | null;
  services: unknown[];
  gallery: unknown[];
  certifications: unknown[];
  specializations: unknown[];
  contact_email: string | null;
  contact_phone: string | null;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface EventManagerTemplate {
  id: string;
  event_manager_id: string;
  name: string;
  description: string | null;
  default_services: unknown[];
  default_tasks: unknown[];
  default_budget_items: unknown[];
  created_at: string;
  updated_at: string;
}

export type CommunicationDirection = 'inbound' | 'outbound';

export interface EventCommunication {
  id: string;
  event_id: string | null;
  event_manager_id: string;
  thread_key: string;
  direction: CommunicationDirection;
  sender_name: string;
  body: string;
  sent_at: string;
  read_at: string | null;
  created_at: string;
}

export interface EventManagerAnalytics {
  total_events: number;
  planning_events: number;
  confirmed_events: number;
  completed_events: number;
  cancelled_events: number;
  upcoming_events: number;
  total_budget: number;
  total_spent: number;
}
