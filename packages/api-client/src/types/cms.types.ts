// ─────────────────────────────────────────────────────────────────────────────
// CMS Types — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

/** CMS post for blog/content pages */
export interface CmsPost {
  id: string;
  slug: string;
  title: string;
  meta_title?: string;
  meta_description?: string;
  content_mdx?: string;
  author: { id: string; name: string };
  status: 'draft' | 'published';
  published_at?: string;
  created_at: string;
}

/** Contact lead from the web portal */
export interface ContactLead {
  id: string;
  first_name: string;
  email_address: string;
  inquiry_type: 'partnership' | 'support' | 'general';
  message_body: string;
  created_at: string;
}

/** Newsletter subscriber */
export interface NewsletterSubscriber {
  email_address: string;
  subscribed_at: string;
}

/** Platform marketing callout shown on public pages (e.g. auth screen, homepage
 *  hero). `key` and `metadata` were added by backend migration 064 so callouts
 *  can carry addressable structured content (hero title vs subtitle vs CTA
 *  href). Rows without a `key` continue to work as ordered marketing lists. */
export interface PlatformCallout {
  id: string;
  context: string;
  /** Optional addressable key (e.g. 'hero_title'). Unique per `(context, key)`
   *  when set. NULL for unkeyed list rows. */
  key: string | null;
  icon: string;
  text: string;
  sort_order: number;
  is_active: boolean;
  /** Free-form JSONB used for structured content like `{ href, button_label }`. */
  metadata: Record<string, unknown>;
}

export interface CreateCalloutPayload {
  context?: string;
  key?: string | null;
  icon: string;
  text: string;
  sort_order?: number;
  is_active?: boolean;
  metadata?: Record<string, unknown>;
}

export type UpdateCalloutPayload = Partial<CreateCalloutPayload>;

/** Customer testimonial returned by GET /cms/testimonials. */
export interface Testimonial {
  id:                  string;
  customer_name:       string;
  customer_city:       string;
  quote:               string;
  rating:              number;
  service_category_id: string | null;
  photo_url:           string | null;
  sort_order:          number;
  created_at:          string;
}
