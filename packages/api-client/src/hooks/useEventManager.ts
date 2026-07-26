// ─────────────────────────────────────────────────────────────────────────────
// Event-Manager Hooks — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../providers/ApiClientProvider';
import * as svc from '../services/event-manager.service';
import type {
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
  MarketplaceVendor,
} from '../types/event-manager.types';

// ── Query Keys ───────────────────────────────────────────────────────────────
export const eventManagerKeys = {
  all:           ['event-manager'] as const,
  events:        () => [...eventManagerKeys.all, 'events'] as const,
  event:         (id: string) => [...eventManagerKeys.all, 'event', id] as const,
  vendors:       (eventId: string) => [...eventManagerKeys.all, 'vendors', eventId] as const,
  guests:        (eventId: string) => [...eventManagerKeys.all, 'guests', eventId] as const,
  budgetItems:   (eventId: string) => [...eventManagerKeys.all, 'budget-items', eventId] as const,
  tasks:         (eventId: string) => [...eventManagerKeys.all, 'tasks', eventId] as const,
  payments:      (eventId: string) => [...eventManagerKeys.all, 'payments', eventId] as const,
  transactions:  (eventId: string) => [...eventManagerKeys.all, 'transactions', eventId] as const,
  portfolio:     () => [...eventManagerKeys.all, 'portfolio', 'me'] as const,
  templates:     () => [...eventManagerKeys.all, 'templates'] as const,
  messages:      (filters: Record<string, unknown>) => [...eventManagerKeys.all, 'messages', filters] as const,
  analytics:     () => [...eventManagerKeys.all, 'analytics'] as const,
  marketplace:   (filters: Record<string, unknown>) => [...eventManagerKeys.all, 'marketplace', filters] as const,
};

// ── Events ───────────────────────────────────────────────────────────────────
export function useManagedEventList() {
  const c = useApiClient();
  return useQuery({
    queryKey: eventManagerKeys.events(),
    queryFn: () => svc.listManagedEvents(c),
  });
}

export function useManagedEvent(eventId: string | null | undefined) {
  const c = useApiClient();
  return useQuery({
    queryKey: eventManagerKeys.event(eventId ?? ''),
    queryFn: () => svc.getManagedEvent(c, eventId as string),
    enabled: !!eventId,
  });
}

export function useCreateManagedEvent() {
  const c = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateManagedEventPayload) => svc.createManagedEvent(c, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: eventManagerKeys.events() }); },
  });
}

export function useUpdateManagedEvent() {
  const c = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, payload }: { eventId: string; payload: UpdateManagedEventPayload }) =>
      svc.updateManagedEvent(c, eventId, payload),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: eventManagerKeys.events() });
      qc.invalidateQueries({ queryKey: eventManagerKeys.event(v.eventId) });
    },
  });
}

export function useDeleteManagedEvent() {
  const c = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => svc.deleteManagedEvent(c, eventId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: eventManagerKeys.events() }); },
  });
}

// ── Marketplace ──────────────────────────────────────────────────────────────
export function useMarketplaceVendors(
  filters: { q?: string; category?: string; city?: string; limit?: number } = {},
) {
  const c = useApiClient();
  return useQuery({
    queryKey: eventManagerKeys.marketplace(filters),
    queryFn: () => svc.searchMarketplaceVendors(c, filters),
  });
}

// ── Vendors ──────────────────────────────────────────────────────────────────
export function useEventVendors(eventId: string | null | undefined) {
  const c = useApiClient();
  return useQuery({
    queryKey: eventManagerKeys.vendors(eventId ?? ''),
    queryFn: () => svc.listEventVendors(c, eventId as string),
    enabled: !!eventId,
  });
}

function makeInvalidator(qc: ReturnType<typeof useQueryClient>, eventId: string) {
  qc.invalidateQueries({ queryKey: eventManagerKeys.event(eventId) });
}

export function useCreateEventVendor(eventId: string) {
  const c = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<EventVendor>) => svc.createEventVendor(c, eventId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventManagerKeys.vendors(eventId) });
      makeInvalidator(qc, eventId);
    },
  });
}

