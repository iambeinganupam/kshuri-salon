// ─────────────────────────────────────────────────────────────────────────────
// Event-Manager Service — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────
// HTTP calls for the event-manager dashboard. All endpoints are mounted under
// `/event-manager` and require the `event_manager` role on the backend.
// ─────────────────────────────────────────────────────────────────────────────

import type { AxiosInstance } from 'axios';
import type {
  ManagedEventListItem,
  ManagedEventDetail,
  CreateManagedEventPayload,
  UpdateManagedEventPayload,
  EventVendor,
  EventGuest,
  EventBudgetItem,
  EventTask,
  EventPayment,
  EventTransaction,
  EventManagerPortfolio,
  EventManagerTemplate,
  EventCommunication,
  EventManagerAnalytics,
  MarketplaceVendor,
} from '../types/event-manager.types';

const BASE = '/event-manager';

async function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  const r = await p;
  return r.data.data;
}

// ── Events ───────────────────────────────────────────────────────────────────
export const listManagedEvents = (c: AxiosInstance) =>
  unwrap<ManagedEventListItem[]>(c.get(`${BASE}/my`));

export const getManagedEvent = (c: AxiosInstance, eventId: string) =>
  unwrap<ManagedEventDetail>(c.get(`${BASE}/${eventId}`));

export const createManagedEvent = (c: AxiosInstance, payload: CreateManagedEventPayload) =>
  unwrap<ManagedEventDetail>(c.post(BASE, payload));

export const updateManagedEvent = (c: AxiosInstance, eventId: string, payload: UpdateManagedEventPayload) =>
  unwrap<ManagedEventDetail>(c.patch(`${BASE}/${eventId}`, payload));

export const deleteManagedEvent = async (c: AxiosInstance, eventId: string) => {
  await c.delete(`${BASE}/${eventId}`);
};

// ── Marketplace ──────────────────────────────────────────────────────────────
export const searchMarketplaceVendors = (
  c: AxiosInstance,
  params: { q?: string; category?: string; city?: string; limit?: number },
) => unwrap<MarketplaceVendor[]>(c.get(`${BASE}/marketplace/vendors`, { params }));

// ── Vendors (per event) ──────────────────────────────────────────────────────
export const listEventVendors = (c: AxiosInstance, eventId: string) =>
  unwrap<EventVendor[]>(c.get(`${BASE}/${eventId}/vendors`));

export const createEventVendor = (c: AxiosInstance, eventId: string, payload: Partial<EventVendor>) =>
  unwrap<EventVendor>(c.post(`${BASE}/${eventId}/vendors`, payload));

export const updateEventVendor = (c: AxiosInstance, eventId: string, vendorId: string, payload: Partial<EventVendor>) =>
  unwrap<EventVendor>(c.patch(`${BASE}/${eventId}/vendors/${vendorId}`, payload));

export const deleteEventVendor = async (c: AxiosInstance, eventId: string, vendorId: string) => {
  await c.delete(`${BASE}/${eventId}/vendors/${vendorId}`);
};

// ── Guests ───────────────────────────────────────────────────────────────────
export const listEventGuests = (c: AxiosInstance, eventId: string) =>
  unwrap<EventGuest[]>(c.get(`${BASE}/${eventId}/guests`));

export const createEventGuest = (c: AxiosInstance, eventId: string, payload: Partial<EventGuest>) =>
  unwrap<EventGuest>(c.post(`${BASE}/${eventId}/guests`, payload));

export const updateEventGuest = (c: AxiosInstance, eventId: string, guestId: string, payload: Partial<EventGuest>) =>
  unwrap<EventGuest>(c.patch(`${BASE}/${eventId}/guests/${guestId}`, payload));

export const deleteEventGuest = async (c: AxiosInstance, eventId: string, guestId: string) => {
  await c.delete(`${BASE}/${eventId}/guests/${guestId}`);
};

// ── Budget items ─────────────────────────────────────────────────────────────
export const listBudgetItems = (c: AxiosInstance, eventId: string) =>
  unwrap<EventBudgetItem[]>(c.get(`${BASE}/${eventId}/budget-items`));

export const createBudgetItem = (c: AxiosInstance, eventId: string, payload: Partial<EventBudgetItem>) =>
  unwrap<EventBudgetItem>(c.post(`${BASE}/${eventId}/budget-items`, payload));

