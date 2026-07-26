import { z } from 'zod';

const COUNTRY_CODE = z.string().length(2).transform((s) => s.toUpperCase());

export const createAddressSchema = z.object({
  label:          z.string().trim().min(1).max(40).default('Home'),
  recipient_name: z.string().trim().max(120).optional(),
  contact_phone:  z.string().trim().max(20).optional(),
  address_line1:  z.string().trim().min(1).max(255),
  address_line2:  z.string().trim().max(255).optional(),
  landmark:       z.string().trim().max(255).optional(),
  city:           z.string().trim().min(1).max(100),
  state:          z.string().trim().min(1).max(100),
  postal_code:    z.string().trim().max(20).optional(),
  country_code:   COUNTRY_CODE.default('IN'),
  latitude:       z.number().gte(-90).lte(90).optional(),
  longitude:      z.number().gte(-180).lte(180).optional(),
  is_default:     z.boolean().default(false),
}).superRefine((v, ctx) => {
  if ((v.latitude === undefined) !== (v.longitude === undefined)) {
    ctx.addIssue({ code: 'custom', message: 'latitude and longitude must be provided together' });
  }
});

// Partial of the inner object schema (before superRefine) — all fields optional for PATCH.
export const updateAddressSchema = createAddressSchema._def.schema.partial();

export const addressIdParam = z.object({ id: z.string().uuid() });

export const geocodeForwardSchema = z.object({
  text:         z.string().trim().min(2).max(255),
  country_hint: z.string().length(2).optional(),
});

export const geocodeReverseSchema = z.object({
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
});

export type CreateAddressInput  = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput  = z.infer<typeof updateAddressSchema>;
export type GeocodeForwardInput = z.infer<typeof geocodeForwardSchema>;
export type GeocodeReverseInput = z.infer<typeof geocodeReverseSchema>;
