// ─────────────────────────────────────────────────────────────────────────────
// ServicePhotosEditor — up-to-3 photo grid bound to a single service.
//
// Drives `POST /media` (with `service_id` set) on upload and `DELETE /media/:id`
// on remove. React Query auto-refetches the portfolio list after each
// mutation, so the parent only has to pipe in the already-filtered photos
// for this service.
//
// Server-side limits (mirrored client-side for nicer toasts):
//   • Max 3 photos per service
//   • Max 10 MB per file
//   • JPEG / PNG / WebP only
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X as XIcon } from "lucide-react";
import { useUploadMedia, useDeleteMedia, extractApiErrorMessage } from "@kshuri/api-client";
import { toast } from "sonner";
import type { ServicePhoto } from "./types";

export const MAX_PHOTOS_PER_SERVICE = 3;
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = /^image\/(jpeg|png|webp)$/;

interface ServicePhotosEditorProps {
  serviceId: string;
  photos: ServicePhoto[];
}

export function ServicePhotosEditor({ serviceId, photos }: ServicePhotosEditorProps) {
  const uploadMedia = useUploadMedia();
  const deleteMedia = useDeleteMedia();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  // One shared file input + an imperative `.click()` is more reliable than
  // <label htmlFor> when this editor is mounted inside a Radix Dialog Portal —
  // the synthesized click from the label can otherwise be swallowed by the
  // dialog's focus scope and the picker never opens.
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUpload = async (file: File | null) => {
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      const mb = (file.size / 1024 / 1024).toFixed(1);
      toast.error(`Image is ${mb} MB — please upload a file under 10 MB`);
      return;
    }
    if (!ALLOWED_IMAGE_TYPES.test(file.type)) {
      toast.error("Only JPEG, PNG, or WebP images are supported");
      return;
    }
    if (photos.length >= MAX_PHOTOS_PER_SERVICE) {
      toast.error(`Up to ${MAX_PHOTOS_PER_SERVICE} photos per service`);
      return;
    }
    try {
      await uploadMedia.mutateAsync({
        file,
        options: {
          service_id: serviceId,
          caption: file.name.replace(/\.[^.]+$/, ""),
        },
      });
      toast.success("Photo uploaded");
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "Upload failed — please try again"));
    }
  };

  const handleDelete = async (mediaId: string) => {
    setPendingDeleteId(mediaId);
    try {
      await deleteMedia.mutateAsync(mediaId);
      toast.success("Photo removed");
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "Couldn't remove photo"));
    } finally {
      setPendingDeleteId(null);
    }
  };

  // Always render exactly MAX_PHOTOS_PER_SERVICE cells so the grid stays
  // visually stable (existing photos first, then empty upload slots).
  const cells = Array.from(
    { length: MAX_PHOTOS_PER_SERVICE },
    (_, i) => photos[i] ?? null,
  );

  return (
    <div>
      <p className="mb-1.5 text-[11px] text-muted-foreground">
        Service Photos{" "}
        <span className="text-muted-foreground/60">
          ({photos.length}/{MAX_PHOTOS_PER_SERVICE} · JPEG/PNG/WebP, up to 10 MB each)
        </span>
      </p>
      <div className="grid grid-cols-3 gap-2">
        {cells.map((photo, idx) => {
          if (photo) {
            const isDeleting = pendingDeleteId === photo.id && deleteMedia.isPending;
            return (
              <div
                key={photo.id}
                className="group relative aspect-square overflow-hidden rounded-xl border border-border/40"
              >
                <img
                  src={photo.url}
                  alt={photo.caption ?? "Service photo"}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleDelete(photo.id)}
                  disabled={isDeleting}
                  className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-card/80 backdrop-blur transition-colors hover:bg-destructive/80 disabled:opacity-60"
                  aria-label="Remove photo"
                >
                  {isDeleting
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <XIcon className="h-3.5 w-3.5" />}
                </button>
              </div>
            );
          }
          return (
            <button
              key={`empty-${idx}`}
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMedia.isPending}
              className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border/60 text-muted-foreground/70 transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Add service photo"
            >
              {uploadMedia.isPending && idx === photos.length ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-[10px] font-medium">Add photo</span>
                </>
              )}
            </button>
          );
        })}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          // Reset so picking the same file twice still triggers onChange.
          e.target.value = "";
          handleUpload(file);
        }}
      />
    </div>
  );
}