export const updateBudgetItem = (c: AxiosInstance, eventId: string, itemId: string, payload: Partial<EventBudgetItem>) =>
  unwrap<EventBudgetItem>(c.patch(`${BASE}/${eventId}/budget-items/${itemId}`, payload));

export const deleteBudgetItem = async (c: AxiosInstance, eventId: string, itemId: string) => {
  await c.delete(`${BASE}/${eventId}/budget-items/${itemId}`);
};

// ── Tasks ────────────────────────────────────────────────────────────────────
export const listEventTasks = (c: AxiosInstance, eventId: string) =>
  unwrap<EventTask[]>(c.get(`${BASE}/${eventId}/tasks`));

export const createEventTask = (c: AxiosInstance, eventId: string, payload: Partial<EventTask>) =>
  unwrap<EventTask>(c.post(`${BASE}/${eventId}/tasks`, payload));

export const updateEventTask = (c: AxiosInstance, eventId: string, taskId: string, payload: Partial<EventTask>) =>
  unwrap<EventTask>(c.patch(`${BASE}/${eventId}/tasks/${taskId}`, payload));

export const deleteEventTask = async (c: AxiosInstance, eventId: string, taskId: string) => {
  await c.delete(`${BASE}/${eventId}/tasks/${taskId}`);
};

// ── Payments ─────────────────────────────────────────────────────────────────
export const listEventPayments = (c: AxiosInstance, eventId: string) =>
  unwrap<EventPayment[]>(c.get(`${BASE}/${eventId}/payments`));

export const createEventPayment = (c: AxiosInstance, eventId: string, payload: Partial<EventPayment>) =>
  unwrap<EventPayment>(c.post(`${BASE}/${eventId}/payments`, payload));

export const updateEventPayment = (c: AxiosInstance, eventId: string, paymentId: string, payload: Partial<EventPayment>) =>
  unwrap<EventPayment>(c.patch(`${BASE}/${eventId}/payments/${paymentId}`, payload));

export const deleteEventPayment = async (c: AxiosInstance, eventId: string, paymentId: string) => {
  await c.delete(`${BASE}/${eventId}/payments/${paymentId}`);
};

// ── Transactions ─────────────────────────────────────────────────────────────
export const listEventTransactions = (c: AxiosInstance, eventId: string) =>
  unwrap<EventTransaction[]>(c.get(`${BASE}/${eventId}/transactions`));

export const createEventTransaction = (c: AxiosInstance, eventId: string, payload: Partial<EventTransaction>) =>
  unwrap<EventTransaction>(c.post(`${BASE}/${eventId}/transactions`, payload));

// ── Portfolio ────────────────────────────────────────────────────────────────
export const getEventManagerPortfolio = (c: AxiosInstance) =>
  unwrap<EventManagerPortfolio | null>(c.get(`${BASE}/portfolio/me`));

export const upsertEventManagerPortfolio = (c: AxiosInstance, payload: Partial<EventManagerPortfolio>) =>
  unwrap<EventManagerPortfolio>(c.put(`${BASE}/portfolio/me`, payload));

// ── Templates ────────────────────────────────────────────────────────────────
export const listTemplates = (c: AxiosInstance) =>
  unwrap<EventManagerTemplate[]>(c.get(`${BASE}/templates`));

export const createTemplate = (c: AxiosInstance, payload: Partial<EventManagerTemplate>) =>
  unwrap<EventManagerTemplate>(c.post(`${BASE}/templates`, payload));

export const updateTemplate = (c: AxiosInstance, templateId: string, payload: Partial<EventManagerTemplate>) =>
  unwrap<EventManagerTemplate>(c.patch(`${BASE}/templates/${templateId}`, payload));

export const deleteTemplate = async (c: AxiosInstance, templateId: string) => {
  await c.delete(`${BASE}/templates/${templateId}`);
};

// ── Communications ───────────────────────────────────────────────────────────
export const listCommunications = (
  c: AxiosInstance,
  params: { event_id?: string; thread_key?: string; limit?: number },
) => unwrap<EventCommunication[]>(c.get(`${BASE}/messages`, { params }));

export const postCommunication = (
  c: AxiosInstance,
  payload: { event_id?: string; thread_key: string; sender_name: string; body: string },
) => unwrap<EventCommunication>(c.post(`${BASE}/messages`, payload));

// ── Analytics ────────────────────────────────────────────────────────────────
export const getEventManagerAnalytics = (c: AxiosInstance) =>
  unwrap<EventManagerAnalytics>(c.get(`${BASE}/analytics`));
