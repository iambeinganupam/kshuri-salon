// ─────────────────────────────────────────────────────────────────────────────
// API Module: Media — salon-connect-hub (B2C Customer)
// Backend: /api/v1/media
// Covers: Avatar upload
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from '@/lib/apiClient';

export interface UploadedMedia {
  id: string;
  url: string;
  original_filename: string;
  size_bytes: number;
  mime_type: string;
}

/**
 * Upload a file (avatar or portfolio image).
 * Sends as multipart/form-data.
 *
 * @param file - The File object from an <input type="file">
 * @param caption - Optional caption for portfolio images
 * @param onProgress - Optional upload progress callback (0–100)
 */
export async function uploadFile(
  file: File,
  caption?: string,
  onProgress?: (percent: number) => void,
): Promise<UploadedMedia> {
  const formData = new FormData();
  formData.append('file', file);
  if (caption) formData.append('caption', caption);

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
 * Delete a media file by ID (e.g., remove a portfolio image)
 */
export async function deleteMedia(mediaId: string): Promise<void> {
  await apiClient.delete(`/media/${mediaId}`);
}
