// ─────────────────────────────────────────────────────────────────────────────
// CMS Service — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import type { AxiosInstance } from 'axios';
import type {
  CmsPost,
  ContactLead,
  PlatformCallout,
  CreateCalloutPayload,
  UpdateCalloutPayload,
  Testimonial,
} from '../types/cms.types';

/** Get all published CMS posts */
export async function listPosts(client: AxiosInstance): Promise<CmsPost[]> {
  const { data } = await client.get<{ success: true; data: CmsPost[] }>(
    '/cms/posts',
  );
  return data.data;
}

/** Get a single CMS post by slug */
export async function getPostBySlug(client: AxiosInstance, slug: string): Promise<CmsPost> {
  const { data } = await client.get<{ success: true; data: CmsPost }>(
    `/cms/posts/${slug}`,
  );
  return data.data;
}

/** Create a new CMS post (Admin only) */
export async function createPost(
  client: AxiosInstance,
  payload: Partial<CmsPost>,
): Promise<CmsPost> {
  const { data } = await client.post<{ success: true; data: CmsPost }>(
    '/cms/posts',
    payload,
  );
  return data.data;
}

/** Update an existing CMS post (Admin only) */
export async function updatePost(
  client: AxiosInstance,
  postId: string,
  payload: Partial<CmsPost>,
): Promise<CmsPost> {
  const { data } = await client.put<{ success: true; data: CmsPost }>(
    `/cms/posts/${postId}`,
    payload,
  );
  return data.data;
}

/** Submit a contact lead from the portal */
export async function submitContactLead(
  client: AxiosInstance,
  payload: Omit<ContactLead, 'id' | 'created_at'>,
): Promise<{ message: string }> {
  const { data } = await client.post<{ success: true; data: { message: string } }>(
    '/cms/contact',
    payload,
  );
  return data.data;
}

/** List contact leads (Admin only) */
export async function listContactLeads(client: AxiosInstance): Promise<ContactLead[]> {
  const { data } = await client.get<{ success: true; data: ContactLead[] }>(
    '/cms/contact-leads',
  );
  return data.data;
}

// ── Platform Callouts (public read; super_admin write) ──────────────────────

export async function listCallouts(
  client: AxiosInstance,
  context = 'auth_page',
): Promise<PlatformCallout[]> {
  const { data } = await client.get<{ success: true; data: PlatformCallout[] }>(
    '/cms/callouts',
    { params: { context } },
  );
  return data.data;
}

export async function createCallout(
  client: AxiosInstance,
  payload: CreateCalloutPayload,
): Promise<PlatformCallout> {
  const { data } = await client.post<{ success: true; data: PlatformCallout }>(
    '/cms/callouts',
    payload,
  );
  return data.data;
}

export async function updateCallout(
  client: AxiosInstance,
  id: string,
  payload: UpdateCalloutPayload,
): Promise<PlatformCallout> {
  const { data } = await client.put<{ success: true; data: PlatformCallout }>(
    `/cms/callouts/${id}`,
    payload,
  );
  return data.data;
}

export async function deleteCallout(client: AxiosInstance, id: string): Promise<void> {
  await client.delete(`/cms/callouts/${id}`);
}

/** Public list of grooming-portal customer testimonials. */
export async function listTestimonials(
  client: AxiosInstance,
  params: { limit?: number } = {},
): Promise<Testimonial[]> {
  const { data } = await client.get<{ success: true; data: Testimonial[] }>(
    '/cms/testimonials',
    { params },
  );
  return data.data;
}
