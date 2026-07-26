/* eslint-disable @typescript-eslint/no-explicit-any -- API hook returns from @kshuri/api-client are loosely shaped; narrowing belongs at the hook layer in a follow-up pass. */
import { useState, useMemo } from "react";
import { FadeIn, StaggerContainer, StaggerItem } from "@kshuri/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Download, Search, Copy, CheckCircle2, Clock,
  CreditCard, Banknote, Smartphone, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@kshuri/ui";
import { useTransactions } from "@kshuri/api-client/hooks";
import type { Transaction } from "@kshuri/api-client/types";

const methodIcon: Record<string, React.ComponentType<any>> = {
  upi: Smartphone,
  card: CreditCard,
  cash: Banknote,
  net_banking: CreditCard,
};

function statusBadge(s: string) {
  if (s === "settled") return "text-emerald-400 border-emerald-500/25 bg-emerald-500/10";
  if (s === "pending") return "text-amber-400 border-amber-500/25 bg-amber-500/10";
  return "text-destructive border-destructive/25 bg-destructive/10";
}

function statusLabel(s: string) {
  if (s === "settled") return "Paid";
  if (s === "pending") return "Pending";
  if (s === "refunded") return "Refunded";
  return s;
}

/** Compact INR formatter — drops the "k" suffix for values under 1k so we
 *  don't render confusing "₹0.0k" tombstones in stat tiles. */
function formatINRCompact(amount: number): string {
  if (!Number.isFinite(amount) || amount === 0) return "₹0";
  if (amount < 1000) return `₹${Math.round(amount).toLocaleString("en-IN")}`;
  if (amount < 100_000) return `₹${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}k`;
  return `₹${(amount / 100_000).toFixed(1)}L`;
}

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const { data: rawTransactions, isLoading } = useTransactions();
  const transactions: Transaction[] = (rawTransactions as any)?.items ?? (Array.isArray(rawTransactions) ? rawTransactions : []);

  const filtered = useMemo(() => {
    let result = [...transactions];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        t.id.toLowerCase().includes(q) ||
        (t.vendor_name ?? "").toLowerCase().includes(q) ||
        (t.service_names ?? []).some(s => s.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== "all") result = result.filter(t => t.status === statusFilter);
    if (sortBy === "newest") result.sort((a, b) => b.created_at.localeCompare(a.created_at));
    else if (sortBy === "oldest") result.sort((a, b) => a.created_at.localeCompare(b.created_at));
    else if (sortBy === "highest") result.sort((a, b) => b.gross_amount - a.gross_amount);
    else if (sortBy === "lowest") result.sort((a, b) => a.gross_amount - b.gross_amount);
    return result;
  }, [transactions, search, statusFilter, sortBy]);

  const totalSettled = transactions.filter(t => t.status === "settled").reduce((s, t) => s + t.gross_amount, 0);
  const totalPending = transactions.filter(t => t.status === "pending").reduce((s, t) => s + t.gross_amount, 0);
  const totalRefunded = transactions.filter(t => t.status === "refunded").reduce((s, t) => s + t.gross_amount, 0);

  const handleExport = () => {
    const csv = [
      "ID,Amount,Method,Status,Date,Services",
      ...transactions.map(t =>
        `${t.id},${t.gross_amount},${t.payment_method ?? ""},${t.status},${t.created_at},"${(t.service_names ?? []).join("; ")}"`
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "transactions.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Transactions exported!");
  };

  const handleCopy = (id: string) => { navigator.clipboard.writeText(id); toast.success("Copied!"); };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-6 space-y-5 max-w-[1440px] mx-auto">
      <FadeIn>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold lg:text-2xl tracking-tight">Transactions</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Track all payments, settlements, and refunds</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 h-9 rounded-xl text-xs" onClick={handleExport} disabled={transactions.length === 0}>
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>
      </FadeIn>

      {/* Summary */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Settled", value: formatINRCompact(totalSettled), icon: CheckCircle2, iconBg: "bg-emerald-500/15", iconColor: "text-emerald-400" },
          { label: "Pending", value: formatINRCompact(totalPending), icon: Clock, iconBg: "bg-amber-500/15", iconColor: "text-amber-400" },
          { label: "Refunded", value: formatINRCompact(totalRefunded), icon: CreditCard, iconBg: "bg-destructive/15", iconColor: "text-destructive" },
          { label: "Total Txns", value: transactions.length.toString(), icon: FileText, iconBg: "bg-blue-500/15", iconColor: "text-blue-400" },
        ].map((stat) => (
          <StaggerItem key={stat.label}>
            <Card className="border-border/40">
              <CardContent className="p-3.5">
                <div className="flex items-center gap-3">
                  <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", stat.iconBg)}>
                    <stat.icon className={cn("h-4 w-4", stat.iconColor)} />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                    <p className="text-lg font-serif font-bold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Filters */}
      <FadeIn delay={0.1}>
        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
            <Input
              placeholder="Search by ID or service..."
              className="pl-10 h-9 rounded-xl text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-9 rounded-xl text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="settled">Settled</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px] h-9 rounded-xl text-xs"><SelectValue placeholder="Sort" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="highest">Highest Amount</SelectItem>
              <SelectItem value="lowest">Lowest Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FadeIn>

      {/* Transaction List */}
      <FadeIn delay={0.15}>
        <Card className="border-border/40">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
                Loading transactions…
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState icon={FileText} title="No transactions found" description={search || statusFilter !== "all" ? "Try adjusting your filters" : "Transactions will appear here after your first booking"} />
            ) : (
              <>
                <div className="hidden md:grid grid-cols-[2fr_1fr_auto_auto_auto_auto] gap-4 px-5 py-3 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest border-b border-border/30">
                  <span>Transaction</span><span>Services</span><span>Amount</span><span>Method</span><span>Status</span><span>Date</span>
                </div>
                <div className="divide-y divide-border/20">
                  {filtered.map((tx) => {
                    const methodKey = (tx.payment_method ?? "").toLowerCase().replace(" ", "_");
                    const MethodIcon = methodIcon[methodKey] || CreditCard;
                    return (
                      <div key={tx.id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_auto_auto_auto_auto] gap-2 md:gap-4 items-center px-5 py-3.5 hover:bg-secondary/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                            {(tx.vendor_name ?? "TX").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[13px] font-medium">{tx.vendor_name ?? "Booking"}</p>
                            <button
                              onClick={() => handleCopy(tx.id)}
                              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                            >
                              <Copy className="h-2.5 w-2.5" /> {tx.id.slice(0, 8)}…
                            </button>
                          </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {(tx.service_names ?? []).length > 0 ? tx.service_names!.join(", ") : "—"}
                        </p>
                        <span className="font-serif font-semibold text-sm tabular-nums">
                          ₹{tx.gross_amount.toLocaleString("en-IN")}
                        </span>
                        <Badge variant="outline" className="text-[10px] w-fit rounded-md gap-1">
                          <MethodIcon className="h-2.5 w-2.5" /> {tx.payment_method ?? "—"}
                        </Badge>
                        <Badge variant="outline" className={cn("text-[10px] w-fit rounded-md", statusBadge(tx.status))}>
                          {tx.status === "settled" && <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />}
                          {tx.status === "pending" && <Clock className="h-2.5 w-2.5 mr-0.5" />}
                          {statusLabel(tx.status)}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
