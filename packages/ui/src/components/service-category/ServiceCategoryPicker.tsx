'use client';
// ─────────────────────────────────────────────────────────────────────────────
// ServiceCategoryPicker — the unified service-taxonomy picker.
//
// One component, three modes:
//   • multi-select   → vendor onboarding / catalog editor (returns string[] IDs)
//   • single-select  → "pick the category for this service" form field
//   • filter         → customer + event-manager filter sidebar
//
// Data sources (caller can override with `categories` prop):
//   • mode='filter'                            → useServiceCategories(audience)  (public)
//   • mode in {multi,single}, allowCustom=true → useVendorCategoryTree(audience)  (vendor scope, supports custom adds)
//   • mode in {multi,single}, allowCustom=false → useServiceCategories(audience)  (public, read-only)
//
// Layout: accordion of roots, each open root shows a checkbox/radio grid of
// subs + an inline "+ Add custom" form (when allowCustom + an authenticated
// vendor scope). Sticky search bar at the top filters both roots and subs.
// ─────────────────────────────────────────────────────────────────────────────

import * as React from 'react';
import {
  ChevronDown,
  Plus,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import type {
  CategoryAudience,
  ServiceCategory,
  VendorCategoryTreeNode,
} from '@kshuri/api-client/types';
import {
  useServiceCategories,
  useVendorCategoryTree,
  useCreateVendorCategory,
} from '@kshuri/api-client/hooks';
import { Badge } from '../badge';
import { Button } from '../button';
import { Checkbox } from '../checkbox';
import { Input } from '../input';
import { Skeleton } from '../skeleton';
import { cn } from '../../lib/utils';
import { resolveCategoryIcon } from './category-icons';
import type { ServiceCategoryNode } from './types';

export type ServiceCategoryPickerMode = 'multi-select' | 'single-select' | 'filter';

export interface ServiceCategoryPickerProps {
  mode: ServiceCategoryPickerMode;
  /** Audience scope for the tree fetch. Defaults to 'grooming'. */
  audience?: CategoryAudience;
  /** IDs of currently-selected subcategories (or roots). Drives the
   *  checked/unchecked state of every item. */
  value: string[];
  onChange: (next: string[]) => void;
  /** Allow creating custom subcategories inline. Only meaningful in vendor
   *  scope (multi/single modes). Ignored in 'filter' mode. */
  allowCustom?: boolean;
  /** Show "N vendors" chip per root. Mostly useful in 'filter' mode. */
  showVendorCount?: boolean;
  /** Categories override — when present, skips internal fetching. Useful
   *  when the parent screen already has the tree in memory and wants to
   *  avoid a duplicate request. */
  categories?: ReadonlyArray<ServiceCategory | VendorCategoryTreeNode>;
  /** Open roots by default. Defaults to ['all'] (every root expanded) when
   *  there are ≤3 roots, else first 2 only. Pass [] to keep all collapsed. */
  defaultOpen?: string[] | 'all' | 'none';
  /** Hide the search input. Defaults to false. */
  hideSearch?: boolean;
  /** Disable interaction (e.g. while parent form is saving). */
  disabled?: boolean;
  className?: string;
}

// ── Internal type coercion ─────────────────────────────────────────────────

function coerce(
  input: ServiceCategory | VendorCategoryTreeNode,
): ServiceCategoryNode {
  // Both shapes have id/name/slug/icon/icon_url/description and a
  // `subcategories` array. ServiceCategory carries `vendor_count`, the
  // vendor tree carries `vendor_id` (non-null ⇒ custom). Coerce both.
  const isVendorNode = 'vendor_id' in input;
  const subs = (input.subcategories ?? []) as Array<
    ServiceCategory | VendorCategoryTreeNode
  >;
  return {
    id: input.id,
    parent_id: input.parent_id ?? null,
    name: input.name,
    slug: input.slug ?? null,
    description: input.description ?? null,
    icon: input.icon ?? null,
    icon_url: input.icon_url ?? null,
    vendor_count: 'vendor_count' in input ? input.vendor_count : undefined,
    audience: 'audience' in input ? input.audience ?? null : null,
    is_custom: isVendorNode ? (input as VendorCategoryTreeNode).vendor_id !== null : false,
    subcategories: subs.map(coerce),
  };
}

// ── Picker ─────────────────────────────────────────────────────────────────

export function ServiceCategoryPicker({
  mode,
  audience = 'grooming',
  value,
  onChange,
  allowCustom = false,
  showVendorCount = false,
  categories,
  defaultOpen,
  hideSearch = false,
  disabled = false,
  className,
}: ServiceCategoryPickerProps) {
  // Pick the right data source. The conditional hook calls would normally be
  // a rules-of-hooks violation, but `mode + allowCustom` are stable for the
  // component's lifetime in every real usage. Callers needing to swap modes
  // dynamically should remount the picker.
  const useVendorScope = (mode === 'multi-select' || mode === 'single-select') && allowCustom;
  const publicQuery = useServiceCategories(useVendorScope ? undefined : audience);
  const vendorQuery = useVendorCategoryTree(useVendorScope ? audience : undefined);
  const createCustom = useCreateVendorCategory();

  const source = useVendorScope ? vendorQuery : publicQuery;
  const isLoading = !categories && source.isLoading;
  const isError = !categories && source.isError;

  const tree: ServiceCategoryNode[] = React.useMemo(() => {
    const raw = categories ?? (source.data ?? []);
    return (raw as Array<ServiceCategory | VendorCategoryTreeNode>).map(coerce);
  }, [categories, source.data]);

  // ── Search ──
  const [search, setSearch] = React.useState('');
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tree;
    return tree
      .map((root) => {
        const rootMatches = root.name.toLowerCase().includes(q);
        const matchingSubs = root.subcategories.filter((s) =>
          s.name.toLowerCase().includes(q),
        );
        if (rootMatches || matchingSubs.length > 0) {
          return { ...root, subcategories: rootMatches ? root.subcategories : matchingSubs };
        }
        return null;
      })
      .filter((r): r is ServiceCategoryNode => r !== null);
  }, [tree, search]);

  // ── Open / collapsed state per root ──
  const initialOpenSet = React.useMemo(() => {
    if (defaultOpen === 'none') return new Set<string>();
    if (Array.isArray(defaultOpen)) return new Set(defaultOpen);
    if (defaultOpen === 'all' || tree.length <= 3) {
      return new Set(tree.map((r) => r.id));
    }
    return new Set(tree.slice(0, 2).map((r) => r.id));
  }, [tree, defaultOpen]);
  const [openIds, setOpenIds] = React.useState<Set<string>>(initialOpenSet);
  // Re-sync open state once the tree first loads.
  React.useEffect(() => {
    if (openIds.size === 0 && tree.length > 0) {
      setOpenIds(initialOpenSet);
    }
    // We deliberately depend only on the first load — subsequent tree
    // changes (e.g. a custom add) shouldn't blow away the user's open state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree.length === 0]);
  // Auto-expand any root whose subs match the active search so users can
  // see what they typed without clicking the chevron.
  React.useEffect(() => {
    if (!search) return;
    const expand = new Set(openIds);
    filtered.forEach((r) => expand.add(r.id));
    if (expand.size !== openIds.size) setOpenIds(expand);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function toggleOpen(id: string) {
    const next = new Set(openIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setOpenIds(next);
  }

  // ── Selection ──
  const valueSet = React.useMemo(() => new Set(value), [value]);

  function toggle(id: string) {
    if (disabled) return;
    if (mode === 'single-select') {
      onChange([id]);
      return;
    }
    const next = new Set(valueSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(Array.from(next));
  }

  function selectAllUnder(root: ServiceCategoryNode) {
    if (disabled) return;
    const next = new Set(valueSet);
    root.subcategories.forEach((s) => next.add(s.id));
    onChange(Array.from(next));
  }

  function clearUnder(root: ServiceCategoryNode) {
    if (disabled) return;
    const next = new Set(valueSet);
    root.subcategories.forEach((s) => next.delete(s.id));
    onChange(Array.from(next));
  }

  function countSelectedUnder(root: ServiceCategoryNode): number {
    let c = 0;
    for (const s of root.subcategories) if (valueSet.has(s.id)) c += 1;
    return c;
  }

  // ── Custom add (inline per-root form) ──
  const [customDraft, setCustomDraft] = React.useState<Record<string, string>>({});
  const canAddCustom = useVendorScope && !!allowCustom;

  async function handleAddCustom(rootId: string) {
    const name = (customDraft[rootId] ?? '').trim();
    if (!name) return;
    try {
      const created = await createCustom.mutateAsync({ name, parent_id: rootId, audience });
      // Auto-pick the new sub so the vendor's intent is preserved.
      if (mode === 'single-select') {
        onChange([created.id]);
      } else {
        onChange([...value, created.id]);
      }
      setCustomDraft((d) => ({ ...d, [rootId]: '' }));
    } catch {
      // Errors bubble to toasts upstream; keep the typed name in place so
      // the user can edit + retry without re-entering.
    }
  }

  // ── Render ──
  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    );
  }
  if (isError) {
    return (
      <p className={cn('text-sm text-destructive', className)}>
        Couldn't load categories. Refresh to retry.
      </p>
    );
  }
  if (tree.length === 0) {
    return (
      <p className={cn('text-sm text-muted-foreground', className)}>
        No categories available.
      </p>
    );
  }

  return (
    <div className={cn('space-y-2', className)} data-mode={mode}>
      {!hideSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories…"
            className="pl-9 h-10"
            aria-label="Search categories"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((root) => {
          const Icon = resolveCategoryIcon(root.icon);
          const isOpen = openIds.has(root.id);
          const selectedCount = countSelectedUnder(root);
          const total = root.subcategories.length;

          return (
            <div
              key={root.id}
              className={cn(
                'rounded-xl border border-border/60 bg-card transition-colors',
                selectedCount > 0 && 'border-primary/40 bg-primary/[0.02]',
              )}
            >
              {/* Root row */}
              <button
                type="button"
                onClick={() => toggleOpen(root.id)}
                aria-expanded={isOpen}
                disabled={disabled}
                className={cn(
                  'flex w-full items-center justify-between gap-3 px-4 py-3 text-left',
                  'rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                  'hover:bg-muted/40 transition-colors',
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                      selectedCount > 0
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-primary/10 text-primary',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {root.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {selectedCount > 0
                        ? `${selectedCount} of ${total} selected`
                        : `${total} ${total === 1 ? 'option' : 'options'}`}
                      {showVendorCount && root.vendor_count !== undefined && (
                        <span> · {root.vendor_count} vendor{root.vendor_count === 1 ? '' : 's'}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {selectedCount > 0 && mode !== 'single-select' && (
                    <Badge
                      variant="outline"
                      className="text-[10px] gap-1 text-primary border-primary/30 bg-primary/5"
                    >
                      {selectedCount}
                    </Badge>
                  )}
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-muted-foreground transition-transform',
                      isOpen && 'rotate-180',
                    )}
                  />
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-border/40 px-4 py-3 space-y-3">
                  {/* Multi-select bulk actions */}
                  {mode === 'multi-select' && root.subcategories.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[11px]"
                        onClick={() => selectAllUnder(root)}
                        disabled={disabled || selectedCount === total}
                      >
                        Select all
                      </Button>
                      {selectedCount > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-[11px] text-muted-foreground"
                          onClick={() => clearUnder(root)}
                          disabled={disabled}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Subcategory grid */}
                  {root.subcategories.length === 0 ? (
                    <p className="text-xs italic text-muted-foreground px-1 py-2">
                      No subcategories yet{canAddCustom ? ' — add one below.' : '.'}
                    </p>
                  ) : (
                    <div className={cn(
                      'grid gap-2',
                      mode === 'filter'
                        ? 'grid-cols-2 sm:grid-cols-3'
                        : 'grid-cols-1 sm:grid-cols-2',
                    )}>
                      {root.subcategories.map((sub) => {
                        const checked = valueSet.has(sub.id);
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => toggle(sub.id)}
                            disabled={disabled}
                            aria-pressed={mode === 'filter' ? checked : undefined}
                            className={cn(
                              'flex items-start gap-2 rounded-lg border px-3 py-2 text-left text-sm',
                              'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                              checked
                                ? 'border-primary/50 bg-primary/[0.06] text-foreground'
                                : 'border-border/60 bg-card hover:bg-muted/40 text-foreground',
                              disabled && 'opacity-50 cursor-not-allowed',
                            )}
                          >
                            {mode !== 'filter' && (
                              <Checkbox
                                checked={checked}
                                onCheckedChange={() => toggle(sub.id)}
                                className="mt-0.5 pointer-events-none"
                                tabIndex={-1}
                                aria-hidden
                              />
                            )}
                            <span className="flex-1 leading-tight">
                              {sub.name}
                              {sub.is_custom && (
                                <Badge
                                  variant="outline"
                                  className="ml-1.5 text-[9px] gap-0.5 border-primary/30 text-primary"
                                >
                                  Custom
                                </Badge>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Add custom — only when we're in a vendor scope */}
                  {canAddCustom && (
                    <div className="border-t border-dashed border-border/40 pt-3 mt-1 flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        value={customDraft[root.id] ?? ''}
                        onChange={(e) =>
                          setCustomDraft((d) => ({ ...d, [root.id]: e.target.value }))
                        }
                        placeholder={`Add a custom ${root.name.toLowerCase()} service`}
                        className="h-8 text-sm flex-1"
                        maxLength={80}
                        disabled={disabled || createCustom.isPending}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustom(root.id);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 gap-1"
                        onClick={() => handleAddCustom(root.id)}
                        disabled={
                          disabled ||
                          createCustom.isPending ||
                          !(customDraft[root.id] ?? '').trim()
                        }
                      >
                        <Plus className="h-3.5 w-3.5" />
                        {createCustom.isPending ? 'Adding…' : 'Add'}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && search && (
          <p className="text-sm text-muted-foreground px-3 py-6 text-center">
            No matches for "{search}".
          </p>
        )}
      </div>
    </div>
  );
}

export default ServiceCategoryPicker;
