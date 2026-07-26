'use client';
// ─────────────────────────────────────────────────────────────────────────────
// CategoryPicker — flat-hierarchy picker for vendor edit pages.
//
// Single popover, no drill-down. The whole taxonomy is visible at once with
// clear visual hierarchy:
//
//   HAIR ······································  (sticky header, distinct chip)
//     • Hair cutting
//     • Highlights
//     • …
//   BRIDAL ····································
//     ↳ No subcategories yet. Type below to add one.
//   …
//
// Every leaf is clickable. Empty categories show an inline hint + are
// targetable by the footer "+ Add" form (via a dropdown). One-step. Clear.
//
// Used by both salon Specializations and freelancer Skills with the same
// shape — vendors think about it the same way regardless of role.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Sparkles, X } from 'lucide-react';
import { useVendorCategories, useCreateVendorCategory } from '@kshuri/api-client';
import { Badge } from '../../badge';
import { Button } from '../../button';
import { Input } from '../../input';
import { Popover, PopoverContent, PopoverTrigger } from '../../popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../select';
import { cn } from '../../../lib/utils';

export interface CategoryPickerProps {
  /** "top": pick top-level categories only (caps depth).
   *  "leaf": pick subcategories — the dominant mode for both vendors. */
  mode: 'top' | 'leaf';
  /** Currently-picked names. Drives chip rendering + dedupe in the picker. */
  value: string[];
  /** Fires when the user adds a new pick. `category` is the parent name for
   *  leaf-mode picks, or null in top-mode / top-level custom picks. */
  onAdd: (item: { name: string; category: string | null }) => void;
  /** Fires when the user removes a chip. */
  onRemove: (name: string) => void;
  /** Allow vendor to create custom categories/subcategories inline. */
  allowCustom?: boolean;
  /** Placeholder copy on the trigger button. */
  placeholder?: string;
  /** Disable the picker (e.g. while parent is saving). */
  disabled?: boolean;
  /** Empty-state copy when no chips are selected. */
  emptyText?: string;
  className?: string;
}

interface TreeNode {
  id: string;
  name: string;
  children: Array<{ id: string; name: string }>;
}

