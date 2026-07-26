'use client';
// ─────────────────────────────────────────────────────────────────────────────
// NavigationGuardDialog — confirmation modal shown when the user tries to
// navigate away from a vendor Edit page with unsaved changes.
//
// Pure presentation: the parent owns the underlying blocker (typically
// react-router-dom's useBlocker) and just wires the three callbacks:
//   • onSaveAndContinue — fire the page's save handler, then proceed.
//   • onDiscard         — drop the draft and proceed.
//   • onStay            — cancel the navigation, keep the user in edit mode.
//
// The dialog deliberately can't be dismissed by clicking outside; the user
// must make a choice. Save is disabled when `hasErrors` is true so the user
// can't try to save invalid data via this prompt.
// ─────────────────────────────────────────────────────────────────────────────

import { Loader2, Save, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../alert-dialog';
import { Button } from '../../button';

export interface NavigationGuardDialogProps {
  open: boolean;
  /** Number of unsaved field changes — surfaced in the body copy. */
  dirtyCount?: number;
  /** True while the save handler is in flight. */
  isSaving?: boolean;
  /** True if any visible inline error blocks save. Save CTA is disabled. */
  hasErrors?: boolean;
  /** Fire the page's save, then proceed with the blocked navigation. */
  onSaveAndContinue: () => void;
  /** Drop the draft and proceed. */
  onDiscard: () => void;
  /** Cancel the navigation, keep the user on the page. */
  onStay: () => void;
}

export function NavigationGuardDialog({
  open,
  dirtyCount,
  isSaving = false,
  hasErrors = false,
  onSaveAndContinue,
  onDiscard,
  onStay,
}: NavigationGuardDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>You have unsaved changes</AlertDialogTitle>
          <AlertDialogDescription>
            {dirtyCount && dirtyCount > 0
              ? `${dirtyCount} unsaved change${dirtyCount === 1 ? '' : 's'} on this page will be lost if you leave without saving.`
              : 'Your unsaved changes on this page will be lost if you leave without saving.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2 flex-col sm:flex-row">
          <AlertDialogCancel
            onClick={onStay}
            disabled={isSaving}
            className="mt-0"
          >
            Keep editing
          </AlertDialogCancel>
          <Button
            variant="outline"
            onClick={onDiscard}
            disabled={isSaving}
            className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
          >
            <Trash2 className="h-3.5 w-3.5" /> Discard changes
          </Button>
          <AlertDialogAction
            onClick={onSaveAndContinue}
            disabled={isSaving || hasErrors}
            className="gap-1.5"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {isSaving ? 'Saving…' : 'Save & continue'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default NavigationGuardDialog;
