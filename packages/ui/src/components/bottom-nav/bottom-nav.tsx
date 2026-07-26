import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "../../lib/utils";

export interface BottomNavItem {
  label: string;
  icon: LucideIcon;
  /** Render the item as a link (href) or a button (onClick). One required. */
  href?: string;
  onClick?: () => void;
  /** Show as the active item (e.g. matches current route). */
  active?: boolean;
  /**
   * Optional notification badge:
   *   - number → shown as "N" (or "9+" when >9 and `truncate` is true)
   *   - string → shown verbatim
   *   - true   → red dot, no number
   *   - 0 / false / undefined → no badge
   */
  badge?: number | string | boolean;
  /** Disable the item (greyed out, no interaction). */
  disabled?: boolean;
}

export interface BottomNavProps {
  items: readonly BottomNavItem[];
  /** Render `<a>` (default) or use a router Link via the `as` prop. */
  as?: React.ElementType<{ href?: string; className?: string; children?: React.ReactNode }>;
  /**
   * Hide the nav at and above the `lg` breakpoint by default. Set false to
   * keep it visible on desktop (rare).
   */
  hideOnDesktop?: boolean;
  className?: string;
  /** When >9 and badge is numeric, render "9+". Default true. */
  truncateBadge?: boolean;
}

function renderBadge(badge: BottomNavItem["badge"], truncate: boolean): React.ReactNode {
  if (badge === undefined || badge === null || badge === false || badge === 0) {
    return null;
  }
  if (badge === true) {
    return (
      <span className="absolute right-3 top-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
    );
  }
  const label =
    typeof badge === "number" && truncate && badge > 9 ? "9+" : String(badge);
  return (
    <span
      aria-label={`${label} unread`}
      className="absolute right-2 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-semibold text-destructive-foreground ring-2 ring-background"
    >
      {label}
    </span>
  );
}

/**
 * BottomNav — mobile-first bottom navigation bar.
 *
 * - Honors iOS safe-area-inset-bottom via Tailwind's `pb-[env(safe-area-inset-bottom)]`.
 * - Renders each item as `<a href>` by default; pass `as={Link}` to use a
 *   router link component (react-router's Link, Next.js Link, etc).
 * - Items with `onClick` render as `<button>` regardless of `as`.
 * - Hides on `lg+` by default (desktop apps usually have a sidebar).
 *
 * Consumers determine `active` themselves (via `useLocation` / `usePathname`).
 */
export const BottomNav = React.forwardRef<HTMLElement, BottomNavProps>(
  function BottomNav(
    { items, as: As = "a", hideOnDesktop = true, className, truncateBadge = true },
    ref,
  ) {
    return (
      <nav
        ref={ref}
        aria-label="Primary"
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-border/40 bg-background/95 backdrop-blur",
          "pb-[env(safe-area-inset-bottom)]",
          hideOnDesktop && "lg:hidden",
          className,
        )}
      >
        <ul
          className="grid h-14"
          style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
        >
          {items.map((item) => {
            const { label, icon: Icon, href, onClick, active, badge, disabled } = item;
            const tone = active
              ? "text-primary"
              : disabled
                ? "text-muted-foreground/40"
                : "text-muted-foreground hover:text-foreground";
            const inner = (
              <>
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform",
                    active && "scale-110",
                  )}
                  aria-hidden="true"
                />
                <span className="text-[10px] font-medium leading-none">{label}</span>
                {renderBadge(badge, truncateBadge)}
              </>
            );
            const sharedClass = cn(
              "relative flex h-full flex-col items-center justify-center gap-1 px-2",
              "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              tone,
              disabled && "pointer-events-none",
            );

            return (
              <li key={`${label}-${href ?? "btn"}`} className="relative">
                {onClick ? (
                  <button
                    type="button"
                    onClick={onClick}
                    disabled={disabled}
                    aria-current={active ? "page" : undefined}
                    aria-label={label}
                    className={cn(sharedClass, "w-full")}
                  >
                    {inner}
                  </button>
                ) : (
                  <As
                    href={href ?? "#"}
                    aria-current={active ? "page" : undefined}
                    aria-label={label}
                    className={sharedClass}
                  >
                    {inner}
                  </As>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    );
  },
);
