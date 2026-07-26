'use client';
// ─────────────────────────────────────────────────────────────────────────────
// EditModeBar — sticky bottom Save/Cancel bar for vendor edit pages.
//
// Renders only while `isEditing` is true. Uses a fixed-positioned, backdrop-
// blurred bar at the viewport bottom with safe-area padding for iOS. Shows:
//   • A status pill (errors → destructive, dirty → primary, else neutral)
//   • Optional label (e.g. "Editing salon profile")
//   • Cancel button (outline)
//   • Save button — disabled when not dirty, when errors exist, or while
//     saving; spinner during saves.
//
// Pair with `useEditMode` for state and `useDraftAutosave` for persistence.
// ─────────────────────────────────────────────────────────────────────────────

import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Save, X } from 'lucide-react';
import { Button } from '../../button';
import { cn } from '../../../lib/utils';

export interface EditModeBarProps {
  isEditing: boolean;
  isSaving: boolean;
  isDirty: boolean;
  /** True if any visible inline error is present. Save will be disabled. */
  hasErrors?: boolean;
  /** Number of unsaved field changes — surfaced as a chip on the Save button. */
  dirtyCount?: number;
  /** Optional left-side helper text. */
  label?: ReactNode;
  /** Optional override for the Save button label. */
  saveLabel?: string;
  /** Optional override for the Cancel button label. */
  cancelLabel?: string;
  onSave: () => void;
  onCancel: () => void;
  className?: string;
}

export function EditModeBar({
  isEditing,
  isSaving,
  isDirty,
  hasErrors = false,
  dirtyCount,
  label,
  saveLabel = 'Save changes',
  cancelLabel = 'Cancel',
  onSave,
  onCancel,
  className,
}: EditModeBarProps) {
  if (!isEditing) return null;

  // Visual state pill on the left — communicates whether saving is gated.
  let statusIcon: ReactNode;
  let statusText: string;
  let statusClass: string;
  if (hasErrors) {
    statusIcon = <AlertCircle className="h-3.5 w-3.5" />;
    statusText = 'Fix the highlighted fields';
    statusClass = 'bg-destructive/10 text-destructive border-destructive/30';
  } else if (isSaving) {
    statusIcon = <Loader2 className="h-3.5 w-3.5 animate-spin" />;
    statusText = 'Saving…';
    statusClass = 'bg-primary/10 text-primary border-primary/30';
  } else if (isDirty) {
    statusIcon = <Save className="h-3.5 w-3.5" />;
    statusText = dirtyCount
      ? `${dirtyCount} unsaved change${dirtyCount === 1 ? '' : 's'}`
      : 'Unsaved changes';
    statusClass = 'bg-primary/10 text-primary border-primary/30';
  } else {
    statusIcon = <CheckCircle2 className="h-3.5 w-3.5" />;
    statusText = 'No changes yet';
    statusClass = 'bg-muted/40 text-muted-foreground border-border/40';
  }

  return (
    <div
      role="region"
      aria-label="Editing toolbar"
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-border/60',
        'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80',
        'shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.25)]',
        'pb-[max(env(safe-area-inset-bottom),0.5rem)]',
        className,
      )}
    >
      <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 lg:px-8">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium',
              statusClass,
            )}
          >
            {statusIcon}
            {statusText}
          </span>
          {label && (
            <span className="text-xs text-muted-foreground truncate hidden sm:inline">
              {label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-lg h-9 text-xs"
            onClick={onCancel}
            disabled={isSaving}
          >
            <X className="h-3.5 w-3.5" /> {cancelLabel}
          </Button>
          <Button
            size="sm"
            className="gap-1.5 rounded-lg h-9 text-xs"
            onClick={onSave}
            disabled={isSaving || hasErrors || !isDirty}
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saveLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EditModeBar;
