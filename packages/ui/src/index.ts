// ─────────────────────────────────────────────────────────────────────────────
// @kshuri/ui — shared UI primitives + domain components
//
// Layer 1: shadcn/Radix primitives (one export per component)
// Layer 2: motion utilities
// Layer 3: domain components (profile/* — vendor-agnostic profile UI)
// ─────────────────────────────────────────────────────────────────────────────

// Layer 1 — primitives
export * from "./components/accordion";
export * from "./components/alert";
export * from "./components/alert-dialog";
export * from "./components/aspect-ratio";
export * from "./components/avatar";
export * from "./components/badge";
export * from "./components/breadcrumb";
export * from "./components/button";
export * from "./components/calendar";
export * from "./components/card";
export * from "./components/carousel";
export * from "./components/checkbox";
export * from "./components/collapsible";
export * from "./components/command";
export * from "./components/context-menu";
export * from "./components/dialog";
export * from "./components/drawer";
export * from "./components/dropdown-menu";
export * from "./components/form";
export * from "./components/hover-card";
export * from "./components/input";
export * from "./components/input-otp";
export * from "./components/label";
export * from "./components/menubar";
export * from "./components/navigation-menu";
export * from "./components/pagination";
export * from "./components/popover";
export * from "./components/progress";
export * from "./components/radio-group";
export * from "./components/resizable";
export * from "./components/scroll-area";
export * from "./components/select";
export * from "./components/separator";
export * from "./components/sheet";
export * from "./components/sidebar";
export * from "./components/skeleton";
export * from "./components/slider";
// Note: `sonner` and `toaster` (Radix toast) both export `Toaster`/`toast`.
// We expose `sonner` as the canonical toast runtime and re-export the radix
// toast primitives only as type-only references for advanced use cases.
export {
  Toaster as SonnerToaster,
  toast,
} from "./components/sonner";
export * from "./components/switch";
export * from "./components/table";
export * from "./components/tabs";
export * from "./components/textarea";
export * from "./components/toast";
export { Toaster } from "./components/toaster";
export * from "./components/toggle";
export * from "./components/toggle-group";
export * from "./components/tooltip";
export * from "./components/use-toast";

// Layer 2 — motion utilities
export * from "./components/motion";

// Layer 3 — domain components
export * from "./components/profile";
export * from "./components/services-catalog";
export * from "./components/service-category";

// Layer 4 — address components (MapPreview, AddressPicker, AddressCard, AddressBook)
export * from "./addresses";

// Layer 5 — notification components (NotificationBell, NotificationList, NotificationItem, NotificationPreferences)
export * from "./notifications";

// Layer 6 — KYC components (KycWizard, KycStatusBanner, PlanCard, PlanPicker, DocumentUploader)
export * from "./kyc";

// Layer 7 — messaging components (ChatThread, MessageBubble, MessageComposer, ThreadsList, ThreadListItem)
export * from "./messaging";

// Layer 8 — sharing components (SharePortfolioButton — vendor → customer
// portal shareable link, used by salon + freelancer Portfolio Edit pages)
export * from "./sharing";

// Layer 9 — data-state primitives (DataState orchestrator, EmptyState, ErrorState, skeleton kit)
export * from "./components/data-state";

// Layer 10 — image primitives (KshuriImage with Cloudinary auto-transform + srcset)
export * from "./components/image";

// Layer 11 — route-level error boundary (designed fallback + onError hook)
export * from "./components/error-boundary";

// Layer 12 — mobile bottom navigation (safe-area-aware, badge support)
export * from "./components/bottom-nav";

// Utilities
export * from "./lib/utils";
