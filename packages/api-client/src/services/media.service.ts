// ─────────────────────────────────────────────────────────────────────────────
// Media Service — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import type {
  AxiosInstance,
  AxiosRequestHeaders,
  InternalAxiosRequestConfig,
} from 'axios';
import type {
  UploadedMedia,
  UploadMediaOptions,
  ListMediaFilters,
} from '../types/media.types';

// ─────────────────────────────────────────────────────────────────────────────
// Multipart helpers
// ─────────────────────────────────────────────────────────────────────────────
// The shared Axios instance defaults `Content-Type` to `application/json` so
// every other endpoint serialises plain objects correctly. Axios's default
// transformRequest then sees that JSON Content-Type and serialises any
// FormData payload to a JSON string — wiping out the file binary.
//
// To upload a multipart body we must clear Content-Type BEFORE Axios's
// default transform runs. The default then sees a FormData payload with no
// JSON Content-Type and passes it through untouched. The XHR adapter
// finally lets the browser stamp `multipart/form-data; boundary=...`
// (with the auto-generated boundary) onto the outgoing request.
// ─────────────────────────────────────────────────────────────────────────────

function stripContentType(headers: AxiosRequestHeaders | Record<string, unknown>): void {
  const h = headers as Record<string, unknown> & { delete?: (key: string) => void };
  if (typeof h.delete === 'function') {
    h.delete('Content-Type');
  }
  delete h['Content-Type'];
  delete h['content-type'];
}

function buildMultipartConfig(
  client: AxiosInstance,
  onProgress?: (percent: number) => void,
): Pick<InternalAxiosRequestConfig, 'transformRequest' | 'onUploadProgress'> {
  const defaults = client.defaults.transformRequest;
  const baseTransforms = Array.isArray(defaults)
    ? defaults
    : defaults
      ? [defaults]
      : [];

  return {
    transformRequest: [
      // Step 1 — clear the JSON Content-Type so the default transform below
      // does NOT stringify our FormData payload.
      function clearMultipartContentType(data, headers) {
        if (data instanceof FormData && headers) {
          stripContentType(headers as AxiosRequestHeaders);
        }
        return data;
      },
      // Step 2 — Axios's default transform: sees FormData with no JSON
      // Content-Type and returns it unchanged.
      ...baseTransforms,
    ],
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        onProgress(Math.round((evt.loaded * 100) / evt.total));
      }
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Endpoints
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Upload a portfolio media file. Sent as `multipart/form-data` with optional
 * upload-progress reporting. Supports linking the upload to a service so the
 * photo surfaces under that service in the public gallery.
 */
export async function uploadMedia(
  client: AxiosInstance,
  file: File,
  options?: UploadMediaOptions,
  onProgress?: (percent: number) => void,
): Promise<UploadedMedia> {
  const formData = new FormData();
  formData.append('file', file);
  if (options?.caption) formData.append('caption', options.caption);
  if (options?.is_featured !== undefined) {
    formData.append('is_featured', String(options.is_featured));
  }
  if (options?.media_type) formData.append('media_type', options.media_type);
  if (options?.service_id) formData.append('service_id', options.service_id);

  const { data } = await client.post<{ success: true; data: UploadedMedia }>(
    '/media/portfolio',
    formData,
    buildMultipartConfig(client, onProgress),
  );
  return data.data;
}

/** List all portfolio media for the authenticated vendor */
export async function listMyMedia(
  client: AxiosInstance,
  filters?: ListMediaFilters,
): Promise<UploadedMedia[]> {
  const { data } = await client.get<{ success: true; data: UploadedMedia[] }>(
    '/media/portfolio',
    { params: filters },
  );
  return data.data;
}

/** Update media metadata (caption, is_featured, service_id) */
export async function updateMedia(
  client: AxiosInstance,
  mediaId: string,
  payload: { caption?: string; is_featured?: boolean; service_id?: string | null },
): Promise<UploadedMedia> {
  const { data } = await client.put<{ success: true; data: UploadedMedia }>(
    `/media/portfolio/${mediaId}`,
    payload,
  );
  return data.data;
}

/** Permanently delete a media file */
export async function deleteMedia(client: AxiosInstance, mediaId: string): Promise<void> {
  await client.delete(`/media/portfolio/${mediaId}`);
}
