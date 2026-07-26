/* eslint-disable @typescript-eslint/no-explicit-any -- api-client hooks are loosely shaped; narrowing belongs at the hook layer */
// ─────────────────────────────────────────────────────────────────────────────
// Settings/Address — kshuri-salon-dashboard
// ─────────────────────────────────────────────────────────────────────────────
// Lets a business_admin set the primary salon location address + map pin.
// Text address fields are saved via PUT /business/profile.
// lat/lng are also persisted on the primary salon_locations row via
// PUT /business/locations/:id using the primary_location_id from the profile.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { AddressPicker, type AddressPickerValue, FadeIn } from "@kshuri/ui";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  useBusinessProfile,
  useUpdateBusinessProfile,
} from "@kshuri/api-client/hooks";
import { useApiClient } from "@kshuri/api-client";

export default function SalonAddress() {
  const { data: profile, isLoading } = useBusinessProfile();
  const updateBusiness = useUpdateBusinessProfile();
  const apiClient = useApiClient();

  const [val, setVal] = useState<AddressPickerValue>({});

  useEffect(() => {
    if (!profile) return;
    const p = profile as any;
    setVal({
      address_line1: p.address_line1 ?? undefined,
      city: p.city ?? undefined,
      state: p.state ?? undefined,
      postal_code: p.postal_code ?? undefined,
      country_code: p.country_code ?? undefined,
      latitude: p.latitude ?? undefined,
      longitude: p.longitude ?? undefined,
    });
  }, [profile]);

  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-5 space-y-4 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  async function save() {
    try {
      const p = profile as any;

      // Build a sparse payload — backend Zod requires min(1) on
      // address_line1/city/state and a strict 6-digit pincode regex, and
      // forwards `.optional()` semantics meaning "omit the key". Sending
      // empty strings trips min(1); sending `null` trips .optional(). So we
      // only include keys whose value is actually present and non-empty.
      const businessPayload: Record<string, unknown> = {};
      const set = (key: string, v: string | undefined) => {
        const trimmed = (v ?? "").trim();
        if (trimmed) businessPayload[key] = trimmed;
      };
      set("address_line1", val.address_line1);
      set("city", val.city);
      set("state", val.state);
      set("postal_code", val.postal_code);

      // 1. Save text address fields to the business profile (only if at
      //    least one field is populated — empty payload would be rejected
      //    by the schema's "at least one field is required" refinement).
      if (Object.keys(businessPayload).length > 0) {
        await updateBusiness.mutateAsync(businessPayload);
      }

      // 2. Persist lat/lng on the primary salon_locations row when
      //    available. SalonLocation uses `lat`/`lng`; AddressPickerValue
      //    uses `latitude`/`longitude`. Same sparse-payload rule applies.
      const locationId: string | undefined = p?.primary_location_id;
      if (locationId && (val.latitude != null || val.longitude != null)) {
        const locPayload: Record<string, unknown> = {
          lat: val.latitude,
          lng: val.longitude,
        };
        if ((val.address_line1 ?? "").trim()) {
          locPayload.address_line1 = val.address_line1!.trim();
        }
        if ((val.city ?? "").trim()) locPayload.city = val.city!.trim();
        if ((val.state ?? "").trim()) locPayload.state = val.state!.trim();
        if (/^\d{6}$/.test(val.postal_code ?? "")) {
          locPayload.pincode = val.postal_code;
        }
        await apiClient.put(`/business/locations/${locationId}`, locPayload);
      }

      toast.success("Salon location saved!");
    } catch (e) {
      toast.error("Couldn't save location", { description: (e as Error).message });
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-5 max-w-2xl">
      <FadeIn>
        <div className="mb-6">
          <h1 className="text-xl font-bold lg:text-2xl tracking-tight">Salon location</h1>
          <p className="text-sm text-muted-foreground mt-1">
            This is where customers will see you on the map and how they get directions to you.
          </p>
        </div>
        <div className="space-y-4">
          <AddressPicker value={val} onChange={setVal} />
          <Button onClick={save} disabled={updateBusiness.isPending}>
            {updateBusiness.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </FadeIn>
    </div>
  );
}
