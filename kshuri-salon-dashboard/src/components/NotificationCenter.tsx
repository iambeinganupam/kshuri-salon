/* eslint-disable @typescript-eslint/no-explicit-any -- API hook returns from @kshuri/api-client are loosely shaped; narrowing belongs at the hook layer in a follow-up pass. */
import { useState } from "react";
import { Bell, CheckCircle2, AlertCircle, UserCheck, XCircle, Star, Wallet, CalendarDays, Check, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: "booking" | "payment" | "staff" | "review" | "system";
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: React.ComponentType<any>;
  iconColor: string;
}

const initialNotifications: Notification[] = [
  { id: "n1", type: "booking", title: "New Booking", message: "Priya Sharma booked Bridal Mehendi for 10:00 AM today", time: "2 min ago", read: false, icon: CalendarDays, iconColor: "text-blue-400" },
  { id: "n2", type: "payment", title: "Payment Received", message: "₹15,000 received from Deepa Menon via UPI", time: "15 min ago", read: false, icon: Wallet, iconColor: "text-emerald-400" },
  { id: "n3", type: "staff", title: "Freelancer Online", message: "Anjali Verma is now available for assignments", time: "30 min ago", read: false, icon: UserCheck, iconColor: "text-primary" },
  { id: "n4", type: "review", title: "New Review", message: "Priya Sharma left a 5-star review for Bridal Mehendi", time: "1 hr ago", read: true, icon: Star, iconColor: "text-amber-400" },
  { id: "n5", type: "system", title: "Settlement Overdue", message: "Urban Chic salon has ₹30,000 overdue settlement", time: "2 hrs ago", read: true, icon: AlertCircle, iconColor: "text-destructive" },
  { id: "n6", type: "booking", title: "Booking Cancelled", message: "Kavitha Nair cancelled her 2:00 PM appointment", time: "3 hrs ago", read: true, icon: XCircle, iconColor: "text-destructive" },
  { id: "n7", type: "payment", title: "Low Balance Alert", message: "Your wallet balance is below ₹1,000", time: "5 hrs ago", read: true, icon: AlertCircle, iconColor: "text-amber-400" },
  { id: "n8", type: "staff", title: "Staff Verified", message: "Lakshmi Iyer's Aadhaar verification is complete", time: "1 day ago", read: true, icon: CheckCircle2, iconColor: "text-emerald-400" },
];

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("all");

  const unreadCount = notifications.filter(n => !n.read).length;

  const filtered = tab === "all" ? notifications : notifications.filter(n => n.type === tab);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  };

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAll = () => {
    setNotifications([]);
    toast.success("All notifications cleared");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative h-9 w-9 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors">
          <Bell className="h-[18px] w-[18px] text-muted-foreground" />
          {unreadCount > 0 && (
            <div className="absolute top-1 right-1 h-4 min-w-[16px] px-1 rounded-full bg-primary ring-2 ring-card flex items-center justify-center">
              <span className="text-[9px] font-bold text-primary-foreground">{unreadCount}</span>
            </div>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0 rounded-xl" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Badge className="text-[9px] h-5 bg-primary/10 text-primary border-primary/20 rounded-full">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="text-[11px] h-7 px-2 text-muted-foreground" onClick={markAllRead}>
                <Check className="h-3 w-3 mr-1" /> Read all
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" className="text-[11px] h-7 px-2 text-muted-foreground" onClick={clearAll}>
                <Trash2 className="h-3 w-3 mr-1" /> Clear
              </Button>
            )}
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <div className="px-3 pt-2">
            <TabsList className="w-full h-8 bg-muted/40 rounded-lg p-0.5">
              <TabsTrigger value="all" className="text-[10px] h-7 rounded-md flex-1">All</TabsTrigger>
              <TabsTrigger value="booking" className="text-[10px] h-7 rounded-md flex-1">Bookings</TabsTrigger>
              <TabsTrigger value="payment" className="text-[10px] h-7 rounded-md flex-1">Payments</TabsTrigger>
              <TabsTrigger value="staff" className="text-[10px] h-7 rounded-md flex-1">Staff</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[340px]">
            <TabsContent value={tab} className="m-0 p-2">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
                    <Bell className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">No notifications</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">You're all caught up!</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {filtered.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className={cn(
                        "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors hover:bg-secondary/50",
                        !n.read && "bg-primary/[0.03]"
                      )}
                    >
                      <div className={cn("mt-0.5 shrink-0 h-8 w-8 rounded-lg flex items-center justify-center", !n.read ? "bg-primary/10" : "bg-muted/50")}>
                        <n.icon className={cn("h-4 w-4", n.iconColor)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn("text-[12px] font-semibold", !n.read ? "text-foreground" : "text-muted-foreground")}>{n.title}</p>
                          {!n.read && <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                        </div>
                        <p className="text-[11px] text-muted-foreground/70 mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground/50 mt-1">{n.time}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}