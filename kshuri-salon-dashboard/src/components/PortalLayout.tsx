/* eslint-disable @typescript-eslint/no-explicit-any -- API hook returns from @kshuri/api-client are loosely shaped; narrowing belongs at the hook layer in a follow-up pass. */
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  CalendarDays,
  Scissors,
  Users,
  UserCheck,
  Receipt,
  Calendar,
  Settings,
  Crown,
  Bell,
  Search,
  ChevronDown,
  LogOut,
  HelpCircle,
  X,
  Building2,
  LayoutGrid,
  BarChart3,
  MapPin,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { NavLink } from "@/components/NavLink";
import { NotificationBell, KycStatusBanner } from "@kshuri/ui";
import type { NotificationDto } from "@kshuri/api-client";
import { useAuth } from "@/lib/auth-context";
import { useAppointments, useUnreadMessagesCount } from "@kshuri/api-client/hooks";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavGroup {
  label: string;
  items: { title: string; url: string; icon: React.ComponentType<any>; badge?: number }[];
}

// ── Unified sidebar grouping ────────────────────────────────────────────────
// Same section labels + order in the freelancer dashboard's AppSidebar.tsx —
// items vary by role but the section rhythm is identical so vendors who
// switch between products (or look at screenshots side-by-side) see the
// same scan pattern. Sections:
//   MAIN · OPERATIONS · CATALOG · TEAM · FINANCE · INSIGHTS · ENGAGE · SETTINGS
// Freelancer dashboard omits TEAM (no staff/freelancer mgmt for solo pros).
const navGroups: NavGroup[] = [
  {
    label: "Main",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Bookings", url: "/bookings", icon: CalendarDays },
      { title: "Calendar", url: "/calendar", icon: Calendar },
      // Messages — hidden until full chat experience ships. The half-baked
      // page is gated behind feature work (presence, attachments, read
      // receipts). Re-enable once that ships.
      // { title: "Messages", url: "/messages", icon: MessageSquare },
    ],
  },
  {
    label: "Catalog",
    items: [
      { title: "Outlet", url: "/salon-profile", icon: Building2 },
      { title: "Portfolio", url: "/portfolio", icon: LayoutGrid },
      { title: "Categories", url: "/services", icon: LayoutGrid },
    ],
  },
  {
    label: "Team",
    items: [
      { title: "Staff", url: "/staff", icon: Users },
      { title: "Freelancers", url: "/freelancers", icon: UserCheck },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Payments", url: "/billing", icon: Receipt },
      { title: "Transactions", url: "/transactions", icon: Receipt },
    ],
  },
  {
    label: "Insights",
    items: [
      { title: "Analytics", url: "/analytics", icon: BarChart3 },
      { title: "Reports", url: "/reports", icon: LayoutDashboard },
    ],
  },
  {
    label: "Engage",
    items: [
      { title: "Notifications", url: "/notifications", icon: Bell },
    ],
  },
  {
    label: "Settings",
    items: [
      { title: "Settings", url: "/settings", icon: Settings },
      { title: "Salon Location", url: "/settings/address", icon: MapPin },
    ],
  },
];

const allNavItems = navGroups.flatMap(g => g.items);
const mobileNavItems = [
  allNavItems.find(i => i.title === "Dashboard")!,
  allNavItems.find(i => i.title === "Bookings")!,
  allNavItems.find(i => i.title === "Categories")!,
  allNavItems.find(i => i.title === "Staff")!,
  allNavItems.find(i => i.title === "Freelancers")!,
];

