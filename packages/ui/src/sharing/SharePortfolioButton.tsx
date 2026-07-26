'use client';
// ─────────────────────────────────────────────────────────────────────────────
// SharePortfolioButton — Share + Open CTA pair for vendor Portfolio pages.
//
// Surfaces a polished, premium share affordance: primary "Share portfolio"
// button on the left, secondary "Open" link to preview the public page on
// the right. All behaviour delegates to `useVendorShare` so this component
// stays in lockstep with the inline Share affordances inside `VendorHeader`
// and `VendorBookingCard`.
//
// Used by:
//   • Salon dashboard Portfolio header   → vendor shares own salon
//   • Freelancer dashboard Portfolio    → vendor shares own profile
//
// (The customer-portal vendor profile uses the inline VendorHeader Share
// button instead — same hook, same behaviour, but visually integrated with
// the vendor identity block rather than a standalone CTA pair.)
// ─────────────────────────────────────────────────────────────────────────────

import { Check, Copy, ExternalLink, Share2 } from 'lucide-react';
import { Button } from '../components/button';
import { cn } from '../lib/utils';
import { useVendorShare } from './useVendorShare';

interface Props {
  /** Public slug from `freelancer_profiles.url_slug` or
   *  `salon_locations.url_slug`. When `null` / empty, both buttons render
   *  disabled with a tooltip explaining why. */
  slug: string | null | undefined;
  /** Vendor display name for the native share sheet's title/text. */
  vendorName?: string;
  /** Override the customer-portal origin (defaults to env / window.origin). */
  baseUrl?: string;
  variant?: 'outline' | 'secondary' | 'default' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  /** Hide the "Open" preview link; render only the primary Share button. */
  compact?: boolean;
  className?: string;
}

export function SharePortfolioButton({
  slug,
  vendorName,
  baseUrl,
  variant = 'outline',
  size = 'sm',
  compact = false,
  className,
}: Props) {
  const { canShare, disabledReason, onShare, onOpen } = useVendorShare({
    slug,
    vendorName,
    baseUrl,
  });

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <Button
        variant={variant}
        size={size}
        className="gap-1.5 rounded-xl"
        onClick={onShare}
        disabled={!canShare}
        aria-label={canShare ? 'Share portfolio' : (disabledReason ?? 'Share unavailable')}
        title={canShare ? undefined : (disabledReason ?? undefined)}
      >
        <Share2 className="h-3.5 w-3.5" />
        <span>Share portfolio</span>
      </Button>
      {!compact && (
        <Button
          variant="ghost"
          size={size}
          className="gap-1.5 rounded-xl text-xs text-muted-foreground"
          onClick={onOpen}
          disabled={!canShare}
          aria-label="Open public portfolio in a new tab"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Open</span>
        </Button>
      )}
    </div>
  );
}

export const ShareIcons = { Share2, Copy, ExternalLink, Check } as const;

export default SharePortfolioButton;
