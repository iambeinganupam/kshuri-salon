import type { AxiosInstance } from 'axios';

/** Persist a customer's preferred location server-side. The portal currently
 *  sets the `kshuri_geo` cookie via its own `/api/geo/set` Next.js route handler
 *  (Phase 6 Task 6.3). This stub exists so feature surfaces can switch to a
 *  backed-by-server persistence model in R3+ without ripping import paths.
 *
 *  The backend endpoint `POST /me/geo` does NOT yet exist; calling this in R1
 *  will 404. Use the portal cookie path for now. */
export async function setGeo(
  client: AxiosInstance,
  input: { city: string; lat?: number; lng?: number; source: 'manual' | 'browser' },
): Promise<void> {
  await client.post('/me/geo', input);
}
