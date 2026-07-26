// ─────────────────────────────────────────────────────────────────────────────
// Addresses — @kshuri/api-client
// Flat re-export of address types and service functions.
// ─────────────────────────────────────────────────────────────────────────────

export type {
  AddressDto,
  CreateAddressPayload,
  UpdateAddressPayload,
} from './types/address.types';

export {
  listAddresses,
  getAddress,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from './services/addresses.service';
