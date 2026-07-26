'use client';
// ─────────────────────────────────────────────────────────────────────────────
// TagPicker — Generic badge-list editor for vendor profile fields.
//
// Used for Specializations / Languages / Skills on the salon and freelancer
// Edit pages, matching the salon dashboard's compact badge-row visual. In
// edit mode it renders the active items with a remove (×) on each badge,
// plus an "Add" Select that lists the remaining `suggestions` not already
// chosen. In view mode it just shows the active badges with no editor.
//
// Parents own the underlying list. The component is fully presentational.
// ─────────────────────────────────────────────────────────────────────────────

import type { ComponentType } from 'react';
import { X } from 'lucide-react';
import { Badge } from '../../badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../select';
import { cn } from '../../../lib/utils';

interface Props {
  /** Headline of the picker — e.g. "Specializations". */
  label: string;
  /** Lucide icon component shown next to the label. */
  Icon: ComponentType<{ className?: string }>;
  isEditing: boolean;
  /** Persisted list (view mode). */
  view: string[];
  /** Working draft (edit mode). */
  draft: string[];
  /** Full list of suggestions for the Add Select. */
  suggestions: string[];
  /** Placeholder for the Add Select trigger. */
  addPlaceholder?: string;
  /** Microcopy when the list is empty. */
  emptyHint?: string;
  /** Visual treatment for the active badges. */
  variant?: 'primary' | 'neutral';
  onChange: (next: string[]) => void;
}

export function TagPicker({
  label,
  Icon,
  isEditing,
  view,
  draft,
  suggestions,
  addPlaceholder,
  emptyHint,
  variant = 'neutral',
  onChange,
}: Props) {
  const items = isEditing ? draft : view;
  const remaining = suggestions.filter((s) => !draft.includes(s));

  const remove = (item: string) => onChange(draft.filter((v) => v !== item));
  const add = (item: string) => {
    if (!draft.includes(item)) onChange([...draft, item]);
  };

  return (
    <div>
      <h4 className="text-xs font-semibold flex items-center gap-1.5 mb-2">
        <Icon className="h-3.5 w-3.5 text-primary" /> {label}
      </h4>
      <div className="flex flex-wrap gap-2 mb-2">
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground italic">
            {isEditing
              ? (emptyHint ?? `Add ${label.toLowerCase()} to your profile.`)
              : 'None added yet.'}
          </p>
        )}
        {items.map((item) => (
          <Badge
            key={item}
            variant="outline"
            className={cn(
              'text-xs gap-1',
              variant === 'primary' && 'text-primary border-primary/30',
            )}
          >
            {item}
            {isEditing && (
              <button
                type="button"
                onClick={() => remove(item)}
                aria-label={`Remove ${item}`}
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
              </button>
            )}
          </Badge>
        ))}
      </div>
      {isEditing && remaining.length > 0 && (
        <Select value="" onValueChange={add}>
          <SelectTrigger className="h-9 rounded-xl text-xs w-40">
            <SelectValue
              placeholder={addPlaceholder ?? `Add ${label.toLowerCase()}`}
            />
          </SelectTrigger>
          <SelectContent>
            {remaining.map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

export default TagPicker;
