// ─────────────────────────────────────────────────────────────────────────────
// CreateBookingDialog — three-step wizard for the salon to create a new
// in-person booking. Renders as a single modal with a progress indicator
// and routes the body to one of three step components based on the form's
// internal step counter.
//
//   Step 1  Customer  — name, phone, channel
//   Step 2  Services  — multi-select from the catalog
//   Step 3  Schedule  — date, time slot, optional staff, notes
//
// State and submit logic live in `useCreateBookingForm`; the catalog and
// vendor id come from the surrounding page through this component's hook
// calls (kept here so each consumer doesn't have to wire them up).
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useServices } from "@kshuri/api-client/hooks";
import { useAuth } from "@/lib/auth-context";
import { StepIndicator } from "./StepIndicator";
import { Step1Customer } from "./Step1Customer";
import { Step2Services } from "./Step2Services";
import { Step3Schedule } from "./Step3Schedule";
import { useCreateBookingForm } from "./useCreateBookingForm";

export function CreateBookingDialog() {
  const [open, setOpen] = useState(false);
  const { user, activeLocationId } = useAuth();
  const vendorId = activeLocationId ?? user?.profile_id ?? null;

  const servicesQuery = useServices();
  const services = Array.isArray(servicesQuery.data) ? servicesQuery.data : [];

  const form = useCreateBookingForm({
    services,
    onSuccess: () => setOpen(false),
  });

  // Close + reset together so the wizard never re-opens mid-flow.
  useEffect(() => {
    if (!open) form.actions.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 h-10 px-4 rounded-xl shadow-sm shrink-0">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Booking</span>
          <span className="sm:hidden">New</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg rounded-2xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="px-6 pt-5 pb-3">
          <DialogHeader>
            <DialogTitle className="text-base">Create Booking</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <StepIndicator current={form.state.step} />
          </div>
        </div>

        <div className="px-6 pb-6 pt-2">
          {form.state.step === 1 && <Step1Customer form={form} />}
          {form.state.step === 2 && (
            <Step2Services
              form={form}
              services={services}
              isLoading={servicesQuery.isLoading}
            />
          )}
          {form.state.step === 3 && (
            <Step3Schedule form={form} vendorId={vendorId} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
