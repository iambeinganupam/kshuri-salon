// ─────────────────────────────────────────────────────────────────────────────
// VendorAmenityStrip — horizontal chip-row of salon amenities.
//
// Single source of truth for the "at-a-glance facility scan" strip that sits
// directly below VendorHeader on a salon's profile. Used identically by:
//   • Salon dashboard's Portfolio "Public Preview" tab
//   • Customer portal's `/vendors/{slug}` page
//
// Each key in `amenity_keys` looks up its display metadata in
// `SALON_AMENITIES_BY_KEY` (from @kshuri/api-client). Keys not in the
// catalog are silently skipped — defensive against legacy / typoed values.
//
// Freelancers don't carry amenities, so this component renders nothing when
// the array is empty.
// ─────────────────────────────────────────────────────────────────────────────

import { SALON_AMENITIES_BY_KEY } from "@kshuri/api-client/types";
import { amenityIcon } from "./amenity-icons";

interface VendorAmenityStripProps {
  amenityKeys: string[];
  /** Optional className override for the outer scroller. */
  className?: string;
}

export default function VendorAmenityStrip({
  amenityKeys,
  className,
}: VendorAmenityStripProps) {
  if (!amenityKeys || amenityKeys.length === 0) return null;

  const resolved = amenityKeys
    .map((k) => SALON_AMENITIES_BY_KEY[k])
    .filter((a): a is NonNullable<typeof a> => !!a);

  if (resolved.length === 0) return null;

  return (
    <div
      className={
        className ??
        "mt-5 -mx-4 px-4 lg:mx-0 lg:px-0 overflow-x-auto"
      }
    >
      <div className="flex gap-2 w-max lg:w-auto lg:flex-wrap">
        {resolved.map((a) => {
          const Icon = amenityIcon(a.key);
          return (
            <div
              key={a.key}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 bg-background/40 shrink-0"
              title={a.label}
            >
              <Icon className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-medium whitespace-nowrap">
                {a.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