function SidebarNav() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user } = useAuth();
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.email || "User";
  const initials = fullName.split(" ").map((n) => n[0]?.toUpperCase() ?? "").slice(0, 2).join("");

  const pendingResult = useAppointments({ status: "pending", limit: 50 });
  const pendingItems = (pendingResult.data as any)?.items ?? (Array.isArray(pendingResult.data) ? pendingResult.data : []);
  const pendingCount = pendingItems.length > 0 ? pendingItems.length : undefined;

  const { data: unreadCount } = useUnreadMessagesCount();
  const unreadBadge = unreadCount && unreadCount > 0 ? (unreadCount > 9 ? '9+' : unreadCount) : undefined;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
        <div className="h-9 w-9 rounded-xl bg-sidebar-accent flex items-center justify-center shrink-0">
          <Crown className="h-5 w-5 text-primary" />
        </div>
        {!collapsed && (
          <div>
            <span className="font-serif text-lg font-bold text-foreground tracking-tight block leading-none">
              Estylr
            </span>
            <span className="text-[10px] text-primary/70 uppercase tracking-widest font-semibold leading-none">Outlet Manager</span>
          </div>
        )}
      </div>

      <SidebarContent className="px-3 pt-5">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label} className="mb-2">
            <SidebarGroupLabel className="font-sans text-[10px] uppercase tracking-[0.16em] text-sidebar-foreground/70 px-3 mb-2 font-semibold">
              {!collapsed && group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {group.items.map((item) => {
                  const badge =
                    item.title === "Bookings" ? pendingCount :
                    item.title === "Messages" ? unreadBadge :
                    item.badge;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          // `end` forces exact-path matching so deep routes
                          // like `/settings/address` don't also light up the
                          // parent `/settings` entry. Without this, NavLink
                          // treats any URL with the prefix as active.
                          end
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
                          activeClassName="bg-primary text-primary-foreground font-semibold shadow-sm hover:bg-primary hover:text-primary-foreground"
                        >
                          <item.icon className="h-[18px] w-[18px] shrink-0" />
                          {!collapsed && (
                            <span className="flex-1">{item.title}</span>
                          )}
                          {!collapsed && badge && (
                            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-foreground/20 px-1.5 text-[10px] font-semibold text-primary-foreground">
                              {badge}
                            </span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Logged in as footer */}
      {!collapsed && (
        <div className="mt-auto border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center text-[11px] font-bold text-primary shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-foreground leading-tight">{fullName}</p>
              <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">Outlet Manager</p>
            </div>
          </div>
        </div>
      )}
    </Sidebar>
  );
}

function MobileBottomNav() {
  const location = useLocation();
  const pendingResult = useAppointments({ status: "pending", limit: 50 });
  const pendingItems = (pendingResult.data as any)?.items ?? (Array.isArray(pendingResult.data) ? pendingResult.data : []);
  const hasPending = pendingItems.length > 0;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-card/98 backdrop-blur-xl md:hidden">
      <div className="flex items-center justify-around px-1 py-1.5 safe-area-bottom">
        {mobileNavItems.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <NavLink
              key={item.title}
              to={item.url}
              className={cn(
                "relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-medium transition-all duration-200",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "flex items-center justify-center h-8 w-8 rounded-xl transition-all duration-200",
                isActive && "bg-primary/10"
              )}>
                <item.icon className={cn("h-[18px] w-[18px]", isActive && "text-primary")} />
                {item.title === "Bookings" && hasPending && (
                  <div className="absolute top-0 right-2 h-2 w-2 rounded-full bg-primary ring-2 ring-card" />
                )}
              </div>
              <span className={cn("transition-all duration-200", isActive && "font-semibold")}>{item.title}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

interface PortalLayoutProps {
  children: React.ReactNode;
}

export default function PortalLayout({ children }: PortalLayoutProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleNotifClick = (n: NotificationDto) => {
    const data = (n.data ?? {}) as Record<string, unknown>;
    if (n.type.startsWith("booking_") && data.appointment_id) navigate(`/bookings/${String(data.appointment_id)}`);
    else if (n.type.startsWith("kyc_")) navigate("/settings/kyc");
    // Messages page is hidden until the full chat experience ships — drop
    // message_received deep-links to /notifications instead of /messages/:id
    // (which is unmounted).
    // else if (n.type === "message_received" && data.thread_id) navigate(`/messages/${String(data.thread_id)}`);
  };
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.email || "User";
  const initials = fullName.split(" ").map((n) => n[0]?.toUpperCase() ?? "").slice(0, 2).join("");

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <SidebarNav />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border/50 bg-card/90 backdrop-blur-xl px-4 lg:px-6">
            <SidebarTrigger className="hidden md:flex" />

            {/* Mobile brand */}
            <div className="flex items-center gap-2 md:hidden">
              <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center">
                <Crown className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-serif text-base font-bold text-foreground">Estylr</span>
            </div>

            {/* Desktop search */}
            <div className="hidden md:flex flex-1 max-w-md ml-2">
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                <Input
                  placeholder="Search bookings, services, staff..."
                  className="pl-10 h-9 bg-secondary/50 border-transparent rounded-lg focus:border-border focus:bg-card text-sm placeholder:text-muted-foreground/40 transition-all"
                />
              </div>
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              <button
                className="md:hidden h-9 w-9 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
                onClick={() => setSearchOpen(!searchOpen)}
              >
                {searchOpen ? <X className="h-4 w-4 text-muted-foreground" /> : <Search className="h-4 w-4 text-muted-foreground" />}
              </button>

              <NotificationBell onItemClick={handleNotifClick} />

              <div className="hidden lg:block h-6 w-px bg-border/50 mx-1" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2.5 rounded-lg hover:bg-secondary px-2 py-1.5 transition-colors">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                      {initials}
                    </div>
                    <div className="hidden lg:block text-left">
                      <p className="text-[12px] font-semibold text-foreground leading-none">{fullName}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">Outlet Manager</p>
                    </div>
                    <ChevronDown className="hidden lg:block h-3.5 w-3.5 text-muted-foreground/50" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 p-1.5">
                  <DropdownMenuItem className="gap-2.5 text-[13px] rounded-lg py-2 cursor-pointer" onClick={() => navigate("/settings")}>
                    <Settings className="h-4 w-4" /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2.5 text-[13px] rounded-lg py-2 cursor-pointer">
                    <HelpCircle className="h-4 w-4" /> Help & Support
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem className="gap-2.5 text-[13px] rounded-lg py-2 text-destructive cursor-pointer" onClick={() => { logout(); navigate("/"); }}>
                    <LogOut className="h-4 w-4" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {searchOpen && (
            <div className="md:hidden border-b border-border/50 bg-card px-4 py-2.5 animate-fade-in">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                <Input placeholder="Search..." className="pl-10 h-10 text-sm rounded-lg" autoFocus />
              </div>
            </div>
          )}

          <main className="flex-1 overflow-auto bg-background">
            <div className="px-4 pt-4 lg:px-6">
              <KycStatusBanner onAction={() => navigate('/onboarding/kyc')} />
            </div>
            {children}
          </main>
        </div>
        <MobileBottomNav />
      </div>
    </SidebarProvider>
  );
}
