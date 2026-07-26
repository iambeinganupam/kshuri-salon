// ─────────────────────────────────────────────────────────────────────────────
// Addresses Service — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import type { AxiosInstance } from 'axios';
import type {
  AddressDto,
  CreateAddressPayload,
  UpdateAddressPayload,
  GeocodeResultDto,
} from '../types/address.types';

/** GET /me/addresses */
export async function listAddresses(client: AxiosInstance): Promise<AddressDto[]> {
  const { data } = await client.get<{ success: true; data: AddressDto[] }>('/me/addresses');
  return data.data;
}

/** GET /me/addresses/:id */
export async function getAddress(client: AxiosInstance, id: string): Promise<AddressDto> {
  const { data } = await client.get<{ success: true; data: AddressDto }>(`/me/addresses/${id}`);
  return data.data;
}

/** POST /me/addresses */
export async function createAddress(
  client: AxiosInstance,
  payload: CreateAddressPayload,
): Promise<AddressDto> {
  const { data } = await client.post<{ success: true; data: AddressDto }>(
    '/me/addresses',
    payload,
  );
  return data.data;
}

/** PATCH /me/addresses/:id */
export async function updateAddress(
  client: AxiosInstance,
  id: string,
  payload: UpdateAddressPayload,
): Promise<AddressDto> {
  const { data } = await client.patch<{ success: true; data: AddressDto }>(
    `/me/addresses/${id}`,
    payload,
  );
  return data.data;
}

/** DELETE /me/addresses/:id */
export async function deleteAddress(client: AxiosInstance, id: string): Promise<void> {
  await client.delete(`/me/addresses/${id}`);
}

/** POST /me/addresses/:id/set-default */
export async function setDefaultAddress(
  client: AxiosInstance,
  id: string,
): Promise<AddressDto> {
  const { data } = await client.post<{ success: true; data: AddressDto }>(
    `/me/addresses/${id}/set-default`,
  );
  return data.data;
}

/** POST /geocode/forward */
export async function forwardGeocode(
  client: AxiosInstance,
  text: string,
  country_hint = 'in',
): Promise<GeocodeResultDto[]> {
  const { data } = await client.post<{ success: true; data: GeocodeResultDto[] }>(
    '/geocode/forward',
    { text, country_hint },
  );
  return data.data;
}

/** POST /geocode/reverse */
export async function reverseGeocode(
  client: AxiosInstance,
  lat: number,
  lng: number,
): Promise<GeocodeResultDto['components'] | null> {
  const { data } = await client.post<{
    success: true;
    data: GeocodeResultDto['components'] | null;
  }>('/geocode/reverse', { lat, lng });
  return data.data;
}
