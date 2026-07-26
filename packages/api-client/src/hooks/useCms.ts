// ─────────────────────────────────────────────────────────────────────────────
// CMS Hooks — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../providers/ApiClientProvider';
import * as cmsService from '../services/cms.service';
import type {
  CmsPost,
  ContactLead,
  CreateCalloutPayload,
  UpdateCalloutPayload,
} from '../types/cms.types';

// ── Query Keys ────────────────────────────────────────────────────────────────

export const cmsKeys = {
  all: ['cms'] as const,
  posts: () => [...cmsKeys.all, 'posts'] as const,
  post: (slug: string) => [...cmsKeys.all, 'post', slug] as const,
  contactLeads: () => [...cmsKeys.all, 'contact-leads'] as const,
  callouts: (context: string) => [...cmsKeys.all, 'callouts', context] as const,
  testimonials: (limit?: number) => [...cmsKeys.all, 'testimonials', limit ?? 'default'] as const,
};

// ── Queries ───────────────────────────────────────────────────────────────────

/** List CMS posts */
export function useCmsPosts() {
  const client = useApiClient();
  return useQuery({
    queryKey: cmsKeys.posts(),
    queryFn: () => cmsService.listPosts(client),
  });
}

/** Get a single post by slug */
export function useCmsPost(slug: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: cmsKeys.post(slug),
    queryFn: () => cmsService.getPostBySlug(client, slug),
    enabled: !!slug,
  });
}

/** List contact leads (Admin) */
export function useContactLeads() {
  const client = useApiClient();
  return useQuery({
    queryKey: cmsKeys.contactLeads(),
    queryFn: () => cmsService.listContactLeads(client),
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/** Create a CMS post */
export function useCreatePost() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<CmsPost>) =>
      cmsService.createPost(client, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cmsKeys.posts() });
    },
  });
}

/** Update a CMS post */
export function useUpdatePost() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, payload }: { postId: string; payload: Partial<CmsPost> }) =>
      cmsService.updatePost(client, postId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cmsKeys.posts() });
    },
  });
}

/** Submit a contact lead */
export function useSubmitContactLead() {
  const client = useApiClient();
  return useMutation({
    mutationFn: (payload: Omit<ContactLead, 'id' | 'created_at'>) =>
      cmsService.submitContactLead(client, payload),
  });
}

// ── Admin aliases ─────────────────────────────────────────────────────────────

/** Admin: list CMS pages (alias for useCmsPosts) */
export const useCmsPages = useCmsPosts;

/** Admin: create a CMS page (alias for useCreatePost) */
export const useCreateCmsPage = useCreatePost;

// ── Platform Callouts ───────────────────────────────────────────────────────

/** Public read: marketing callouts for a given context (default `auth_page`). */
export function useCallouts(context = 'auth_page') {
  const client = useApiClient();
  return useQuery({
    queryKey: cmsKeys.callouts(context),
    queryFn: () => cmsService.listCallouts(client, context),
    staleTime: 5 * 60_000,
  });
}

export function useCreateCallout() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCalloutPayload) => cmsService.createCallout(client, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: cmsKeys.callouts(data.context) });
    },
  });
}

export function useUpdateCallout() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCalloutPayload }) =>
      cmsService.updateCallout(client, id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: cmsKeys.callouts(data.context) });
    },
  });
}

export function useDeleteCallout() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cmsService.deleteCallout(client, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cmsKeys.all });
    },
  });
}

// ── Testimonials ────────────────────────────────────────────────────────────

/** Customer testimonials for the homepage social-proof carousel. */
export function useTestimonials(params: { limit?: number } = {}) {
  const client = useApiClient();
  return useQuery({
    queryKey: cmsKeys.testimonials(params.limit),
    queryFn: () => cmsService.listTestimonials(client, params),
    staleTime: 10 * 60_000,
  });
}

