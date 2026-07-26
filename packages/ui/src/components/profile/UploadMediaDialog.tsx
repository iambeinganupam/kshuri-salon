// ─────────────────────────────────────────────────────────────────────────────
// UploadMediaDialog — link a portfolio photo to a service before upload.
//
// Services are grouped by category in the picker. Each option shows usage
// (e.g. "2 / 3"); a service that already has the per-service limit of photos
// is disabled. Server-side enforcement is the source of truth — this UI is
// just a fast-path for a clean experience.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from "react";
import { Upload, ImagePlus, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../dialog";
import { Button } from "../button";
import { Input } from "../input";
import { Label } from "../label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../select";
import { useUploadMedia } from "@kshuri/api-client/hooks";
import { toast } from "sonner";

const MAX_PER_SERVICE = 3;
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = /^image\/(jpeg|png|webp)$/;

export interface UploadMediaDialogService {
  id: string;
  name: string;
  category_name?: string | null;
}

export interface UploadMediaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Active services this vendor offers — grouped by category in the picker */
  services: UploadMediaDialogService[];
  /** Map of `service_id → number of media already linked` */
  usageByService: Record<string, number>;
}

export default function UploadMediaDialog({
  open,
  onOpenChange,
  services,
  usageByService,
}: UploadMediaDialogProps) {
  const uploadMedia = useUploadMedia();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [progress, setProgress] = useState<number | null>(null);

  // Build category → services groups, preserving insertion order. Keyed by
  // category name (the canonical identity in this app — service.category_id is
  // optional and often null, while the legacy free-text `category` is what's
  // set).
  const groupedServices = useMemo(() => {
    const groups = new Map<string, { categoryName: string; items: UploadMediaDialogService[] }>();
    for (const svc of services) {
      const name = svc.category_name ?? "Uncategorised";
      if (!groups.has(name)) groups.set(name, { categoryName: name, items: [] });
      groups.get(name)!.items.push(svc);
    }
    return Array.from(groups.values());
  }, [services]);

  // Reset internal state whenever the dialog closes
  useEffect(() => {
    if (open) return;
    setFile(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setServiceId("");
    setCaption("");
    setProgress(null);
  }, [open]);

  const handleFileSelect = (selected: File | null) => {
    if (selected) {
      if (selected.size > MAX_UPLOAD_BYTES) {
        const mb = (selected.size / 1024 / 1024).toFixed(1);
        toast.error(`Image is ${mb} MB — please upload a file under 10 MB`);
        return;
      }
      if (!ALLOWED_TYPES.test(selected.type)) {
        toast.error("Only JPEG, PNG, or WebP images are supported");
        return;
      }
    }
    setFile(selected);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return selected ? URL.createObjectURL(selected) : null;
    });
    if (selected && !caption) {
      setCaption(selected.name.replace(/\.[^.]+$/, ""));
    }
  };

  const isServiceFull = (id: string) => (usageByService[id] ?? 0) >= MAX_PER_SERVICE;
  const canSubmit = !!file && !!serviceId && !isServiceFull(serviceId) && !uploadMedia.isPending;

  const handleSubmit = async () => {
    if (!file || !serviceId) return;
    setProgress(0);
    try {
      await uploadMedia.mutateAsync({
        file,
        options: {
          service_id: serviceId,
          caption: caption || undefined,
        },
        onProgress: (pct) => setProgress(pct),
      });
      toast.success("Photo uploaded");
      onOpenChange(false);
    } catch (err) {
      const apiMsg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(apiMsg ?? "Upload failed — please try again");
    } finally {
      setProgress(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add portfolio photo</DialogTitle>
          <DialogDescription>
            Link this photo to a service. Each service can have up to {MAX_PER_SERVICE} photos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File picker / preview */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Photo
            </Label>
            {previewUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-border/40">
                <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover" />
                <button
                  type="button"
                  onClick={() => handleFileSelect(null)}
                  className="absolute top-2 right-2 h-7 w-7 rounded-full bg-card/80 backdrop-blur flex items-center justify-center hover:bg-destructive/80"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <label
                htmlFor="upload-dialog-file"
                className="flex flex-col items-center justify-center gap-2 h-32 rounded-xl border-2 border-dashed border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer"
              >
                <ImagePlus className="h-7 w-7 text-muted-foreground/60" />
                <span className="text-xs text-muted-foreground">Click to choose an image</span>
                <input
                  id="upload-dialog-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                />
              </label>
            )}
          </div>

          {/* Service picker */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Service
            </Label>
            {services.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Add a service first — photos must be linked to one.
              </p>
            ) : (
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Choose the service this photo represents" />
                </SelectTrigger>
                <SelectContent>
                  {groupedServices.map((group) => (
                    <SelectGroup key={group.categoryName}>
                      <SelectLabel>{group.categoryName}</SelectLabel>
                      {group.items.map((svc) => {
                        const used = usageByService[svc.id] ?? 0;
                        const full = used >= MAX_PER_SERVICE;
                        return (
                          <SelectItem key={svc.id} value={svc.id} disabled={full}>
                            <span className="flex items-center justify-between w-full gap-3">
                              <span>{svc.name}</span>
                              <span className={full ? "text-destructive text-[11px]" : "text-muted-foreground text-[11px]"}>
                                {used} / {MAX_PER_SERVICE}
                              </span>
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Caption (optional) */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Caption <span className="text-muted-foreground/60">(optional)</span>
            </Label>
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="e.g. Layered haircut for medium hair"
              maxLength={200}
              className="h-10 rounded-xl"
            />
          </div>

          {progress !== null && (
            <div className="text-xs text-primary font-medium">Uploading… {progress}%</div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploadMedia.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit} className="gap-1.5">
            <Upload className="h-3.5 w-3.5" />
            {uploadMedia.isPending ? "Uploading…" : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
