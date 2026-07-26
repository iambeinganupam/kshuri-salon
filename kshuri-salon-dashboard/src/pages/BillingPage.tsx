/* eslint-disable @typescript-eslint/no-explicit-any -- API hook returns from @kshuri/api-client are loosely shaped; narrowing belongs at the hook layer in a follow-up pass. */
import { useState } from "react";
import { FadeIn } from "@kshuri/ui";
import {
  useTransactions,
  useRevenueSummary,
  useServices,
  useProducts,
} from "@kshuri/api-client/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Receipt,
  CreditCard,
  Banknote,
  User,
  ShieldCheck,
  Percent,
  Download,
  History,
  IndianRupee,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Copy,
  Minus,
  Plus,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OutstandingDuesCard } from "./billing/OutstandingDuesCard";

const PLATFORM_FEE_PCT = 10;

export default function BillingPage() {
  const [sliderVal, setSliderVal] = useState([70]);
  const [customerType, setCustomerType] = useState("kshuri-sub");
  const [activeSection, setActiveSection] = useState("generate");
  const [processing, setProcessing] = useState(false);

  const [walkinName, setWalkinName] = useState("");
  const [walkinPhone, setWalkinPhone] = useState("");

  // Selected service IDs and product quantities
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [productQtys, setProductQtys] = useState<Record<string, number>>({});

  const { data: rawTransactions, isLoading: txLoading } = useTransactions();
  const { data: revenueSummary } = useRevenueSummary();
  const { data: services = [], isLoading: servicesLoading } = useServices();
  const { data: products = [], isLoading: productsLoading } = useProducts();

  const transactions: any[] = (rawTransactions as any)?.items ?? (Array.isArray(rawTransactions) ? rawTransactions : []);

  // ── Computed totals ─────────────────────────────────────────────────────────
  const selectedServicesList = (services as any[]).filter((s) => selectedServices.has(s.id));
  const serviceTotal = selectedServicesList.reduce((sum: number, s: any) => sum + Number(s.default_price ?? s.price ?? 0), 0);

  const selectedProductsList = (products as any[]).filter((p) => (productQtys[p.id] ?? 0) > 0);
  const productTotal = selectedProductsList.reduce((sum: number, p: any) => sum + Number(p.price ?? 0) * (productQtys[p.id] ?? 0), 0);

  const subtotal = serviceTotal + productTotal;
  const discountedSubtotal = customerType === "kshuri-sub" ? Math.round(subtotal * sliderVal[0] / 100) : subtotal;
  const platformFee = Math.round(discountedSubtotal * PLATFORM_FEE_PCT / 100);
  const netToSalon = discountedSubtotal - platformFee;

  // ── Summary card figures ────────────────────────────────────────────────────
  const totalCollected = revenueSummary?.total_revenue ?? transactions.filter((t: any) => t.status === "settled").reduce((s: number, t: any) => s + t.gross_amount, 0);
  const pendingAmount = transactions.filter((t: any) => t.status === "pending").reduce((s: number, t: any) => s + t.gross_amount, 0);
  const avgBill = transactions.length > 0 ? Math.round((totalCollected + pendingAmount) / transactions.length) : 0;

  // ── Handlers ────────────────────────────────────────────────────────────────
  const toggleService = (id: string) => {
    setSelectedServices((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const setQty = (id: string, qty: number) => {
    setProductQtys((prev) => ({ ...prev, [id]: Math.max(0, qty) }));
  };

  const handleGenerateBill = (_method: string) => {
    // Bills are now generated against a completed appointment in the Bookings
    // page — that's the only path that produces a row in `public.transactions`
    // with a valid appointment_id. This generic builder is being kept around
    // for service-pricing previews only; clicking it redirects the user to the
    // canonical workflow.
    toast.info(
      "Bills are generated from completed appointments in Bookings. Mark a service complete and click 'Generate Bill · COD' on the row.",
      { duration: 5000 },
    );
  };

  const handleExportCSV = () => {
    const csv = [
      "ID,Amount,Method,Status,Date",
      ...transactions.map((t: any) => `${t.id},${t.gross_amount},${t.payment_method ?? ""},${t.status},${t.created_at}`)
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "transactions.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Transactions exported as CSV!");
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("Transaction ID copied!");
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-6 space-y-5 max-w-[1440px] mx-auto">
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold lg:text-2xl tracking-tight">Billing & Payments</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Generate bills, manage payments and view transaction history</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 h-9 rounded-xl hidden md:flex" onClick={handleExportCSV}>
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        </div>
      </FadeIn>

      {/* Outstanding dues to platform — surfaced first so the vendor sees
          their balance + cap before anything else on this page. */}
      <FadeIn delay={0.04}>
        <OutstandingDuesCard />
      </FadeIn>

      {/* Summary Stats */}
      <FadeIn delay={0.05}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="border-border/40">
            <CardContent className="p-3.5">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <IndianRupee className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Collected</p>
                  <p className="text-lg font-serif font-bold text-emerald-400">₹{Number(totalCollected).toLocaleString("en-IN")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/40">
            <CardContent className="p-3.5">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pending</p>
                  <p className="text-lg font-serif font-bold text-amber-400">₹{pendingAmount.toLocaleString("en-IN")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/40">
            <CardContent className="p-3.5">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Invoices</p>
                  <p className="text-lg font-serif font-bold">{transactions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/40">
            <CardContent className="p-3.5">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Percent className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg. Bill</p>
                  <p className="text-lg font-serif font-bold">{avgBill > 0 ? `₹${avgBill.toLocaleString("en-IN")}` : "₹0"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      {/* Billing is a single-purpose page now: Generate Bill. The transaction
          history lives on its dedicated /transactions page so the same data
          isn't duplicated in two places. */}
      <Tabs value={customerType} onValueChange={setCustomerType}>
            <TabsList className="mb-5 h-10 rounded-xl bg-muted/50">
              <TabsTrigger value="kshuri-sub" className="text-xs gap-1.5 rounded-lg">
                <ShieldCheck className="h-3.5 w-3.5" /> Subscriber
              </TabsTrigger>
              <TabsTrigger value="kshuri" className="text-xs gap-1.5 rounded-lg">
                <User className="h-3.5 w-3.5" /> Estylr Customer
              </TabsTrigger>
              <TabsTrigger value="walkin" className="text-xs gap-1.5 rounded-lg">Walk-in</TabsTrigger>
            </TabsList>

            <div className="grid gap-5 lg:grid-cols-5">
              <FadeIn delay={0.08} className="lg:col-span-3">
                <Card className="border-border/40">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Receipt className="h-3.5 w-3.5 text-primary" />
                      </div>
                      Generate Bill
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {customerType === "walkin" ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-[12px] font-semibold text-foreground mb-1.5 block">Customer Name</label>
                          <Input placeholder="Enter name" className="h-11 rounded-xl" value={walkinName} onChange={e => setWalkinName(e.target.value)} />
                        </div>
                        <div>
                          <label className="text-[12px] font-semibold text-foreground mb-1.5 block">Phone <span className="text-muted-foreground font-normal">(Optional)</span></label>
                          <Input placeholder="+91 XXXXX XXXXX" className="h-11 rounded-xl" value={walkinPhone} onChange={e => setWalkinPhone(e.target.value)} />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/20 border border-border/30">
                        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary/60" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-[13px] text-muted-foreground">Select customer from Bookings</p>
                          <p className="text-xs text-muted-foreground/60">Link bill to an appointment to auto-fill</p>
                        </div>
                        {customerType === "kshuri-sub" && (
                          <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20 rounded-lg">Subscriber</Badge>
                        )}
                      </div>
                    )}

                    {/* Services */}
                    <div>
                      <p className="text-[12px] font-semibold text-foreground mb-2">
                        Services <span className="text-muted-foreground font-normal">(select all that apply)</span>
                      </p>
                      {servicesLoading ? (
                        <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading services…
                        </div>
                      ) : (services as any[]).length === 0 ? (
                        <p className="text-xs text-muted-foreground py-3 px-4 rounded-xl bg-muted/15 border border-border/25">
                          No services in catalog — add services from the Categories page.
                        </p>
                      ) : (
                        <div className="rounded-xl bg-muted/15 border border-border/25 divide-y divide-border/20">
                          {(services as any[]).map((svc: any) => {
                            const price = Number(svc.default_price ?? svc.price ?? 0);
                            const selected = selectedServices.has(svc.id);
                            return (
                              <button
                                key={svc.id}
                                type="button"
                                onClick={() => toggleService(svc.id)}
                                className={cn(
                                  "flex items-center justify-between w-full p-4 text-left transition-colors first:rounded-t-xl last:rounded-b-xl",
                                  selected ? "bg-primary/8" : "hover:bg-muted/20"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                                    selected ? "bg-primary border-primary" : "border-border/60"
                                  )}>
                                    {selected && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                                  </div>
                                  <div>
                                    <span className="text-[13px] font-semibold">{svc.name}</span>
                                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">{svc.duration_minutes} min</p>
                                  </div>
                                </div>
                                <span className="font-serif font-bold text-[15px]">₹{price.toLocaleString("en-IN")}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Products Used */}
                    <div>
                      <p className="text-[12px] font-semibold text-foreground mb-2 flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5 text-muted-foreground" />
                        Products Used <span className="text-muted-foreground font-normal">(optional)</span>
                      </p>
                      {productsLoading ? (
                        <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading products…
                        </div>
                      ) : (products as any[]).length === 0 ? (
                        <p className="text-xs text-muted-foreground py-3 px-4 rounded-xl bg-muted/15 border border-border/25">
                          No products in catalog.
                        </p>
                      ) : (
                        <div className="rounded-xl bg-muted/15 border border-border/25 divide-y divide-border/20">
                          {(products as any[]).map((prod: any) => {
                            const qty = productQtys[prod.id] ?? 0;
                            const lineTotal = Number(prod.price ?? 0) * qty;
                            return (
                              <div key={prod.id} className="flex items-center justify-between p-3.5 gap-3">
                                <div className="flex-1 min-w-0">
                                  <span className="text-[13px] font-semibold">{prod.name}</span>
                                  <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                                    ₹{Number(prod.price ?? 0).toLocaleString("en-IN")} each · {prod.stock} in stock
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {qty > 0 && (
                                    <span className="text-[12px] font-semibold tabular-nums min-w-[3rem] text-right">
                                      ₹{lineTotal.toLocaleString("en-IN")}
                                    </span>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="icon"
                                      variant="outline"
                                      className="h-7 w-7 rounded-lg"
                                      onClick={() => setQty(prod.id, qty - 1)}
                                      disabled={qty === 0}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="text-[13px] font-medium w-6 text-center tabular-nums">{qty}</span>
                                    <Button
                                      size="icon"
                                      variant="outline"
                                      className="h-7 w-7 rounded-lg"
                                      onClick={() => setQty(prod.id, qty + 1)}
                                      disabled={qty >= prod.stock}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {customerType === "kshuri-sub" && subtotal > 0 && (
                      <div className="rounded-xl bg-primary/[0.04] border border-primary/15 p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Percent className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <p className="text-[12px] font-semibold text-foreground">Subscriber Discount</p>
                        </div>
                        <Slider value={sliderVal} onValueChange={setSliderVal} min={50} max={90} step={5} className="my-4" />
                        <div className="flex justify-between text-xs text-muted-foreground/60">
                          <span>50%</span>
                          <span className="font-bold text-foreground text-sm">{sliderVal[0]}% of MRP</span>
                          <span>90%</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </FadeIn>

              <FadeIn delay={0.15} className="lg:col-span-2">
                <div className="space-y-4 lg:sticky lg:top-20">
                  <Card className="border-border/40">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Bill Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2.5">
                        {serviceTotal > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground/70">Services ({selectedServices.size})</span>
                            <span className="font-medium tabular-nums">₹{serviceTotal.toLocaleString("en-IN")}</span>
                          </div>
                        )}
                        {productTotal > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground/70">Products</span>
                            <span className="font-medium tabular-nums">₹{productTotal.toLocaleString("en-IN")}</span>
                          </div>
                        )}
                        {subtotal === 0 && (
                          <p className="text-xs text-muted-foreground/50 py-2 text-center">Select services or products above</p>
                        )}
                        {customerType === "kshuri-sub" && subtotal > 0 && (
                          <div className="flex justify-between text-sm text-emerald-400">
                            <span>Discount ({sliderVal[0]}%)</span>
                            <span className="font-semibold tabular-nums">-₹{(subtotal - discountedSubtotal).toLocaleString("en-IN")}</span>
                          </div>
                        )}
                      </div>

                      {subtotal > 0 && (
                        <>
                          <Separator className="bg-border/30" />
                          <div className="flex justify-between items-center py-1">
                            <span className="font-semibold text-foreground">Total Payable</span>
                            <span className="text-2xl font-serif font-bold text-primary tracking-tight">₹{discountedSubtotal.toLocaleString("en-IN")}</span>
                          </div>
                          <Separator className="bg-border/30" />
                          <div className="space-y-2">
                            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-[0.1em] font-semibold">Breakdown</p>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground/70">Platform Fee ({PLATFORM_FEE_PCT}%)</span>
                              <span className="font-medium tabular-nums">₹{platformFee.toLocaleString("en-IN")}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground/70">Net to Outlet</span>
                              <span className="font-medium tabular-nums text-emerald-400">₹{netToSalon.toLocaleString("en-IN")}</span>
                            </div>
                          </div>
                        </>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button className="flex-1 gap-1.5 h-10 rounded-xl" size="sm" onClick={() => handleGenerateBill("UPI")} disabled={processing || subtotal === 0}>
                          {processing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
                          {processing ? "Processing..." : "Pay Online"}
                        </Button>
                        <Button variant="outline" className="flex-1 gap-1.5 h-10 rounded-xl" size="sm" onClick={() => handleGenerateBill("Cash")} disabled={processing || subtotal === 0}>
                          <Banknote className="h-3.5 w-3.5" /> COD
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </FadeIn>
            </div>
          </Tabs>
    </div>
  );
}
