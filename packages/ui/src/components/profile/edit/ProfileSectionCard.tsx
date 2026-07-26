'use client';
// ─────────────────────────────────────────────────────────────────────────────
// ProfileSectionCard — common Card chrome for vendor Edit-tab sections.
//
// Renders the salon-style `border-border/40` card with a `text-base
// font-semibold` title, an optional right-side action slot (Edit / Save /
// Cancel button cluster), and the section body. All vendor Edit pages should
// compose with this instead of hand-rolling Card markup so spacing, borders,
// and typography stay aligned.
// ─────────────────────────────────────────────────────────────────────────────

import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../card';
import { cn } from '../../../lib/utils';

interface Props {
  title: ReactNode;
  /** Right-aligned cluster, typically Edit / Save / Cancel buttons. */
  action?: ReactNode;
  /** One-line caption rendered under the title. */
  description?: ReactNode;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
}

export function ProfileSectionCard({
  title,
  action,
  description,
  className,
  contentClassName,
  children,
}: Props) {
  return (
    <Card className={cn('border-border/40', className)}>
      <CardHeader
        className={cn(
          action ? 'flex-row items-center justify-between space-y-0' : undefined,
        )}
      >
        <div className="min-w-0">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {action}
      </CardHeader>
      <CardContent className={cn('space-y-4', contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}

export default ProfileSectionCard;
