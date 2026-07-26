'use client';
// ─────────────────────────────────────────────────────────────────────────────
// BannerLogoUploader — Banner + Logo upload card for vendor Edit pages.
//
// Mirrors the salon dashboard's "Banner & Logo" card so the freelancer
// (and any future vendor surface) renders an identical experience. The
// component is presentation-only: parents own the upload-to-storage and
// update-profile mutations and pass back the resulting URL.
//
// Wire shape:
//   <BannerLogoUploader
//     bannerUrl={...}
//     logoUrl={...}
//     onBannerFile={async (file) => {...}}
//     onLogoFile={async (file) => {...}}
//   />
//
// While a callback is in flight, an internal `uploading` state drives a
// spinner overlay over the active target (banner vs logo) so the user
// gets clear progress feedback, and both file inputs are disabled to
// prevent overlapping uploads. The optional `isUploading` prop is still
// honored as a generic "busy" signal (e.g. when a parent wants to lock
// the controls during a related mutation) but the spinner placement is
// internal so callers don't need to thread per-target state through.
//
// The file inputs are kept hidden via sr-only + an id so labels can
// natively trigger them on every browser (some mobile Safari versions
// reject `display: none` triggers).
// ─────────────────────────────────────────────────────────────────────────────

import { useId, useState, type ChangeEvent } from 'react';
import { Camera, Loader2, Upload } from 'lucide-react';
import { Button } from '../../button';
import { Card, CardContent, CardHeader, CardTitle } from '../../card';
import { cn } from '../../../lib/utils';

interface Props {
  bannerUrl: string | null | undefined;
  logoUrl: string | null | undefined;
  /** Optional external busy flag — disables both targets when true. */
  isUploading?: boolean;
  /** Called with the chosen Banner file. Reject by throwing. */
  onBannerFile: (file: File) => Promise<void> | void;
  /** Called with the chosen Logo file. Reject by throwing. */
  onLogoFile: (file: File) => Promise<void> | void;
  /** Accept attr — defaults to JPEG / PNG / WebP. */
  accept?: string;
  className?: string;
}

const DEFAULT_ACCEPT = 'image/jpeg,image/png,image/webp';

type UploadTarget = 'banner' | 'logo' | null;

export function BannerLogoUploader({
  bannerUrl,
  logoUrl,
  isUploading,
  onBannerFile,
  onLogoFile,
  accept = DEFAULT_ACCEPT,
  className,
}: Props) {
  // Unique IDs so multiple uploaders can coexist on the same page (e.g.
  // a future multi-location editor) without label-target collisions.
  const reactId = useId();
  const bannerInputId = `banner-upload-${reactId}`;
  const logoInputId = `logo-upload-${reactId}`;

  // Which target is currently uploading — drives the spinner overlay so the
  // banner spinner doesn't appear while the logo is uploading and vice versa.
  const [uploading, setUploading] = useState<UploadTarget>(null);
  const busy = uploading !== null || !!isUploading;

  const handle = (target: NonNullable<UploadTarget>, cb: (file: File) => Promise<void> | void) =>
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      // Reset value so picking the same file twice still fires onChange.
      e.target.value = '';
      if (!file) return;
      setUploading(target);
      try {
        await cb(file);
      } finally {
        setUploading(null);
      }
    };

  return (
    <Card className={cn('border-border/40', className)}>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Banner & Logo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Banner */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Banner Image
          </label>
          <div className="relative h-32 rounded-xl overflow-hidden group">
            {bannerUrl ? (
              <img
                src={bannerUrl}
                alt="Banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted/30 flex items-center justify-center">
                <Camera className="h-8 w-8 text-muted-foreground/30" />
              </div>
            )}
            {/* Hover-darken on desktop; button stays visible on touch. */}
            <div className="absolute inset-0 lg:bg-foreground/0 lg:group-hover:bg-foreground/30 lg:transition-colors flex items-center justify-center">
              <Button
                asChild
                variant="secondary"
                size="sm"
                className="gap-1.5 text-xs rounded-lg lg:opacity-0 lg:group-hover:opacity-100 lg:transition-opacity shadow-md"
              >
                <label
                  htmlFor={bannerInputId}
                  className={cn(
                    'cursor-pointer',
                    busy && 'cursor-not-allowed opacity-50 pointer-events-none',
                  )}
                >
                  <Upload className="h-3.5 w-3.5" /> Change Banner
                </label>
              </Button>
            </div>
            {uploading === 'banner' && (
              <div
                role="status"
                aria-live="polite"
                className="absolute inset-0 bg-foreground/60 flex flex-col items-center justify-center gap-2 text-card"
              >
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-xs font-medium">Uploading banner…</span>
              </div>
            )}
          </div>
        </div>

        {/* Logo */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Logo
          </label>
          <div className="flex items-center gap-4">
            <label
              htmlFor={logoInputId}
              className={cn(
                'relative h-16 w-16 rounded-xl overflow-hidden group block',
                busy ? 'cursor-not-allowed' : 'cursor-pointer',
              )}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted/30 flex items-center justify-center">
                  <Camera className="h-5 w-5 text-muted-foreground/30" />
                </div>
              )}
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/30 transition-colors flex items-center justify-center">
                <Upload className="h-4 w-4 text-card opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {uploading === 'logo' && (
                <div
                  role="status"
                  aria-live="polite"
                  className="absolute inset-0 bg-foreground/60 flex items-center justify-center text-card"
                >
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              )}
            </label>
            <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs rounded-lg">
              <label
                htmlFor={logoInputId}
                className={cn(
                  'cursor-pointer',
                  busy && 'cursor-not-allowed opacity-50 pointer-events-none',
                )}
              >
                {uploading === 'logo' ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5" /> Upload Logo
                  </>
                )}
              </label>
            </Button>
          </div>
        </div>

        {/* Hidden file inputs — sr-only + id so labels can natively trigger
            them in every browser, including iOS Safari. */}
        <input
          id={bannerInputId}
          type="file"
          accept={accept}
          className="sr-only"
          disabled={busy}
          onChange={handle('banner', onBannerFile)}
        />
        <input
          id={logoInputId}
          type="file"
          accept={accept}
          className="sr-only"
          disabled={busy}
          onChange={handle('logo', onLogoFile)}
        />
      </CardContent>
    </Card>
  );
}

export default BannerLogoUploader;