export function useUpdateEventVendor(eventId: string) {
  const c = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vendorId, payload }: { vendorId: string; payload: Partial<EventVendor> }) =>
      svc.updateEventVendor(c, eventId, vendorId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventManagerKeys.vendors(eventId) });
      makeInvalidator(qc, eventId);
    },
  });
}

export function useDeleteEventVendor(eventId: string) {
  const c = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vendorId: string) => svc.deleteEventVendor(c, eventId, vendorId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventManagerKeys.vendors(eventId) });
      makeInvalidator(qc, eventId);
    },
  });
}

// ── Guests ───────────────────────────────────────────────────────────────────
export function useEventGuests(eventId: string | null | undefined) {
  const c = useApiClient();
  return useQuery({
    queryKey: eventManagerKeys.guests(eventId ?? ''),
    queryFn: () => svc.listEventGuests(c, eventId as string),
    enabled: !!eventId,
  });
}

export function useCreateEventGuest(eventId: string) {
  const c = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<EventGuest>) => svc.createEventGuest(c, eventId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventManagerKeys.guests(eventId) });
      makeInvalidator(qc, eventId);
    },
  });
}

export function useUpdateEventGuest(eventId: string) {
  const c = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ guestId, payload }: { guestId: string; payload: Partial<EventGuest> }) =>
      svc.updateEventGuest(c, eventId, guestId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventManagerKeys.guests(eventId) });
      makeInvalidator(qc, eventId);
    },
  });
}

export function useDeleteEventGuest(eventId: string) {
  const c = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (guestId: string) => svc.deleteEventGuest(c, eventId, guestId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventManagerKeys.guests(eventId) });
      makeInvalidator(qc, eventId);
    },
  });
}

// ── Budget Items ─────────────────────────────────────────────────────────────
export function useBudgetItems(eventId: string | null | undefined) {
  const c = useApiClient();
  return useQuery({
    queryKey: eventManagerKeys.budgetItems(eventId ?? ''),
    queryFn: () => svc.listBudgetItems(c, eventId as string),
    enabled: !!eventId,
  });
}

export function useCreateBudgetItem(eventId: string) {
  const c = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<EventBudgetItem>) => svc.createBudgetItem(c, eventId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventManagerKeys.budgetItems(eventId) });
      makeInvalidator(qc, eventId);
    },
  });
}

export function useUpdateBudgetItem(eventId: string) {
  const c = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, payload }: { itemId: string; payload: Partial<EventBudgetItem> }) =>
      svc.updateBudgetItem(c, eventId, itemId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventManagerKeys.budgetItems(eventId) });
      makeInvalidator(qc, eventId);
    },
  });
}

export function useDeleteBudgetItem(eventId: string) {
  const c = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => svc.deleteBudgetItem(c, eventId, itemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventManagerKeys.budgetItems(eventId) });
      makeInvalidator(qc, eventId);
    },
  });
}

// ── Tasks ────────────────────────────────────────────────────────────────────
export function useEventTasks(eventId: string | null | undefined) {
  const c = useApiClient();
  return useQuery({
    queryKey: eventManagerKeys.tasks(eventId ?? ''),
    queryFn: () => svc.listEventTasks(c, eventId as string),
    enabled: !!eventId,
  });
}

export function useCreateEventTask(eventId: string) {
  const c = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<EventTask>) => svc.createEventTask(c, eventId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventManagerKeys.tasks(eventId) });
      makeInvalidator(qc, eventId);
    },
  });
}

export function useUpdateEventTask(eventId: string) {
  const c = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: Partial<EventTask> }) =>
      svc.updateEventTask(c, eventId, taskId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventManagerKeys.tasks(eventId) });
      makeInvalidator(qc, eventId);
    },
  });
}

export function useDeleteEventTask(eventId: string) {
  const c = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => svc.deleteEventTask(c, eventId, taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventManagerKeys.tasks(eventId) });
      makeInvalidator(qc, eventId);
    },
  });
}

