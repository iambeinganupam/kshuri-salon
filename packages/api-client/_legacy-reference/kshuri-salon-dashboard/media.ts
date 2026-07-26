// ─────────────────────────────────────────────────────────────────────────────
// API Module: Media — kshuri-salon-dashboard (B2B)
// Backend: /api/v1/media
// Covers: Portfolio image upload + deletion
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from '@/lib/apiClient';

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
}

/**
 * Upload a portfolio image or logo.
 * Sends multipart/form-data to /api/v1/media/upload.
 *
 * @param file - File object from <input type="file">
 * @param options - Optional metadata (caption, is_featured)
 * @param onProgress - Upload progress callback (0–100)
 */
export async function uploadMedia(
  file: File,
  options?: { caption?: string; is_featured?: boolean },
  onProgress?: (percent: number) => void,
): Promise<UploadedMedia> {
  const formData = new FormData();
  formData.append('file', file);
  if (options?.caption) formData.append('caption', options.caption);
  if (options?.is_featured !== undefined) {
    formData.append('is_featured', String(options.is_featured));
  }

  const { data } = await apiClient.post<{ success: true; data: UploadedMedia }>(
    '/media/upload',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) {
          onProgress(Math.round((evt.loaded * 100) / evt.total));
        }
      },
    },
  );
  return data.data;
}

/**
 * List all portfolio media for the authenticated vendor
 */
export async function listMyMedia(): Promise<UploadedMedia[]> {
  const { data } = await apiClient.get<{ success: true; data: UploadedMedia[] }>(
    '/media/my-portfolio',
  );
  return data.data;
}

/**
 * Update media metadata (caption, is_featured)
 */
export async function updateMedia(
  mediaId: string,
  payload: { caption?: string; is_featured?: boolean },
): Promise<UploadedMedia> {
  const { data } = await apiClient.patch<{ success: true; data: UploadedMedia }>(
    `/media/${mediaId}`,
    payload,
  );
  return data.data;
}

/**
 * Permanently delete a media file
 */
export async function deleteMedia(mediaId: string): Promise<void> {
  await apiClient.delete(`/media/${mediaId}`);
}