export function CategoryPicker({
  mode,
  value,
  onAdd,
  onRemove,
  allowCustom = true,
  placeholder,
  disabled,
  emptyText = 'None added yet.',
  className,
}: CategoryPickerProps) {
  const categoriesQuery = useVendorCategories();
  const createCategory = useCreateVendorCategory();

  // Flat rows → top-level + sorted children, alphabetised within each level.
  const tree: TreeNode[] = useMemo(() => {
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

  // Popover open state + ephemeral picker state.
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [customName, setCustomName] = useState('');
  // For the footer "+ Add a custom skill" form (leaf mode): which parent to
  // attach the new subcategory under. Default to the first non-empty category
  // so the form is usable in one click.
  const firstTopWithChildren = tree.find((t) => t.children.length > 0)?.id ?? tree[0]?.id ?? '';
  const [customParentId, setCustomParentId] = useState<string>(firstTopWithChildren);

  // Keep the selected parent in sync once the tree loads.
  useEffect(() => {
    if (!customParentId && firstTopWithChildren) {
      setCustomParentId(firstTopWithChildren);
    }
  }, [firstTopWithChildren, customParentId]);

  // Reset ephemeral state whenever the popover closes.
  useEffect(() => {
    if (!open) {
      setSearch('');
      setCustomName('');
    }
  }, [open]);

  const triggerLabel = placeholder ?? (mode === 'leaf' ? 'Add a skill' : 'Add a category');

  // Filter the tree by the search query. A category matches if its OWN name
  // matches OR any of its children match — children are filtered down to the
  // matching subset too. Empty categories still surface if their name matches.
  const filteredTree: TreeNode[] = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tree;
    return tree
      .map((t) => {
        const nameMatches = t.name.toLowerCase().includes(q);
        const matchingChildren = t.children.filter((c) =>
          c.name.toLowerCase().includes(q),
        );
        if (nameMatches || matchingChildren.length > 0) {
          return { ...t, children: nameMatches ? t.children : matchingChildren };
        }
        return null;
      })
      .filter((t): t is TreeNode => t !== null);
  }, [tree, search]);

  function pickLeaf(parentName: string, leafName: string) {
    if (value.includes(leafName)) return;
    onAdd({ name: leafName, category: parentName });
  }

  function pickTop(topName: string) {
    if (value.includes(topName)) return;
    onAdd({ name: topName, category: null });
    setOpen(false);
  }

  async function handleAddCustom(targetParentId: string | null) {
    const name = customName.trim();
    if (!name) return;
    if (mode === 'leaf' && !targetParentId) return;
    try {
      const created = await createCategory.mutateAsync(
        targetParentId ? { name, parent_id: targetParentId } : { name },
      );
      const parent = targetParentId ? tree.find((t) => t.id === targetParentId) : null;
      onAdd({ name: created.name, category: parent?.name ?? null });
      setCustomName('');
    } catch {
      // Errors surface as toasts upstream; leave the typed name in place so
      // the vendor can correct + retry without re-typing.
    }
  }

  // Loading / error short-circuits.
  if (categoriesQuery.isLoading) {
    return <p className={cn('text-xs text-muted-foreground', className)}>Loading categories…</p>;
  }
  if (categoriesQuery.isError) {
    return (
      <p className={cn('text-xs text-destructive', className)}>
        Couldn't load categories — refresh to retry.
      </p>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Selected chips */}
      <div className="flex flex-wrap gap-2 min-h-[28px]">
        {value.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">{emptyText}</p>
        ) : (
          value.map((name) => (
            <Badge
              key={name}
              variant="outline"
              className="text-xs gap-1 text-primary border-primary/30"
            >
              {name}
              <button
                type="button"
                onClick={() => onRemove(name)}
                disabled={disabled}
                aria-label={`Remove ${name}`}
                className="disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
              </button>
            </Badge>
          ))
        )}
      </div>

      {/* Flat-hierarchy popover picker */}
      <Popover open={open} onOpenChange={(o) => !disabled && setOpen(o)}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className="h-9 rounded-xl text-xs gap-1.5 px-3 justify-start w-full sm:w-[220px]"
          >
            <Plus className="h-3.5 w-3.5" />
            {triggerLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          {/* Search */}
          <div className="relative border-b border-border/60 p-1.5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/70" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={mode === 'leaf' ? 'Search categories & skills' : 'Search categories'}
              className="h-7 text-xs pl-8 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
              autoFocus
            />
          </div>

          {/* Body: flat hierarchy. Headers + nested leaves. */}
          <div className="max-h-[340px] overflow-y-auto py-1">
            {filteredTree.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                {search ? 'No matches' : 'No categories yet — add one below'}
              </p>
            ) : (
              filteredTree.map((top, idx) => {
                const topAlreadyPicked = value.includes(top.name);
                const isEmpty = top.children.length === 0;
                return (
                  <div key={top.id} className={cn(idx > 0 && 'mt-1')}>
                    {/* Category header. In mode="top" the whole row is a
                        big tap-target. In mode="leaf" the header itself is
                        a section label, not a button, but is still clickable
                        to add the top-level as a skill (handy for empty
                        categories like Bridal / Massage that are meaningful
                        on their own). */}
                    <button
                      type="button"
                      onClick={() => {
                        if (topAlreadyPicked) return;
                        pickTop(top.name);
                      }}
                      disabled={topAlreadyPicked}
                      className={cn(
                        'flex w-full items-center justify-between gap-2 px-3 py-1.5',
                        'text-[10px] font-bold uppercase tracking-wider',
                        'bg-muted/40 border-y border-border/30',
                        'transition-colors text-left',
                        topAlreadyPicked
                          ? 'text-muted-foreground/50 cursor-default'
                          : 'text-primary hover:bg-primary/10 cursor-pointer',
                      )}
                      title={
                        topAlreadyPicked
                          ? `${top.name} already added`
                          : `Add ${top.name} as a ${mode === 'leaf' ? 'general skill' : 'category'}`
                      }
                    >
                      <span className="flex items-center gap-1.5">
                        {top.name}
                        {topAlreadyPicked && (
                          <span className="text-[9px] text-muted-foreground normal-case font-normal">
                            (added)
                          </span>
                        )}
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 font-normal normal-case">
                        {!isEmpty && <span>{top.children.length}</span>}
                        {!topAlreadyPicked && (
                          <Plus className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                        )}
                      </span>
                    </button>

                    {/* Children — flat list, each a button row. */}
                    {top.children.map((leaf) => {
                      const leafPicked = value.includes(leaf.name);
                      return (
                        <button
                          key={leaf.id}
                          type="button"
                          onClick={() => pickLeaf(top.name, leaf.name)}
                          disabled={leafPicked}
                          className={cn(
                            'flex w-full items-center gap-2 pl-7 pr-3 py-2 text-left text-xs',
                            'transition-colors focus:outline-none',
                            leafPicked
                              ? 'text-muted-foreground/50 cursor-default'
                              : 'text-foreground hover:bg-accent/60 focus-visible:bg-accent/60',
                          )}
                        >
                          <span className="text-muted-foreground/40 select-none shrink-0">└</span>
                          <span className="truncate">{leaf.name}</span>
                          {leafPicked && (
                            <span className="ml-auto text-[10px] text-muted-foreground">added</span>
                          )}
                        </button>
                      );
                    })}

                    {/* Empty-category placeholder (shown only when not filtering
                        away the whole category). Vendors see "No subcategories
                        yet — add one below" and the bottom Add form is pre-
                        wired with this parent. */}
                    {isEmpty && !topAlreadyPicked && (
                      <div className="pl-7 pr-3 py-1.5 text-[10px] italic text-muted-foreground/70">
                        No subcategories yet — pick the category itself above, or add one below.
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer: + Add custom. Single inline form. In leaf mode, includes
              a small parent-category dropdown so the new subcategory is
              attached under the right top. In top mode, just a name input. */}
          {allowCustom && (
            <div className="border-t border-border/60 p-2 space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {mode === 'leaf' ? 'Add a custom skill' : 'Add a custom category'}
              </p>
              <div className="flex gap-1.5">
                {mode === 'leaf' && (
                  <Select
                    value={customParentId}
                    onValueChange={setCustomParentId}
                    disabled={createCategory.isPending || tree.length === 0}
                  >
                    <SelectTrigger className="h-7 rounded-md text-[11px] w-[110px] shrink-0">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {tree.map((t) => (
                        <SelectItem key={t.id} value={t.id} className="text-xs">
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={mode === 'leaf' ? 'New skill name' : 'New category name'}
                  className="h-7 text-xs flex-1"
                  maxLength={60}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustom(mode === 'leaf' ? customParentId : null);
                    }
                  }}
                  disabled={createCategory.isPending}
                />
                <Button
                  type="button"
                  size="sm"
                  className="h-7 px-2 text-[11px] shrink-0"
                  onClick={() => handleAddCustom(mode === 'leaf' ? customParentId : null)}
                  disabled={
                    !customName.trim() ||
                    createCategory.isPending ||
                    (mode === 'leaf' && !customParentId)
                  }
                >
                  {createCategory.isPending ? '…' : 'Add'}
                </Button>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default CategoryPicker;
