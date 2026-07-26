// ─────────────────────────────────────────────────────────────────────────────
// Geocoding — @kshuri/api-client
// Flat re-export of geocoding types and service functions.
// ─────────────────────────────────────────────────────────────────────────────

export type { AddressComponentsDto, GeocodeResultDto } from './types/address.types';

export {
  forwardGeocode,
  reverseGeocode,
} from './services/addresses.service';
