// ─────────────────────────────────────────────────────────────────────────────
// Media Types — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────
// Consolidated from:
//   - kshuri-salon-dashboard/src/api/media.ts
//   - kshuri-customer-dashboard/src/api/media.ts
// ─────────────────────────────────────────────────────────────────────────────

/** Service summary attached to a media item (when service_id is set) */
export interface MediaServiceRef {
  id: string;
  name: string;
  category_id: string | null;
  category_name: string | null;
}

/** An uploaded media file (portfolio image, avatar, etc.) */
export interface UploadedMedia {
  id: string;
  url: string;
  thumbnail_url?: string;
  original_filename: string;
  caption?: string;
  is_featured: boolean;
  size_bytes: number;
  mime_type: string;
  created_at: string;
  service_id: string | null;
  service: MediaServiceRef | null;
}

/** Options for media upload */
export interface UploadMediaOptions {
  caption?: string;
  is_featured?: boolean;
  media_type?: 'portfolio' | 'before_after' | 'profile' | 'cover';
  service_id?: string;
}

/** Filters for listing portfolio media */
export interface ListMediaFilters {
  category_id?: string;
  service_id?: string;
}
