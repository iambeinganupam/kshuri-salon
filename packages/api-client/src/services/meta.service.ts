// ─────────────────────────────────────────────────────────────────────────────
// Meta Service — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────
// Public, unauthenticated calls — every dashboard fetches enum values from
// the backend so dropdowns / validators stay in sync with the canonical
// definitions (DB enum → src/lib/constants.ts → here) without rebuilds.
// ─────────────────────────────────────────────────────────────────────────────

import type { AxiosInstance } from 'axios';
import type { EnumCatalogue, EnumName } from '../types/meta.types';

/** GET /meta/enums — full client-facing enum catalogue */
export async function listEnums(client: AxiosInstance): Promise<EnumCatalogue> {
  const { data } = await client.get<{ success: true; data: EnumCatalogue }>(
    '/meta/enums',
  );
  return data.data;
}

/** GET /meta/enums/:name — single enum's values */
export async function getEnum(
  client: AxiosInstance,
  name: EnumName,
): Promise<readonly string[]> {
  const { data } = await client.get<{ success: true; data: readonly string[] }>(
    `/meta/enums/${name}`,
  );
  return data.data;
}
