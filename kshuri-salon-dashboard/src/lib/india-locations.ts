// ─────────────────────────────────────────────────────────────────────────────
// India location reference data.
//
// 28 states + 8 union territories — small enough to ship inline instead of
// pulling a multi-megabyte npm package (`country-state-city`, etc.). Keep
// this as the single source of truth for any State / Union Territory
// dropdown across the salon dashboard. Other dashboards can re-export from
// here if they need it — DON'T duplicate the list.
//
// Sort order is alphabetical and stable so React keys stay constant.
// ─────────────────────────────────────────────────────────────────────────────

export interface IndianRegion {
  code: string;   // ISO 3166-2 subdivision code (e.g. KA, DL)
  name: string;
  type: 'state' | 'ut';
}

export const INDIA_REGIONS: ReadonlyArray<IndianRegion> = [
  { code: 'AN', name: 'Andaman and Nicobar Islands', type: 'ut'    },
  { code: 'AP', name: 'Andhra Pradesh',              type: 'state' },
  { code: 'AR', name: 'Arunachal Pradesh',           type: 'state' },
  { code: 'AS', name: 'Assam',                       type: 'state' },
  { code: 'BR', name: 'Bihar',                       type: 'state' },
  { code: 'CH', name: 'Chandigarh',                  type: 'ut'    },
  { code: 'CT', name: 'Chhattisgarh',                type: 'state' },
  { code: 'DH', name: 'Dadra and Nagar Haveli and Daman and Diu', type: 'ut' },
  { code: 'DL', name: 'Delhi',                       type: 'ut'    },
  { code: 'GA', name: 'Goa',                         type: 'state' },
  { code: 'GJ', name: 'Gujarat',                     type: 'state' },
  { code: 'HR', name: 'Haryana',                     type: 'state' },
  { code: 'HP', name: 'Himachal Pradesh',            type: 'state' },
  { code: 'JK', name: 'Jammu and Kashmir',           type: 'ut'    },
  { code: 'JH', name: 'Jharkhand',                   type: 'state' },
  { code: 'KA', name: 'Karnataka',                   type: 'state' },
  { code: 'KL', name: 'Kerala',                      type: 'state' },
  { code: 'LA', name: 'Ladakh',                      type: 'ut'    },
  { code: 'LD', name: 'Lakshadweep',                 type: 'ut'    },
  { code: 'MP', name: 'Madhya Pradesh',              type: 'state' },
  { code: 'MH', name: 'Maharashtra',                 type: 'state' },
  { code: 'MN', name: 'Manipur',                     type: 'state' },
  { code: 'ML', name: 'Meghalaya',                   type: 'state' },
  { code: 'MZ', name: 'Mizoram',                     type: 'state' },
  { code: 'NL', name: 'Nagaland',                    type: 'state' },
  { code: 'OR', name: 'Odisha',                      type: 'state' },
  { code: 'PY', name: 'Puducherry',                  type: 'ut'    },
  { code: 'PB', name: 'Punjab',                      type: 'state' },
  { code: 'RJ', name: 'Rajasthan',                   type: 'state' },
  { code: 'SK', name: 'Sikkim',                      type: 'state' },
  { code: 'TN', name: 'Tamil Nadu',                  type: 'state' },
  { code: 'TG', name: 'Telangana',                   type: 'state' },
  { code: 'TR', name: 'Tripura',                     type: 'state' },
  { code: 'UP', name: 'Uttar Pradesh',               type: 'state' },
  { code: 'UT', name: 'Uttarakhand',                 type: 'state' },
  { code: 'WB', name: 'West Bengal',                 type: 'state' },
];

export function isValidIndiaRegion(name: string): boolean {
  if (!name) return false;
  const lower = name.trim().toLowerCase();
  return INDIA_REGIONS.some((r) => r.name.toLowerCase() === lower);
}
