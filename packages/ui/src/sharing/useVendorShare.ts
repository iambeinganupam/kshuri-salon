'use client';
// ─────────────────────────────────────────────────────────────────────────────
// useVendorShare — shared share-action hook for vendor profile surfaces.
//
// One canonical action, used by every Share affordance across the platform:
//
//   • SharePortfolioButton (vendor's own dashboard Portfolio page)
//   • VendorHeader's "Share" button (next to vendor name)
//   • VendorBookingCard's "Share" button (booking sidebar)
//   • Customer portal vendor profile breadcrumb (if/when re-added)
//
// Behaviour:
//   • Mobile (Web Share API)  → native share sheet (WhatsApp / SMS / Mail)
//   • Desktop                 → clipboard copy with a polished toast
//   • Plain http:// origins   → hidden-textarea execCommand fallback
//   • Missing slug            → returns `canShare: false`; surfaces a tooltip
//                                hint at the call site
//
// Returns a stable callback plus state flags so call sites can render a
// disabled state with the right ARIA label and tooltip — no per-site
// duplication of the share UX rules.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { buildVendorShareUrl } from './buildVendorShareUrl';

export interface UseVendorShareInput {
  /** Public slug from the vendor's `url_slug` column. Null = share disabled. */
  slug: string | null | undefined;
  /** Display name — used in the OS share-sheet title/text and the toast. */
  vendorName?: string | null;
  /** Override the customer-portal origin. Defaults to env / window.origin. */
  baseUrl?: string;
}

export interface UseVendorShareResult {
  /** True when a share action can actually be performed (slug + origin both
   *  resolve). When false, call sites should render a disabled button with
   *  the `disabledReason` as a tooltip. */
  canShare: boolean;
  /** Fully-resolved customer-portal URL, or null when not shareable. */
  shareUrl: string | null;
  /** Human-readable reason when `canShare` is false. */
  disabledReason: string | null;
  /** Click handler — invokes native share on mobile, clipboard on desktop. */
  onShare: () => Promise<void>;
  /** Open the public URL in a new tab. No-op when `canShare` is false. */
  onOpen: () => void;
}

async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* fall through to legacy path */
    }
  }
  if (typeof document === 'undefined') return false;
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  } finally {
    document.body.removeChild(textarea);
  }
  return ok;
}

export function useVendorShare({
  slug,
  vendorName,
  baseUrl,
}: UseVendorShareInput): UseVendorShareResult {
  const shareUrl = useMemo(
    () => buildVendorShareUrl({ slug, baseUrl }),
    [slug, baseUrl],
  );

  const canShare = shareUrl !== null;
  const disabledReason = canShare
    ? null
    : 'Public link not set up yet — try again once the profile is published.';

  const onShare = useCallback(async () => {
    if (!shareUrl) return;
    const canNativeShare =
      typeof navigator !== 'undefined' && typeof navigator.share === 'function';
    if (canNativeShare) {
      try {
        await navigator.share({
          title: vendorName ? `${vendorName} on Kshuri` : 'Kshuri portfolio',
          text: vendorName
            ? `Check out ${vendorName} on Kshuri — book here:`
            : 'Check out this Kshuri portfolio — book here:',
          url: shareUrl,
        });
        return;
      } catch (err) {
        // User dismissed the share sheet — normal cancel, not a failure.
        if ((err as DOMException)?.name === 'AbortError') return;
      }
    }
    const copied = await copyToClipboard(shareUrl);
    if (copied) {
      toast.success('Link copied to clipboard', { description: shareUrl });
    } else {
      toast.message('Copy not supported — long-press to copy', {
        description: shareUrl,
      });
    }
  }, [shareUrl, vendorName]);

  const onOpen = useCallback(() => {
    if (!shareUrl || typeof window === 'undefined') return;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  }, [shareUrl]);

  return { canShare, shareUrl, disabledReason, onShare, onOpen };
}
