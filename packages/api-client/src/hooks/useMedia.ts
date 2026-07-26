// ─────────────────────────────────────────────────────────────────────────────
// Media Hooks — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../providers/ApiClientProvider';
import * as mediaService from '../services/media.service';
import type { UploadMediaOptions, ListMediaFilters } from '../types/media.types';

// ── Query Keys ────────────────────────────────────────────────────────────────

export const mediaKeys = {
  all: ['media'] as const,
  portfolio: (filters?: ListMediaFilters) =>
    [...mediaKeys.all, 'portfolio', filters ?? {}] as const,
};

// ── Queries ───────────────────────────────────────────────────────────────────

/** List portfolio media (optionally filtered by category or service) */
export function usePortfolio(filters?: ListMediaFilters) {
  const client = useApiClient();
  return useQuery({
    queryKey: mediaKeys.portfolio(filters),
    queryFn: () => mediaService.listMyMedia(client, filters),
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/** Upload media */
export function useUploadMedia() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, options, onProgress }: {
      file: File;
      options?: UploadMediaOptions;
      onProgress?: (percent: number) => void;
    }) => mediaService.uploadMedia(client, file, options, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...mediaKeys.all, 'portfolio'] });
    },
  });
}

/** Update media metadata */
export function useUpdateMedia() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ mediaId, payload }: {
      mediaId: string;
      payload: { caption?: string; is_featured?: boolean; service_id?: string | null };
    }) => mediaService.updateMedia(client, mediaId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...mediaKeys.all, 'portfolio'] });
    },
  });
}

/** Delete media */
export function useDeleteMedia() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mediaId: string) => mediaService.deleteMedia(client, mediaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...mediaKeys.all, 'portfolio'] });
    },
  });
}
