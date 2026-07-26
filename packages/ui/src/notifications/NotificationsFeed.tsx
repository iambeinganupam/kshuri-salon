'use client';
// ─────────────────────────────────────────────────────────────────────────────
// NotificationsFeed — shared notifications-feed page for vendor dashboards.
//
// Presentational. Each consumer (salon, freelancer, future event-manager)
// wires its own data hook + mutations and passes the UI-shaped notifications
// into this component, so we keep one canonical visual & filter UX across
// the platform. Polls happen at the hook level — this component is purely
// view-side.
//
// Built-in tabs:  All · Unread · Bookings · Payments · Reviews · System
// Built-in CTAs:  Mark all read · per-row click-to-mark-read.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, type ElementType } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Award,
  Bell,
  CalendarCheck,
  CheckCheck,
  Clock,
  CreditCard,
  Shield,
} from 'lucide-react';
import { Badge } from '../components/badge';
import { Button } from '../components/button';
import { Card, CardContent } from '../components/card';
import { Skeleton } from '../components/skeleton';
import { Tabs, TabsList, TabsTrigger } from '../components/tabs';
import { cn } from '../lib/utils';

export type NotificationFeedType =
  | 'booking'
  | 'payment'
  | 'review'
  | 'reminder'
  | 'system'
  | 'alert';

export interface NotificationFeedItem {
  id: string;
  title: string;
  description: string;
  /** Pre-formatted relative time, e.g. "5 min ago". */
  time: string;
  read: boolean;
  type: NotificationFeedType;
}

interface Props {
  items: NotificationFeedItem[];
  unreadCount: number;
  isLoading?: boolean;
  /** Section title; defaults to "Notifications". */
  title?: string;
  /** Microcopy under the title. */
  subtitle?: string;
  /** Hooks that resolve when the row should re-render. */
  onMarkRead: (id: string) => void | Promise<void>;
  onMarkAllRead: () => void | Promise<void>;
}

const typeConfig: Record<
  NotificationFeedType,
  { icon: ElementType; bg: string; color: string }
> = {
  booking:  { icon: CalendarCheck,  bg: 'bg-primary/15',     color: 'text-primary' },
  payment:  { icon: CreditCard,     bg: 'bg-success/15',     color: 'text-success' },
  review:   { icon: Award,          bg: 'bg-accent/15',      color: 'text-accent' },
  reminder: { icon: Clock,          bg: 'bg-primary/15',     color: 'text-primary' },
  system:   { icon: Shield,         bg: 'bg-secondary',      color: 'text-secondary-foreground' },
  alert:    { icon: AlertTriangle,  bg: 'bg-destructive/15', color: 'text-destructive' },
};

export function NotificationsFeed({
  items,
  unreadCount,
  isLoading,
  title = 'Notifications',
  subtitle = 'Stay updated with your bookings, payments, and more',
  onMarkRead,
  onMarkAllRead,
}: Props) {
  const [activeTab, setActiveTab] = useState<string>('all');

  const filtered = items.filter((n) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !n.read;
    return n.type === activeTab;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-12 rounded-xl" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground flex items-center gap-2">
            {title}
            {unreadCount > 0 && (
              <Badge className="bg-primary text-primary-foreground text-xs font-bold rounded-full px-2">
                {unreadCount}
              </Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl text-xs h-8"
          onClick={() => onMarkAllRead()}
          disabled={unreadCount === 0}
        >
          <CheckCheck className="h-3.5 w-3.5 mr-1" /> Mark all read
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card border border-border/40 p-1 rounded-xl shadow-sm flex-wrap h-auto gap-1">
          {[
            { value: 'all',     label: 'All' },
            { value: 'unread',  label: `Unread (${unreadCount})` },
            { value: 'booking', label: 'Bookings' },
            { value: 'payment', label: 'Payments' },
            { value: 'review',  label: 'Reviews' },
            { value: 'system',  label: 'System' },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-lg text-xs font-semibold"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-4 space-y-2">
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="h-16 w-16 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-4">
                  <Bell className="h-7 w-7 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-semibold text-muted-foreground">
                  No notifications
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  You're all caught up!
                </p>
              </motion.div>
            ) : (
              filtered.map((notif, i) => {
                const config = typeConfig[notif.type];
                const Icon = config.icon;
                return (
                  <motion.div
                    key={notif.id}
                    layout
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12, height: 0 }}
                    transition={{ delay: i * 0.02 }}
                  >
                    <Card
                      className={cn(
                        // `shadow-sm` + `border-border/60` make the card
                        // read as a card on every theme — without the
                        // explicit shadow the salon dashboard's `--card`
                        // token lands so close to the page background that
                        // the chrome disappears entirely.
                        'border-border/60 rounded-2xl shadow-sm transition-all duration-200 cursor-pointer hover:shadow-md',
                        !notif.read
                          ? 'bg-primary/[0.04] border-l-4 border-l-primary'
                          : 'bg-card',
                      )}
                      onClick={() => !notif.read && onMarkRead(notif.id)}
                    >
                      <CardContent className="p-4 flex items-start gap-3">
                        <div
                          className={cn(
                            'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
                            config.bg,
                          )}
                        >
                          <Icon className={cn('h-5 w-5', config.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p
                                className={cn(
                                  'text-sm font-semibold',
                                  !notif.read
                                    ? 'text-foreground'
                                    : 'text-foreground/80',
                                )}
                              >
                                {notif.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                {notif.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] text-muted-foreground">
                                {notif.time}
                              </span>
                              {!notif.read && (
                                <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </Tabs>
    </div>
  );
}

export default NotificationsFeed;
