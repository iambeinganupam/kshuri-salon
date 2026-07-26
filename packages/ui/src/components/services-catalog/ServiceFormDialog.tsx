// ─────────────────────────────────────────────────────────────────────────────
// ServiceFormDialog — Add / Edit service dialog.
//
// Identical fields and validation across salon + freelancer dashboards. The
// parent owns the open/close state and the submit handler — this component
// only manages the local form state during the dialog's lifetime.
//
// In edit mode, the dialog also renders the per-service photo grid wired
// through `ServicePhotosEditor`. In add mode, an inline hint nudges the user
// to save first (uploads need a service_id to attach to).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "../button";
import { Input } from "../input";
import { Label } from "../label";
import { Switch } from "../switch";
import { Textarea } from "../textarea";
// Select is still used for the Audience field (unisex / female / male) —
// only the Category/Subcategory dropdowns were replaced.
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "../dialog";
import { ServicePhotosEditor, MAX_PHOTOS_PER_SERVICE } from "./ServicePhotosEditor";
// Single-select picker backed by the same useVendorCategories() the Portfolio
// CategoryPicker uses — categories created from either surface immediately
// show up in both. Replaces the hardcoded SERVICE_CATEGORIES dropdown that
// lived here before.
import { CategorySingleSelect } from "../profile/edit/CategorySingleSelect";
import {
  EMPTY_SERVICE_FORM,
  type CatalogService,
  type ServiceFormValues,
  type ServiceGender,
  type ServicePhoto,
  type ServiceWritePayload,
} from "./types";

/** Trim, drop blank lines, and cap at 10 bullets — what the API expects. */
function parseInclusions(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 10);
}

/** Map a CatalogService row into the dialog's editable form values. */
function toFormValues(svc: CatalogService): ServiceFormValues {
  return {
    name: svc.name,
    // No hardcoded default — the CategoryPicker handles the empty state with
    // a "Pick a category" placeholder, which is clearer than auto-defaulting
    // to "Hair" for services that haven't been categorised yet.
    category: svc.category ?? "",
    subcategory: svc.subcategory ?? "",
    price: String(svc.price ?? ""),
    duration: String(svc.duration ?? 30),
    description: svc.description ?? "",
    gender: svc.gender,
    inclusions: (svc.inclusions ?? []).join("\n"),
    isActive: svc.status !== "inactive",
  };
}

/** Map form values into the wire payload accepted by the catalog API. */
function buildPayload(form: ServiceFormValues): ServiceWritePayload {
  return {
    name: form.name.trim(),
    category: form.category.trim(),
    subcategory: form.subcategory.trim() || undefined,
    price: Number.parseInt(form.price, 10),
    duration_minutes: Number.parseInt(form.duration, 10) || 30,
    description: form.description.trim() || undefined,
    gender_target: form.gender,
    inclusions: parseInclusions(form.inclusions),
    is_active: form.isActive,
  };
}

interface ServiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Service being edited; `null` switches the dialog to "Add" mode. */
  editingService: CatalogService | null;
  /** Photos belonging to the service being edited (filtered upstream). */
  photos?: ServicePhoto[];
  /** Submit handler. Receives the wire payload + the row id (edit mode only). */
  onSubmit: (payload: ServiceWritePayload, editingId: string | null) => Promise<void>;
  isSubmitting?: boolean;
  /**
   * "Submit for Review" copy is shown for vendors whose new services hit a
   * moderation queue (salon dashboard). Freelancers skip the banner.
   */
  showReviewBanner?: boolean;
}

