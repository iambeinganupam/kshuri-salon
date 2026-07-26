// ─────────────────────────────────────────────────────────────────────────────
// Plans Service — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import type { AxiosInstance } from 'axios';
import type { Plan, EffectivePlan, SubscribePayload, SubscribeResult } from '../types/plans.types';

/** Coerce numeric fields that pg sends as strings. */
function coercePlan<T extends Plan>(p: T): T {
  return {
    ...p,
    monthly_fee_inr: Number(p.monthly_fee_inr ?? 0),
    commission_percent: Number(p.commission_percent ?? 0),
  };
}

export async function listPlans(client: AxiosInstance): Promise<Plan[]> {
  const { data } = await client.get<{ success: true; data: Plan[] }>('/plans');
  return data.data.map(coercePlan);
}

export async function getMyPlan(client: AxiosInstance): Promise<EffectivePlan> {
  const { data } = await client.get<{ success: true; data: EffectivePlan }>('/plans/me');
  return coercePlan(data.data);
}

export async function subscribeToPlan(
  client: AxiosInstance,
  payload: SubscribePayload,
): Promise<SubscribeResult> {
  const { data } = await client.post<{ success: true; data: SubscribeResult }>(
    '/plans/subscribe',
    payload,
  );
  return { ...data.data, plan: coercePlan(data.data.plan) };
}
