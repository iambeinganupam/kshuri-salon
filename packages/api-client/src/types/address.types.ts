// ─────────────────────────────────────────────────────────────────────────────
// Address Types — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

export interface AddressDto {
  id: string;
  label: string;
  recipient_name: string | null;
  contact_phone: string | null;
  address_line1: string;
  address_line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  postal_code: string | null;
  country_code: string;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface AddressComponentsDto {
  address_line1?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country_code?: string;
}

export interface GeocodeResultDto {
  lat: number;
  lng: number;
  display_name: string;
  components: AddressComponentsDto;
}

export interface CreateAddressPayload {
  label?: string;
  recipient_name?: string;
  contact_phone?: string;
  address_line1: string;
  address_line2?: string;
  landmark?: string;
  city: string;
  state: string;
  postal_code?: string;
  country_code?: string;
  latitude?: number;
  longitude?: number;
  is_default?: boolean;
}

export type UpdateAddressPayload = Partial<CreateAddressPayload>;
