'use client';
// ─────────────────────────────────────────────────────────────────────────────
// DocumentUploader — file input wrapper for KYC document upload.
//
// Uploads via POST /media/portfolio (multipart/form-data).
// Emits (mediaId, url) on success.
// Accepts jpg/jpeg/png only (backend enforces; pdf is rejected by media module).
// Max 5 MB client-side guard (backend allows 10 MB — keep UI stricter for KYC).
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useState } from 'react';
import { CheckCircle2, Loader2, Upload } from 'lucide-react';
import { useApiClient } from '@kshuri/api-client';
import type { UploadedMedia } from '@kshuri/api-client';
import { Button } from '../components/button';

interface Props {
  onUploaded: (mediaId: string, url: string) => void;
  /** Comma-separated file extensions accepted by the <input>. */
  acceptedTypes?: string;
  maxMb?: number;
}

export function DocumentUploader({
  onUploaded,
  acceptedTypes = '.jpg,.jpeg,.png',
  maxMb = 5,
}: Props) {
  const client = useApiClient();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (file.size > maxMb * 1024 * 1024) {
      setError(`File too large (max ${maxMb} MB)`);
      return;
    }
    setError(null);
    setUploading(true);
    setFileName(file.name);
    setUploadedUrl(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('purpose', 'kyc');
      const res = await client.post<{ success: true; data: UploadedMedia }>(
        '/media/portfolio',
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      const { id, url } = res.data.data;
      setUploadedUrl(url);
      onUploaded(id, url);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: { message?: string } } } };
      setError(apiErr?.response?.data?.error?.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  const succeeded = !!uploadedUrl && !error;

  return (
    <div
      className={`group relative rounded-2xl border-2 border-dashed bg-muted/30 p-6 transition-colors ${
        succeeded ? 'border-primary/60 bg-primary/5' : 'border-border/60 hover:border-primary/60'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={acceptedTypes}
        disabled={uploading}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      <div className="flex flex-col items-center text-center">
        <div
          className={`mb-3 grid h-12 w-12 place-items-center rounded-full ${
            succeeded
              ? 'bg-primary/15 text-primary'
              : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
          }`}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : succeeded ? (
            <CheckCircle2 className="h-6 w-6" />
          ) : (
            <Upload className="h-6 w-6" />
          )}
        </div>

        <p className="text-sm font-medium text-foreground">
          {succeeded
            ? 'Document uploaded'
            : uploading
            ? 'Uploading…'
            : 'Upload Aadhaar or PAN photo'}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {fileName ?? `Accepted: ${acceptedTypes} · Max ${maxMb} MB`}
        </p>

        <Button
          type="button"
          variant={succeeded ? 'outline' : 'secondary'}
          className="mt-4 h-10 rounded-xl font-medium"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {succeeded ? 'Replace file' : 'Choose file'}
        </Button>

        {uploadedUrl && (
          <a
            href={uploadedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 text-xs font-medium text-primary hover:underline"
          >
            Preview uploaded document
          </a>
        )}
        {error && (
          <p className="mt-3 text-xs font-medium text-destructive">{error}</p>
        )}
      </div>
    </div>
  );
}
