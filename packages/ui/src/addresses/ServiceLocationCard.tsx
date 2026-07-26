'use client';
// ─────────────────────────────────────────────────────────────────────────────
// ServiceLocationCard — Service-location editor for vendor Portfolio Edit
// pages. Has two modes:
//
//   • view  — compact summary of the saved address + a small read-only
//             map preview + an "Edit" button. Used when the vendor
//             already has a saved pin (the common case after first save).
//   • edit  — full AddressPicker (search + interactive map + auto-detect)
//             + Save + Cancel. Used when the vendor has no saved data
//             yet OR when they click Edit from view mode.
//
// After a successful Save the card flips back to view mode automatically.
// Cancel discards in-flight draft edits and returns to view mode without
// touching the persisted value.
//
// Presentation + draft state only — the parent owns the persistence
// callback because salon and freelancer write to different endpoints.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from 'react';
import { Edit, Loader2, MapPin, Save, X } from 'lucide-react';
import { Button } from '../components/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/card';
import { AddressPicker, type AddressPickerValue } from './AddressPicker';
import { MapPreview } from './MapPreview';

interface Props {
  /** Persisted location loaded from the vendor profile. */
  initialValue: AddressPickerValue;
  /** Persist callback. Throw to bubble up an error toast. */
  onSave: (value: AddressPickerValue) => void | Promise<void>;
  /** Whether the parent's save mutation is in flight. */
  isSaving?: boolean;
  /** Section title — defaults to "Service location". */
  title?: string;
  /** One-line caption rendered under the title. */
  description?: string;
  /** Forward to AddressPicker. */
  countryHint?: string;
  /** Forward to AddressPicker. */
  autoDetectOnMount?: boolean;
}

function hasAnyValue(v: AddressPickerValue): boolean {
  return Boolean(
    (v.address_line1 ?? '').trim() ||
      (v.city ?? '').trim() ||
      (v.state ?? '').trim() ||
      (v.postal_code ?? '').trim() ||
      (v.latitude != null && v.longitude != null),
  );
}

function composeAddress(v: AddressPickerValue): string {
  const parts = [v.address_line1, v.city, v.state, v.postal_code]
    .map((p) => (p ?? '').trim())
    .filter(Boolean);
  return parts.join(', ');
}

export function ServiceLocationCard({
  initialValue,
  onSave,
  isSaving,
  title = 'Service location',
  description = 'This is where customers will see you on the map and how they get directions to you.',
  countryHint = 'in',
  autoDetectOnMount = true,
}: Props) {
  const hasSavedValue = useMemo(() => hasAnyValue(initialValue), [initialValue]);
  // Empty-state vendors land directly in edit mode so they can pick a
  // location without an extra click; everyone else starts collapsed.
  const [isEditing, setIsEditing] = useState(!hasSavedValue);
  const [draft, setDraft] = useState<AddressPickerValue>(initialValue);

  // Re-seed the draft when the persisted value changes (e.g. parent
  // refetched after a save). The only path that mutates the persisted
  // value is this card's Save button, so overwriting local edits here
  // is safe — Save has already produced this update.
  useEffect(() => {
    setDraft(initialValue);
  }, [initialValue]);

  const handleSave = async () => {
    try {
      await onSave(draft);
      // Save succeeded — collapse back to view mode. If onSave threw,
      // the parent toasts and we stay in edit mode so the user can fix
      // the input and retry.
      setIsEditing(false);
    } catch {
      // Swallow — parent's onSave already surfaced the error toast.
    }
  };

  const handleCancel = () => {
    setDraft(initialValue);
    setIsEditing(false);
  };

  const summary = composeAddress(initialValue);
  const hasCoords =
    initialValue.latitude != null && initialValue.longitude != null;

  return (
    <Card className="border-border/40">
      <CardHeader
        className={
          isEditing
            ? undefined
            : 'flex-row items-start justify-between space-y-0 gap-4'
        }
      >
        <div className="min-w-0">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
        {!isEditing && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs h-8 rounded-lg shrink-0"
            onClick={() => setIsEditing(true)}
          >
            <Edit className="h-3.5 w-3.5" /> Edit
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <>
            <AddressPicker
              value={draft}
              onChange={setDraft}
              countryHint={countryHint}
              autoDetectOnMount={autoDetectOnMount}
            />
            <div className="flex justify-end gap-2">
              {hasSavedValue && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-xs h-8 rounded-lg"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  <X className="h-3.5 w-3.5" /> Cancel
                </Button>
              )}
              <Button
                size="sm"
                className="gap-1.5 text-xs h-8 rounded-lg"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                {isSaving ? 'Saving…' : 'Save location'}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Compact address summary */}
            <div className="flex items-start gap-3 rounded-xl border border-border/40 bg-muted/20 p-3">
              <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <div className="min-w-0 text-sm">
                {summary ? (
                  <p className="text-foreground font-medium leading-relaxed break-words">
                    {summary}
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">
                    No address set yet — click Edit to add one.
                  </p>
                )}
                {hasCoords && (
                  <p className="text-[10px] text-muted-foreground font-mono mt-1">
                    {initialValue.latitude!.toFixed(5)},{' '}
                    {initialValue.longitude!.toFixed(5)}
                  </p>
                )}
              </div>
            </div>
            {/* Read-only map (smaller, no click handler) */}
            {hasCoords && (
              <MapPreview
                lat={initialValue.latitude}
                lng={initialValue.longitude}
                height={180}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default ServiceLocationCard;
