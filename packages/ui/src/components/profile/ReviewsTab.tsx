// ─────────────────────────────────────────────────────────────────────────────
// ReviewsTab — public-preview Reviews sub-tab.
//
// Displays the rating breakdown summary card plus the chronological review
// list. Rating star colour follows the `--accent` token so both salon (gold)
// and freelancer (gold) themes look correct.
// ─────────────────────────────────────────────────────────────────────────────

import { Card, CardContent } from "../card";
import { Skeleton } from "../skeleton";
import { Star, MessageSquare, AlertCircle } from "lucide-react";
import { FadeIn } from "../motion";
import type { VendorReviewItem, VendorReviewSummary } from "./types";

interface ReviewsTabProps {
  /** Server-side review list (newest first) */
  reviews: VendorReviewItem[];
  /** Aggregated rating distribution for the vendor */
  summary: VendorReviewSummary;
  isLoading?: boolean;
  isError?: boolean;
}

function RatingBar({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <span className="w-4 text-right text-xs font-medium">{label}</span>
      <Star className="h-3 w-3 fill-accent text-accent shrink-0" />
      <div className="flex-1 h-2 rounded-full bg-muted/60 overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-right text-xs text-muted-foreground">{value}</span>
    </div>
  );
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < Math.floor(rating)
              ? "fill-accent text-accent"
              : i < rating
                ? "fill-accent/50 text-accent"
                : "text-muted/50"
          }`}
        />
      ))}
    </div>
  );
}

function relativeDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days < 1) return "Today";
  if (days < 2) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function ReviewsTab({ reviews, summary, isLoading, isError }: ReviewsTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="border-destructive/40">
        <CardContent className="p-6 flex flex-col items-center text-center gap-2">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <p className="text-sm font-medium">Couldn't load reviews</p>
        </CardContent>
      </Card>
    );
  }

  const total = summary.total_count;
  const avg = Math.round(summary.avg_rating * 10) / 10;
  const dist: Record<5 | 4 | 3 | 2 | 1, number> = {
    5: summary.rating_5, 4: summary.rating_4, 3: summary.rating_3,
    2: summary.rating_2, 1: summary.rating_1,
  };

  return (
    <FadeIn>
      {/* Rating Summary */}
      <Card className="border-border/60 mb-6">
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center justify-center md:pr-8 md:border-r md:border-border/60">
              <p className="text-5xl font-bold font-serif">{total > 0 ? avg : "—"}</p>
              <StarDisplay rating={avg} />
              <p className="text-xs text-muted-foreground mt-1">
                {total} {total === 1 ? "review" : "reviews"}
              </p>
              {dist[5] > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  {dist[5]} {dist[5] === 1 ? "client" : "clients"} gave 5 stars
                </p>
              )}
            </div>
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((star) => (
                <RatingBar
                  key={star}
                  label={String(star)}
                  value={dist[star as keyof typeof dist]}
                  total={total}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List — empty state when no reviews yet */}
      {reviews.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="p-8 flex flex-col items-center text-center gap-2">
            <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium">No reviews yet</p>
            <p className="text-xs text-muted-foreground">
              Once customers complete an appointment they can leave a review here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => {
            const initials = review.author_name
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((w) => w[0]?.toUpperCase() ?? "")
              .join("") || "?";
            return (
              <Card key={review.id} className="border-border/60 hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary">{initials}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{review.author_name}</p>
                        <span className="text-xs text-muted-foreground">{relativeDate(review.created_at)}</span>
                      </div>
                    </div>
                    <StarDisplay rating={review.rating} />
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground mt-3 leading-relaxed whitespace-pre-wrap">
                      {review.comment}
                    </p>
                  )}
                  {review.vendor_reply && (
                    <div className="mt-3 ml-6 pl-3 border-l-2 border-primary/30">
                      <p className="text-[11px] text-primary font-medium">Your reply</p>
                      <p className="text-sm text-foreground/90 mt-0.5 whitespace-pre-wrap">{review.vendor_reply}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </FadeIn>
  );
}
