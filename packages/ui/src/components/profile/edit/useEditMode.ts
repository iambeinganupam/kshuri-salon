'use client';
// ─────────────────────────────────────────────────────────────────────────────
// useEditMode — shared edit-mode controller for vendor portfolio pages.
//
// Owns: isEditing toggle, isSaving spinner state, beforeunload warning when
// dirty. The page owns its own form state (useState calls); this hook just
// orchestrates the lifecycle and surfaces a single Save handler that wraps
// the page's async save with a loading flag.
//
// Pair with `useDraftAutosave` for localStorage persistence and
// `<EditModeBar>` for the sticky bottom Save/Cancel bar.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from 'react';

export interface UseEditModeOptions {
  /** Called when user clicks Save in the sticky bar. Throws to keep edit mode open. */
  onSave: () => Promise<void> | void;
  /** Called when user clicks Cancel — page should reset its draft state. */
  onCancel?: () => void;
  /** Called when user clicks Edit — page should seed its draft from saved values. */
  onEnter?: () => void;
  /** True when the draft differs from the saved value. Drives beforeunload warning. */
  isDirty: boolean;
}

export interface EditModeApi {
  isEditing: boolean;
  isSaving: boolean;
  enter: () => void;
  cancel: () => void;
  save: () => Promise<void>;
}

export function useEditMode({ onSave, onCancel, onEnter, isDirty }: UseEditModeOptions): EditModeApi {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const enter = useCallback(() => {
    onEnter?.();
    setIsEditing(true);
  }, [onEnter]);

  const cancel = useCallback(() => {
    onCancel?.();
    setIsEditing(false);
  }, [onCancel]);

  const save = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSave();
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }, [onSave]);

  // Warn before leaving the tab/page with unsaved changes. The browser
  // ignores custom messages on modern Chrome/Firefox; the prompt itself
  // is enough to nudge the user.
  useEffect(() => {
    if (!isEditing || !isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isEditing, isDirty]);

  return { isEditing, isSaving, enter, cancel, save };
}

export default useEditMode;
