// ─────────────────────────────────────────────────────────────────────────────
// Freelancer Hooks — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────
// Tanstack Query wrappers around freelancer.service. Mutation hooks invalidate
// the relevant query keys so the dashboard refreshes without explicit refetch.
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../providers/ApiClientProvider';
import * as freelancerService from '../services/freelancer.service';
import type {
  CreateCertificationPayload,
  CreateExperiencePayload,
  CreateLanguagePayload,
  CreateSalonAssociationPayload,
  CreateSkillPayload,
  FreelancerProfile,
  PerformanceRange,
  SetPresencePayload,
  UpdateExperiencePayload,
  UpdateFreelancerProfilePayload,
  UpdatePreferencesPayload,
  UpdateSalonAssociationPayload,
} from '../types/freelancer.types';

// ── Query Keys ───────────────────────────────────────────────────────────────

export const freelancerKeys = {
  all: ['freelancer'] as const,
  profile: () => [...freelancerKeys.all, 'profile'] as const,
  experience: () => [...freelancerKeys.all, 'experience'] as const,
  skills: () => [...freelancerKeys.all, 'skills'] as const,
  certifications: () => [...freelancerKeys.all, 'certifications'] as const,
  languages: () => [...freelancerKeys.all, 'languages'] as const,
  salonHistory: () => [...freelancerKeys.all, 'salon-history'] as const,
  performance: (range: PerformanceRange) =>
    [...freelancerKeys.all, 'performance', range] as const,
  preferences: () => [...freelancerKeys.all, 'preferences'] as const,
};

// ── Profile ──────────────────────────────────────────────────────────────────

export function useFreelancerProfile() {
  const client = useApiClient();
  return useQuery({
    queryKey: freelancerKeys.profile(),
    queryFn: () => freelancerService.getProfile(client),
  });
}

export function useUpdateFreelancerProfile() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateFreelancerProfilePayload) =>
      freelancerService.updateProfile(client, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(freelancerKeys.profile(), data);
    },
  });
}

// ── Presence ─────────────────────────────────────────────────────────────────
// Optimistic update on the cached profile so the UI flips instantly. On error
// we restore the snapshot. On success we trust the server payload (it carries
// the canonical online_since_at).
export function useSetFreelancerPresence() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SetPresencePayload) =>
      freelancerService.setPresence(client, payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: freelancerKeys.profile() });
      const previous = queryClient.getQueryData<FreelancerProfile>(
        freelancerKeys.profile(),
      );
      if (previous) {
        queryClient.setQueryData<FreelancerProfile>(freelancerKeys.profile(), {
          ...previous,
          is_open_to_work: payload.is_online,
          // Preserve the existing timestamp on idempotent on→on; otherwise the
          // server value will land in onSuccess.
          online_since_at: payload.is_online
            ? previous.online_since_at ?? new Date().toISOString()
            : null,
        });
      }
      return { previous };
    },
    onError: (_err, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(freelancerKeys.profile(), context.previous);
      }
    },
    onSuccess: (presence) => {
      const current = queryClient.getQueryData<FreelancerProfile>(
        freelancerKeys.profile(),
      );
      if (current) {
        queryClient.setQueryData<FreelancerProfile>(freelancerKeys.profile(), {
          ...current,
          is_open_to_work: presence.is_online,
          online_since_at: presence.online_since_at,
        });
      }
    },
  });
}

// ── Experience ───────────────────────────────────────────────────────────────

export function useFreelancerExperience() {
  const client = useApiClient();
  return useQuery({
    queryKey: freelancerKeys.experience(),
    queryFn: () => freelancerService.listExperience(client),
  });
}

export function useCreateExperience() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateExperiencePayload) =>
      freelancerService.createExperience(client, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: freelancerKeys.experience() }),
  });
}

export function useUpdateExperience() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateExperiencePayload }) =>
      freelancerService.updateExperience(client, id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: freelancerKeys.experience() }),
  });
}

export function useDeleteExperience() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => freelancerService.deleteExperience(client, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: freelancerKeys.experience() }),
  });
}

// ── Skills ───────────────────────────────────────────────────────────────────

export function useFreelancerSkills() {
  const client = useApiClient();
  return useQuery({
    queryKey: freelancerKeys.skills(),
    queryFn: () => freelancerService.listSkills(client),
  });
}

export function useAddSkill() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSkillPayload) => freelancerService.createSkill(client, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: freelancerKeys.skills() }),
  });
}

export function useDeleteSkill() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => freelancerService.deleteSkill(client, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: freelancerKeys.skills() }),
  });
}

// ── Certifications ───────────────────────────────────────────────────────────

export function useFreelancerCertifications() {
  const client = useApiClient();
  return useQuery({
    queryKey: freelancerKeys.certifications(),
    queryFn: () => freelancerService.listCertifications(client),
  });
}

export function useAddCertification() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCertificationPayload) =>
      freelancerService.createCertification(client, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: freelancerKeys.certifications() }),
  });
}

export function useDeleteCertification() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => freelancerService.deleteCertification(client, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: freelancerKeys.certifications() }),
  });
}

// ── Languages ────────────────────────────────────────────────────────────────

export function useFreelancerLanguages() {
  const client = useApiClient();
  return useQuery({
    queryKey: freelancerKeys.languages(),
    queryFn: () => freelancerService.listLanguages(client),
  });
}

export function useAddLanguage() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLanguagePayload) =>
      freelancerService.createLanguage(client, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: freelancerKeys.languages() }),
  });
}

export function useDeleteLanguage() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => freelancerService.deleteLanguage(client, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: freelancerKeys.languages() }),
  });
}

// ── Salon History ────────────────────────────────────────────────────────────

export function useFreelancerSalonHistory() {
  const client = useApiClient();
  return useQuery({
    queryKey: freelancerKeys.salonHistory(),
    queryFn: () => freelancerService.listSalonHistory(client),
  });
}

export function useAddSalonAssociation() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSalonAssociationPayload) =>
      freelancerService.createSalonAssociation(client, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: freelancerKeys.salonHistory() }),
  });
}

export function useUpdateSalonAssociation() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSalonAssociationPayload }) =>
      freelancerService.updateSalonAssociation(client, id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: freelancerKeys.salonHistory() }),
  });
}

export function useDeleteSalonAssociation() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => freelancerService.deleteSalonAssociation(client, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: freelancerKeys.salonHistory() }),
  });
}

// ── Performance ──────────────────────────────────────────────────────────────

export function useFreelancerPerformance(range: PerformanceRange = '30d') {
  const client = useApiClient();
  return useQuery({
    queryKey: freelancerKeys.performance(range),
    queryFn: () => freelancerService.getPerformance(client, range),
    staleTime: 60_000,
  });
}

// ── Preferences ──────────────────────────────────────────────────────────────

export function useFreelancerPreferences() {
  const client = useApiClient();
  return useQuery({
    queryKey: freelancerKeys.preferences(),
    queryFn: () => freelancerService.getPreferences(client),
  });
}

export function useUpdatePreferences() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdatePreferencesPayload) =>
      freelancerService.updatePreferences(client, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(freelancerKeys.preferences(), data);
    },
  });
}
