'use client';
// ─────────────────────────────────────────────────────────────────────────────
// CategorySingleSelect — single-value picker that uses the same source +
// look-and-feel as the multi-select <CategoryPicker> on the Portfolio Edit
// page. Used in forms (e.g. ServiceFormDialog) where one category or one
// subcategory needs to be chosen.
//
// Why a separate component?
//   • CategoryPicker is multi-select (chips + popover).
//   • Service / Product forms need a single bound value with a clean trigger
//     that shows the current pick — chips don't fit.
//   • Same useVendorCategories() + useCreateVendorCategory() means anything
//     created here is immediately visible on the Portfolio Edit picker (and
//     vice versa) — bidirectional sync.
//
// Two modes (the same as CategoryPicker):
//   • mode="top"   — picks a top-level category.
//   • mode="leaf"  — picks a leaf under a specific parent. The parent is
//                    passed in via `parentName`; if it's empty, the picker
//                    is disabled.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Plus, Search, Sparkles, X } from 'lucide-react';
import { useVendorCategories, useCreateVendorCategory } from '@kshuri/api-client';
import { Button } from '../../button';
import { Input } from '../../input';
import { Popover, PopoverContent, PopoverTrigger } from '../../popover';
import { cn } from '../../../lib/utils';

export interface CategorySingleSelectProps {
  /** "top": picks a top-level category. "leaf": picks a leaf under `parentName`. */
  mode: 'top' | 'leaf';
  /** Current selection by name (empty string when nothing is picked). */
  value: string;
  /** Fired when the selection changes. Empty string means cleared. */
  onChange: (name: string) => void;
  /** For mode="leaf": restrict leaves to children of this top-level name.
   *  When empty or unknown, the picker shows a disabled state asking the
   *  caller to pick a parent first. */
  parentName?: string;
  /** Allow inline "+ Add custom" — defaults to true. */
  allowCustom?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Form-field id (for label htmlFor). */
  id?: string;
}

export function CategorySingleSelect({
  mode,
  value,
  onChange,
  parentName,
  allowCustom = true,
  placeholder,
  disabled,
  className,
  id,
}: CategorySingleSelectProps) {
  const categoriesQuery = useVendorCategories();
  const createCategory = useCreateVendorCategory();

  // Tree of top-level → children, sorted alphabetically within levels.
  const tree = useMemo(() => {
    const rows = categoriesQuery.data ?? [];
    const tops = rows.filter((r) => r.parent_id === null);
    const childrenByParent = new Map<string, typeof rows>();
    for (const r of rows) {
      if (r.parent_id) {
        const arr = childrenByParent.get(r.parent_id) ?? [];
        arr.push(r);
        childrenByParent.set(r.parent_id, arr);
      }
    }
    return tops
      .map((top) => ({
        id: top.id,
        name: top.name,
        children: (childrenByParent.get(top.id) ?? [])
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
          .map((c) => ({ id: c.id, name: c.name })),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [categoriesQuery.data]);

  const parentNode =
    mode === 'leaf' && parentName
      ? tree.find((t) => t.name.toLowerCase() === parentName.toLowerCase()) ?? null
      : null;

  // What rows the popover lists.
  const candidateRows: Array<{ id: string; name: string }> = useMemo(() => {
    if (mode === 'top') return tree.map((t) => ({ id: t.id, name: t.name }));
    if (parentNode) return parentNode.children;
    return [];
  }, [mode, tree, parentNode]);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [customName, setCustomName] = useState('');

  useEffect(() => {
    if (!open) {
      setSearch('');
      setCustomName('');
    }
  }, [open]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return candidateRows;
    return candidateRows.filter((r) => r.name.toLowerCase().includes(q));
  }, [candidateRows, search]);

  const isLeafModeBlocked = mode === 'leaf' && !parentNode;

  async function handleAddCustom() {
    const name = customName.trim();
    if (!name) return;
    if (mode === 'leaf' && !parentNode) return;
    try {
      const created = await createCategory.mutateAsync(
        mode === 'leaf' && parentNode
          ? { name, parent_id: parentNode.id }
          : { name },
      );
      onChange(created.name);
      setCustomName('');
      setOpen(false);
    } catch {
      // Errors surface as toasts upstream; leave the typed name so the
      // vendor can correct + retry.
    }
  }

  // Trigger-button label: current value, or fallback placeholder.
  const triggerLabel =
    value ||
    placeholder ||
    (mode === 'leaf' ? 'Pick a subcategory' : 'Pick a category');

  return (
    <Popover open={open} onOpenChange={(o) => !disabled && !isLeafModeBlocked && setOpen(o)}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled || isLeafModeBlocked}
          className={cn(
            'w-full justify-between font-normal h-10 rounded-md px-3 text-sm',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          <span className="truncate">
            {isLeafModeBlocked ? 'Pick a category first' : triggerLabel}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        {/* Search */}
        <div className="relative border-b border-border/60 p-1.5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/70" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={mode === 'leaf' ? 'Search subcategories' : 'Search categories'}
            className="h-7 text-xs pl-8 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
            autoFocus
          />
        </div>

        {/* Body */}
        <div className="max-h-[280px] overflow-y-auto py-1">
          {/* "Clear selection" — only if there's a current value */}
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-muted-foreground hover:bg-accent/60 focus-visible:bg-accent/60 focus:outline-none"
            >
              <X className="h-3.5 w-3.5" />
              Clear selection
            </button>
          )}

          {filteredRows.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">
              {search
                ? 'No matches'
                : mode === 'leaf' && parentNode?.children.length === 0
                  ? 'No subcategories yet — add one below.'
                  : 'No categories yet'}
            </p>
          ) : (
            filteredRows.map((row) => {
              const selected = row.name === value;
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => {
                    onChange(row.name);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                    'hover:bg-accent/60 focus-visible:bg-accent/60 focus:outline-none',
                    selected && 'bg-primary/10 text-primary',
                  )}
                >
                  <Check className={cn('h-3.5 w-3.5 shrink-0', selected ? 'opacity-100' : 'opacity-0')} />
                  <span className="truncate">{row.name}</span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer: inline + Add custom */}
        {allowCustom && !isLeafModeBlocked && (
          <div className="border-t border-border/60 p-2 space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {mode === 'leaf' ? `Add to ${parentNode?.name}` : 'Add a new category'}
            </p>
            <div className="flex gap-1.5">
              <Input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={mode === 'leaf' ? 'New subcategory' : 'New category'}
                className="h-7 text-xs flex-1"
                maxLength={60}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustom();
                  }
                }}
                disabled={createCategory.isPending}
              />
              <Button
                type="button"
                size="sm"
                className="h-7 px-2 text-[11px] shrink-0"
                onClick={handleAddCustom}
                disabled={!customName.trim() || createCategory.isPending}
              >
                {createCategory.isPending ? (
                  '…'
                ) : (
                  <>
                    <Plus className="h-3 w-3" /> Add
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default CategorySingleSelect;
