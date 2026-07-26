// ─────────────────────────────────────────────────────────────────────────────
// RequestAssignmentDialog — Salon-side composer for a salon→freelancer gig
// ─────────────────────────────────────────────────────────────────────────────
// Self-contained dialog. Opens from the freelancer's detail page; on submit
// posts to /api/v1/assignments and closes. Picks the salon location from the
// business's locations list (auto-selects the first).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, IndianRupee } from "lucide-react";
import { toast } from "sonner";
import {
  useBusinessLocations,
  useCreateAssignment,
} from "@kshuri/api-client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  freelancerId: string;
  freelancerName: string;
}

const SERVICE_CATEGORIES = ["Hair", "Beard", "Skin", "Nails", "Spa", "Makeup", "Other"];

/** Round up to the next 15-minute mark; returns YYYY-MM-DDTHH:mm in local TZ. */
function defaultStartLocal(): string {
  const d = new Date();
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15 + 30, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function addHours(localIso: string, hours: number): string {
  const d = new Date(localIso);
  d.setHours(d.getHours() + hours);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Convert a local 'YYYY-MM-DDTHH:mm' string to an ISO UTC string. */
function localToUtc(localIso: string): string {
  return new Date(localIso).toISOString();
}

export default function RequestAssignmentDialog({
  open,
  onOpenChange,
  freelancerId,
  freelancerName,
}: Props) {
  const { data: locations, isLoading: loadingLocations } = useBusinessLocations();
  const createAssignment = useCreateAssignment();

  const [locationId, setLocationId] = useState<string>("");
  const [category, setCategory] = useState<string>("Hair");
  const [startLocal, setStartLocal] = useState<string>(defaultStartLocal);
  const [endLocal, setEndLocal] = useState<string>(() => addHours(defaultStartLocal(), 2));
  const [amount, setAmount] = useState<string>("1000");
  const [notes, setNotes] = useState<string>("");

  // Auto-select the first location when data lands.
  useEffect(() => {
    if (!locationId && locations && locations.length > 0) {
      setLocationId(locations[0].id);
    }
  }, [locations, locationId]);

  const isValid = useMemo(() => {
    if (!locationId) return false;
    if (!startLocal || !endLocal) return false;
    if (new Date(endLocal) <= new Date(startLocal)) return false;
    if (Number(amount) < 0) return false;
    return true;
  }, [locationId, startLocal, endLocal, amount]);

  async function handleSubmit() {
    if (!isValid) return;
    try {
      await createAssignment.mutateAsync({
        salon_location_id: locationId,
        freelancer_id: freelancerId,
        service_category: category,
        notes: notes.trim() || undefined,
        start_time: localToUtc(startLocal),
        end_time: localToUtc(endLocal),
        proposed_amount: Number(amount) || 0,
      });
      toast.success(`Request sent to ${freelancerName}`);
      onOpenChange(false);
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? (err as Error).message;
      toast.error("Couldn't send request", { description: msg });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif">Request {freelancerName}</DialogTitle>
          <DialogDescription>
            Send a gig request. The freelancer will see it in their dashboard and can accept or decline.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Salon location */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Salon Location</Label>
            <Select value={locationId} onValueChange={setLocationId} disabled={loadingLocations}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Choose location" />
              </SelectTrigger>
              <SelectContent>
                {(locations ?? []).map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.display_name ?? loc.address_line1 ?? loc.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Service Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SERVICE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Time window */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <CalendarDays className="h-3 w-3" /> Start
              </Label>
              <Input
                type="datetime-local"
                value={startLocal}
                onChange={(e) => setStartLocal(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <CalendarDays className="h-3 w-3" /> End
              </Label>
              <Input
                type="datetime-local"
                value={endLocal}
                onChange={(e) => setEndLocal(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <IndianRupee className="h-3 w-3" /> Proposed amount (₹)
            </Label>
            <Input
              type="number"
              min={0}
              step={50}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-xl"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Brief, dress code, expected services, etc."
              rows={3}
              className="rounded-xl"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || createAssignment.isPending}
            className="rounded-xl"
          >
            {createAssignment.isPending ? "Sending…" : "Send Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