export function ServiceFormDialog({
  open,
  onOpenChange,
  editingService,
  photos = [],
  onSubmit,
  isSubmitting = false,
  showReviewBanner = false,
}: ServiceFormDialogProps) {
  const [form, setForm] = useState<ServiceFormValues>(EMPTY_SERVICE_FORM);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Re-seed the form whenever the dialog opens (editing state may have changed).
  useEffect(() => {
    if (!open) return;
    setForm(editingService ? toFormValues(editingService) : EMPTY_SERVICE_FORM);
    setSubmitError(null);
  }, [open, editingService]);

  const editingId = editingService?.id ?? null;

  const handleSubmit = async () => {
    setSubmitError(null);
    if (!form.name.trim()) {
      setSubmitError("Service name is required");
      return;
    }
    if (!form.category.trim()) {
      setSubmitError("Pick a category");
      return;
    }
    const priceNum = Number.parseInt(form.price, 10);
    if (!priceNum || priceNum <= 0) {
      setSubmitError("Price must be greater than 0");
      return;
    }
    await onSubmit(buildPayload(form), editingId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {editingId ? "Edit Service" : "Add Service"}
          </DialogTitle>
          <DialogDescription>
            {editingId
              ? "Update the details — changes appear on your portfolio immediately."
              : "Create a new service that customers can book."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="svc-name">Name *</Label>
            <Input
              id="svc-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Bridal Hair Styling"
              maxLength={100}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="svc-category">Category *</Label>
              {/* Single-select picker — same source + look-and-feel as the
                  Portfolio Edit page. Anything you create here also shows
                  up there, and vice versa. */}
              <CategorySingleSelect
                id="svc-category"
                mode="top"
                value={form.category}
                onChange={(name) =>
                  // Reset subcategory when the parent changes — old leaves
                  // don't belong under the new parent.
                  setForm({ ...form, category: name, subcategory: "" })
                }
                placeholder="Pick a category"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="svc-subcategory">Subcategory</Label>
              <CategorySingleSelect
                id="svc-subcategory"
                mode="leaf"
                parentName={form.category}
                value={form.subcategory}
                onChange={(name) => setForm({ ...form, subcategory: name })}
                placeholder={form.category ? `Pick a ${form.category} subcategory` : 'Pick a category first'}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="svc-price">Price (₹) *</Label>
              <Input
                id="svc-price"
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="1500"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="svc-duration">Duration (min)</Label>
              <Input
                id="svc-duration"
                type="number"
                min={5}
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                placeholder="30"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="svc-gender">Audience</Label>
            <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v as ServiceGender })}>
              <SelectTrigger id="svc-gender">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unisex">Unisex</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="male">Male</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="svc-description">Description</Label>
            <Textarea
              id="svc-description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What's special about this service?"
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="svc-inclusions">What's included</Label>
            <Textarea
              id="svc-inclusions"
              value={form.inclusions}
              onChange={(e) => setForm({ ...form, inclusions: e.target.value })}
              placeholder={"30-minute dedicated session\nConsultation & personalised approach\nWash & blow-dry included"}
              rows={4}
            />
            <p className="text-[10px] text-muted-foreground">One bullet per line, up to 10.</p>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/30 p-3">
            <div>
              <p className="text-sm font-semibold">Visible to customers</p>
              <p className="text-[11px] text-muted-foreground">Hidden services don't appear on your portfolio.</p>
            </div>
            <Switch
              checked={form.isActive}
              onCheckedChange={(v) => setForm({ ...form, isActive: v })}
            />
          </div>

          {editingId ? (
            <ServicePhotosEditor serviceId={editingId} photos={photos} />
          ) : (
            <div className="rounded-xl border border-dashed border-border/40 bg-muted/20 p-3 text-[11px] text-muted-foreground">
              Save the service first — you'll be able to add up to {MAX_PHOTOS_PER_SERVICE} photos once it's created.
            </div>
          )}

          {showReviewBanner && !editingId && (
            <div className="flex items-center gap-2 rounded-xl bg-muted/50 p-2.5 text-[11px] text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              New services will be reviewed by admin before going live.
            </div>
          )}

          {submitError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-2.5 text-[11px] font-medium text-destructive">
              {submitError}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="font-semibold"
          >
            {isSubmitting
              ? "Saving…"
              : editingId
                ? "Save Changes"
                : showReviewBanner ? "Submit for Review" : "Add Service"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
