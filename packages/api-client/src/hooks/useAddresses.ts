// ─────────────────────────────────────────────────────────────────────────────
// Addresses Hooks — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../providers/ApiClientProvider';
import * as addressesService from '../services/addresses.service';
import type { CreateAddressPayload, UpdateAddressPayload } from '../types/address.types';

// ── Query Keys ────────────────────────────────────────────────────────────────

export const addressKeys = {
  all: ['addresses'] as const,
  list: () => [...addressKeys.all, 'list'] as const,
  detail: (id: string) => [...addressKeys.all, 'detail', id] as const,
};

// ── Queries ───────────────────────────────────────────────────────────────────

/** GET /me/addresses */
export function useAddresses() {
  const client = useApiClient();
  return useQuery({
    queryKey: addressKeys.list(),
    queryFn: () => addressesService.listAddresses(client),
  });
}

/** GET /me/addresses/:id */
export function useAddress(id: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: addressKeys.detail(id),
    queryFn: () => addressesService.getAddress(client, id),
    enabled: !!id,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/** POST /me/addresses */
export function useCreateAddress() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAddressPayload) =>
      addressesService.createAddress(client, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.list() });
    },
  });
}

/** PATCH /me/addresses/:id */
export function useUpdateAddress() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAddressPayload }) =>
      addressesService.updateAddress(client, id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: addressKeys.list() });
      queryClient.invalidateQueries({ queryKey: addressKeys.detail(id) });
    },
  });
}

/** DELETE /me/addresses/:id */
export function useDeleteAddress() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => addressesService.deleteAddress(client, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.list() });
    },
  });
}

/** POST /me/addresses/:id/set-default */
export function useSetDefaultAddress() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => addressesService.setDefaultAddress(client, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.list() });
    },
  });
}

/** POST /geocode/forward */
export function useForwardGeocode() {
  const client = useApiClient();
  return useMutation({
    mutationFn: ({ text, country_hint }: { text: string; country_hint?: string }) =>
      addressesService.forwardGeocode(client, text, country_hint),
  });
}

/** POST /geocode/reverse */
export function useReverseGeocode() {
  const client = useApiClient();
  return useMutation({
    mutationFn: ({ lat, lng }: { lat: number; lng: number }) =>
      addressesService.reverseGeocode(client, lat, lng),
  });
}
