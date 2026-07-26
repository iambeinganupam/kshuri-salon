// ─────────────────────────────────────────────────────────────────────────────
// Freelancer Service — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────
// Targets backend routes mounted at /api/v1/freelancer.
// Pure Axios calls; the React Query layer lives in hooks/useFreelancer.ts.
// ─────────────────────────────────────────────────────────────────────────────

import type { AxiosInstance } from 'axios';
import type {
  FreelancerProfile,
  UpdateFreelancerProfilePayload,
  FreelancerPresence,
  SetPresencePayload,
  FreelancerExperience,
  CreateExperiencePayload,
  UpdateExperiencePayload,
  FreelancerSkill,
  FreelancerSkillGroup,
  CreateSkillPayload,
  FreelancerCertification,
  CreateCertificationPayload,
  FreelancerLanguage,
  CreateLanguagePayload,
  FreelancerSalonAssociation,
  CreateSalonAssociationPayload,
  UpdateSalonAssociationPayload,
  FreelancerPerformance,
  PerformanceRange,
  UserPreferences,
  UpdatePreferencesPayload,
} from '../types/freelancer.types';

// ── Profile ──────────────────────────────────────────────────────────────────

export async function getProfile(client: AxiosInstance): Promise<FreelancerProfile> {
  const { data } = await client.get<{ success: true; data: FreelancerProfile }>(
    '/freelancer/profile',
  );
  return data.data;
}

export async function updateProfile(
  client: AxiosInstance,
  payload: UpdateFreelancerProfilePayload,
): Promise<FreelancerProfile> {
  const { data } = await client.put<{ success: true; data: FreelancerProfile }>(
    '/freelancer/profile',
    payload,
  );
  return data.data;
}

// ── Presence ─────────────────────────────────────────────────────────────────

export async function setPresence(
  client: AxiosInstance,
  payload: SetPresencePayload,
): Promise<FreelancerPresence> {
  const { data } = await client.patch<{ success: true; data: FreelancerPresence }>(
    '/freelancer/presence',
    payload,
  );
  return data.data;
}

// ── Experience ───────────────────────────────────────────────────────────────

export async function listExperience(client: AxiosInstance): Promise<FreelancerExperience[]> {
  const { data } = await client.get<{ success: true; data: FreelancerExperience[] }>(
    '/freelancer/experience',
  );
  return data.data;
}

export async function createExperience(
  client: AxiosInstance,
  payload: CreateExperiencePayload,
): Promise<FreelancerExperience> {
  const { data } = await client.post<{ success: true; data: FreelancerExperience }>(
    '/freelancer/experience',
    payload,
  );
  return data.data;
}

export async function updateExperience(
  client: AxiosInstance,
  experienceId: string,
  payload: UpdateExperiencePayload,
): Promise<FreelancerExperience> {
  const { data } = await client.put<{ success: true; data: FreelancerExperience }>(
    `/freelancer/experience/${experienceId}`,
    payload,
  );
  return data.data;
}

export async function deleteExperience(
  client: AxiosInstance,
  experienceId: string,
): Promise<void> {
  await client.delete(`/freelancer/experience/${experienceId}`);
}

// ── Skills ───────────────────────────────────────────────────────────────────

export async function listSkills(client: AxiosInstance): Promise<FreelancerSkillGroup[]> {
  const { data } = await client.get<{ success: true; data: FreelancerSkillGroup[] }>(
    '/freelancer/skills',
  );
  return data.data;
}

export async function createSkill(
  client: AxiosInstance,
  payload: CreateSkillPayload,
): Promise<FreelancerSkill> {
  const { data } = await client.post<{ success: true; data: FreelancerSkill }>(
    '/freelancer/skills',
    payload,
  );
  return data.data;
}

export async function deleteSkill(client: AxiosInstance, skillId: string): Promise<void> {
  await client.delete(`/freelancer/skills/${skillId}`);
}

// ── Certifications ───────────────────────────────────────────────────────────

export async function listCertifications(
  client: AxiosInstance,
): Promise<FreelancerCertification[]> {
  const { data } = await client.get<{ success: true; data: FreelancerCertification[] }>(
    '/freelancer/certifications',
  );
  return data.data;
}

export async function createCertification(
  client: AxiosInstance,
  payload: CreateCertificationPayload,
): Promise<FreelancerCertification> {
  const { data } = await client.post<{ success: true; data: FreelancerCertification }>(
    '/freelancer/certifications',
    payload,
  );
  return data.data;
}

export async function deleteCertification(
  client: AxiosInstance,
  certificationId: string,
): Promise<void> {
  await client.delete(`/freelancer/certifications/${certificationId}`);
}

// ── Languages ────────────────────────────────────────────────────────────────

export async function listLanguages(client: AxiosInstance): Promise<FreelancerLanguage[]> {
  const { data } = await client.get<{ success: true; data: FreelancerLanguage[] }>(
    '/freelancer/languages',
  );
  return data.data;
}

export async function createLanguage(
  client: AxiosInstance,
  payload: CreateLanguagePayload,
): Promise<FreelancerLanguage> {
  const { data } = await client.post<{ success: true; data: FreelancerLanguage }>(
    '/freelancer/languages',
    payload,
  );
  return data.data;
}

export async function deleteLanguage(
  client: AxiosInstance,
  languageId: string,
): Promise<void> {
  await client.delete(`/freelancer/languages/${languageId}`);
}

// ── Salon History ────────────────────────────────────────────────────────────

export async function listSalonHistory(
  client: AxiosInstance,
): Promise<FreelancerSalonAssociation[]> {
  const { data } = await client.get<{ success: true; data: FreelancerSalonAssociation[] }>(
    '/freelancer/salon-history',
  );
  return data.data;
}

export async function createSalonAssociation(
  client: AxiosInstance,
  payload: CreateSalonAssociationPayload,
): Promise<FreelancerSalonAssociation> {
  const { data } = await client.post<{ success: true; data: FreelancerSalonAssociation }>(
    '/freelancer/salon-history',
    payload,
  );
  return data.data;
}

export async function updateSalonAssociation(
  client: AxiosInstance,
  associationId: string,
  payload: UpdateSalonAssociationPayload,
): Promise<FreelancerSalonAssociation> {
  const { data } = await client.put<{ success: true; data: FreelancerSalonAssociation }>(
    `/freelancer/salon-history/${associationId}`,
    payload,
  );
  return data.data;
}

export async function deleteSalonAssociation(
  client: AxiosInstance,
  associationId: string,
): Promise<void> {
  await client.delete(`/freelancer/salon-history/${associationId}`);
}

// ── Performance ──────────────────────────────────────────────────────────────

export async function getPerformance(
  client: AxiosInstance,
  range: PerformanceRange = '30d',
): Promise<FreelancerPerformance> {
  const { data } = await client.get<{ success: true; data: FreelancerPerformance }>(
    '/freelancer/performance',
    { params: { range } },
  );
  return data.data;
}

// ── Preferences ──────────────────────────────────────────────────────────────

export async function getPreferences(client: AxiosInstance): Promise<UserPreferences> {
  const { data } = await client.get<{ success: true; data: UserPreferences }>(
    '/freelancer/preferences',
  );
  return data.data;
}

export async function updatePreferences(
  client: AxiosInstance,
  payload: UpdatePreferencesPayload,
): Promise<UserPreferences> {
  const { data } = await client.put<{ success: true; data: UserPreferences }>(
    '/freelancer/preferences',
    payload,
  );
  return data.data;
}
