// ─────────────────────────────────────────────────────────────────────────────
// Meta Types — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────
// Mirrors the response shape of the backend's GET /api/v1/meta/enums.
//
// `EnumName` is the union of catalogue keys the backend exposes. It is kept
// in sync MANUALLY with the PUBLIC_ENUMS map in
// backend/src/modules/meta/meta.repository.ts — adding an enum there should
// also add it here so consumers get type-safe `useEnum('shift_type')` calls.
//
// The values are typed as `readonly string[]` rather than per-enum literal
// unions: the backend is the source of truth, so we deliberately do not
// duplicate the literal values here. Consumers that need narrow types should
// import the corresponding ShiftType / UserRole etc. from their own scope.
// ─────────────────────────────────────────────────────────────────────────────

export type EnumName =
  | 'user_role'
  | 'gender_pref'
  | 'kyc_status'
  | 'kyc_doc_type'
  | 'staff_role'
  | 'vendor_type'
  | 'target_type'
  | 'shift_type'
  | 'booking_status'
  | 'booking_type'
  | 'assignment_status'
  | 'assignment_action'
  | 'event_status'
  | 'tx_status'
  | 'tx_method'
  | 'plan_code'
  | 'media_type'
  | 'cms_status'
  | 'refund_status';

export type EnumCatalogue = Readonly<Record<EnumName, readonly string[]>>;