// ── Payments ─────────────────────────────────────────────────────────────────
export function useEventPayments(eventId: string | null | undefined) {
  const c = useApiClient();
  return useQuery({
    queryKey: eventManagerKeys.payments(eventId ?? ''),
    queryFn: () => svc.listEventPayments(c, eventId as string),
    enabled: !!eventId,
  });
}

export function useCreateEventPayment(eventId: string) {
  const c = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<EventPayment>) => svc.createEventPayment(c, eventId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventManagerKeys.payments(eventId) });
      makeInvalidator(qc, eventId);
    },
  });
}

export function useUpdateEventPayment(eventId: string) {
  const c = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentId, payload }: { paymentId: string; payload: Partial<EventPayment> }) =>
      svc.updateEventPayment(c, eventId, paymentId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventManagerKeys.payments(eventId) });
      makeInvalidator(qc, eventId);
    },
  });
}

export function useDeleteEventPayment(eventId: string) {
  const c = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (paymentId: string) => svc.deleteEventPayment(c, eventId, paymentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventManagerKeys.payments(eventId) });
      makeInvalidator(qc, eventId);
    },
  });
}

// ── Transactions ─────────────────────────────────────────────────────────────
export function useEventTransactions(eventId: string | null | undefined) {
  const c = useApiClient();
  return useQuery({
    queryKey: eventManagerKeys.transactions(eventId ?? ''),
    queryFn: () => svc.listEventTransactions(c, eventId as string),
    enabled: !!eventId,
  });
}

export function useCreateEventTransaction(eventId: string) {
  const c = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<EventTransaction>) => svc.createEventTransaction(c, eventId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventManagerKeys.transactions(eventId) });
      qc.invalidateQueries({ queryKey: eventManagerKeys.payments(eventId) });
      makeInvalidator(qc, eventId);
    },
  });
}

// ── Portfolio ────────────────────────────────────────────────────────────────
export function useEventManagerPortfolio() {
  const c = useApiClient();
  return useQuery({
    queryKey: eventManagerKeys.portfolio(),
    queryFn: () => svc.getEventManagerPortfolio(c),
  });
}

export function useUpsertEventManagerPortfolio() {
  const c = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<EventManagerPortfolio>) => svc.upsertEventManagerPortfolio(c, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: eventManagerKeys.portfolio() }); },
  });
}

// ── Templates ────────────────────────────────────────────────────────────────
export function useEventManagerTemplates() {
  const c = useApiClient();
  return useQuery({
    queryKey: eventManagerKeys.templates(),
    queryFn: () => svc.listTemplates(c),
  });
}

export function useCreateEventManagerTemplate() {
  const c = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<EventManagerTemplate>) => svc.createTemplate(c, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: eventManagerKeys.templates() }); },
  });
}

export function useUpdateEventManagerTemplate() {
  const c = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, payload }: { templateId: string; payload: Partial<EventManagerTemplate> }) =>
      svc.updateTemplate(c, templateId, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: eventManagerKeys.templates() }); },
  });
}

export function useDeleteEventManagerTemplate() {
  const c = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => svc.deleteTemplate(c, templateId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: eventManagerKeys.templates() }); },
  });
}

// ── Communications ───────────────────────────────────────────────────────────
export function useEventCommunications(
  filters: { event_id?: string; thread_key?: string; limit?: number } = {},
) {
  const c = useApiClient();
  return useQuery({
    queryKey: eventManagerKeys.messages(filters),
    queryFn: () => svc.listCommunications(c, filters),
  });
}

export function usePostEventCommunication() {
  const c = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { event_id?: string; thread_key: string; sender_name: string; body: string }) =>
      svc.postCommunication(c, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: eventManagerKeys.all }); },
  });
}

// ── Analytics ────────────────────────────────────────────────────────────────
export function useEventManagerAnalytics() {
  const c = useApiClient();
  return useQuery({
    queryKey: eventManagerKeys.analytics(),
    queryFn: () => svc.getEventManagerAnalytics(c),
  });
}

// Re-export marketplace vendor type for convenience
export type { MarketplaceVendor };
