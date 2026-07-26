'use client';
// ─────────────────────────────────────────────────────────────────────────────
// ServiceCategoryGrid — the 8-card "Browse by service" homepage grid.
//
// Pure presentational. Caller fetches the categories (the portal uses
// `useServiceCategories()` from @kshuri/api-client) and provides an
// `hrefBuilder` so the same component works for Next.js, Vite SPAs, and
// React Native shells (you can return `#` and intercept click).
//
// Accessibility: each card is wrapped by the caller's link. We render the
// content; we do not bring our own routing.
// ─────────────────────────────────────────────────────────────────────────────

import * as React from 'react';
import { Card, CardContent } from '../card';
import { Badge } from '../badge';
import { cn } from '../../lib/utils';
import { resolveCategoryIcon } from './category-icons';
import type { ServiceCategoryNode } from './types';

export interface ServiceCategoryGridProps {
  categories: ServiceCategoryNode[];
  /** Build the destination href for each card. */
  hrefBuilder?: (category: ServiceCategoryNode) => string;
  /** Optional render-prop wrapper to provide app-native navigation
   *  (e.g. Next.js `<Link>`, react-router-dom `<Link>`). When omitted,
   *  cards render with a plain `<a>`. */
  renderLink?: (props: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => React.ReactElement;
  /** Show "N vendors" badge. Defaults to true (matches the portal grid). */
  showVendorCount?: boolean;
  /** Hide categories that have zero vendors. Defaults to false so empty
   *  roots are still discoverable. */
  hideEmpty?: boolean;
  /** Visual density. `compact` packs more cards per row. */
  variant?: 'default' | 'compact';
  className?: string;
}

const DEFAULT_HREF = (c: ServiceCategoryNode) => `/services/${c.slug ?? c.id}`;

export function ServiceCategoryGrid({
  categories,
  hrefBuilder = DEFAULT_HREF,
  renderLink,
  showVendorCount = true,
  hideEmpty = false,
  variant = 'default',
  className,
}: ServiceCategoryGridProps) {
  const filtered = hideEmpty
    ? categories.filter((c) => (c.vendor_count ?? 0) > 0)
    : categories;

  return (
    <div
      className={cn(
        'grid gap-4',
        variant === 'compact'
          ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        className,
      )}
    >
      {filtered.map((c) => {
        const Icon = resolveCategoryIcon(c.icon);
        const href = hrefBuilder(c);
        const card = (
          <Card
            className={cn(
              'group relative h-full overflow-hidden border border-border/60',
              'bg-gradient-to-br from-primary/[0.06] via-card to-card transition-all duration-300',
              'hover:border-primary/40 hover:shadow-[0_8px_32px_-4px_oklch(0.38_0.15_18_/_0.18)]',
            )}
          >
            <CardContent
              className={cn(
                'flex flex-col gap-4',
                variant === 'compact' ? 'p-4' : 'p-6',
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center rounded-xl bg-primary/10 text-primary',
                  'transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground',
                  variant === 'compact' ? 'h-11 w-11' : 'h-14 w-14',
                )}
              >
                <Icon className={variant === 'compact' ? 'h-5 w-5' : 'h-6 w-6'} />
              </div>
              <div className="flex flex-col gap-1.5">
                <h3
                  className={cn(
                    'font-serif font-semibold text-foreground tracking-tight',
                    variant === 'compact' ? 'text-base' : 'text-lg sm:text-xl',
                  )}
                >
                  {c.name}
                </h3>
                {c.description && variant !== 'compact' && (
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {c.description}
                  </p>
                )}
                {showVendorCount && (
                  <Badge
                    variant="outline"
                    className="mt-1 w-fit text-[10px] gap-1 text-primary border-primary/30 bg-primary/5"
                  >
                    {(c.vendor_count ?? 0)}+ {(c.vendor_count ?? 0) === 1 ? 'vendor' : 'vendors'}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        );

        const linkClass = 'block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-lg';
        if (renderLink) {
          return (
            <React.Fragment key={c.id}>
              {renderLink({ href, children: card, className: linkClass })}
            </React.Fragment>
          );
        }
        return (
          <a key={c.id} href={href} className={linkClass}>
            {card}
          </a>
        );
      })}
    </div>
  );
}

export default ServiceCategoryGrid;
