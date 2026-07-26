// ─────────────────────────────────────────────────────────────────────────────
// KYC Service — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import type { AxiosInstance } from 'axios';
import type {
  KycSubmitPayload,
  KycSubmissionDto,
  KycStatusResponse,
  KycDecisionPayload,
  KycPendingItem,
} from '../types/kyc.types';

/** POST /kyc/submit */
export async function submitKyc(
  client: AxiosInstance,
  payload: KycSubmitPayload,
): Promise<KycSubmissionDto> {
  const { data } = await client.post<{ success: true; data: KycSubmissionDto }>(
    '/kyc/submit',
    payload,
  );
  return data.data;
}

/** GET /kyc/me */
export async function getKycStatus(client: AxiosInstance): Promise<KycStatusResponse> {
  const { data } = await client.get<{ success: true; data: KycStatusResponse }>('/kyc/me');
  return data.data;
}

/** GET /admin/kyc/pending */
export async function listPendingKyc(client: AxiosInstance): Promise<KycPendingItem[]> {
  const { data } = await client.get<{ success: true; data: KycPendingItem[] }>(
    '/admin/kyc/pending',
  );
  return data.data;
}

/** PATCH /admin/kyc/:id */
export async function decideKyc(
  client: AxiosInstance,
  id: string,
  payload: KycDecisionPayload,
): Promise<KycSubmissionDto> {
  const { data } = await client.patch<{ success: true; data: KycSubmissionDto }>(
    `/admin/kyc/${id}`,
    payload,
  );
  return data.data;
}
