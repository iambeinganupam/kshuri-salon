// ─────────────────────────────────────────────────────────────────────────────
// Services & Products — kshuri-salon-dashboard
// ─────────────────────────────────────────────────────────────────────────────
// Catalog management page for salons. Built on the shared `services-catalog`
// primitives in `@kshuri/ui` so it stays in lock-step with the freelancer
// dashboard. Salons additionally manage a Products tab (physical retail
// goods) which freelancers don't have — that section is kept local since it's
// salon-only.
//
// Data flow (services):
//   useServices()        → list rows
//   usePortfolio()       → service_id-tagged photos for the detail sheet + editor
//   useOwnVendorReviews()→ review feed used by the detail sheet
//   useBusinessProfile() → primary_location_id, used as vendor_id
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Plus, Package, Scissors, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  // Primitives
  Badge, Button, Card, CardContent, Dialog, DialogContent, DialogHeader, DialogTitle,
  Input, Skeleton, Tabs, TabsContent, TabsList, TabsTrigger,
  // Domain — services-catalog
  ServiceStatsCards, ServiceFilters, ServiceCard, ServiceFormDialog, ServicesEmptyState,
  type CatalogService, type ServiceWritePayload, type ServiceGenderFilter,
  SERVICE_CATEGORIES,
  CategorySingleSelect,
  // Domain — profile (detail sheet)
  ServiceDetailSheet,
  type VendorService, type VendorMedia, type VendorReviewItem,
  // Motion
  FadeIn, StaggerContainer, StaggerItem,
} from "@kshuri/ui";
import {
  useServices, useCreateService, useUpdateService, useDeleteService,
  useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct,
  usePortfolio, useBusinessProfile, useOwnVendorReviews,
} from "@kshuri/api-client";
import { cn } from "@/lib/utils";

// ── Normalisers ──────────────────────────────────────────────────────────────

function normalizeService(raw: unknown): CatalogService {
  const s = raw as Record<string, unknown>;
  const rawCategory = s.category;
  const category =
    typeof rawCategory === "string"
      ? rawCategory
      : (rawCategory as { name?: string } | undefined)?.name ?? "Other";
  const inclusions = Array.isArray(s.inclusions)
    ? (s.inclusions as unknown[]).filter((x): x is string => typeof x === "string")
    : [];
  return {
    id: String(s.id ?? ""),
    name: String(s.name ?? ""),
    category,
    subcategory: typeof s.subcategory === "string" ? s.subcategory : undefined,
    price: s.price != null ? Number(s.price) : Number(s.default_price ?? 0),
    duration: Number(s.duration_minutes ?? s.duration ?? 30),
    description: typeof s.description === "string" ? s.description : "",
    gender: ((s.gender_target ?? s.gender ?? "unisex") as CatalogService["gender"]),
    status: s.is_active === false ? "inactive" : "active",
    inclusions,
    trending: !!s.trending,
    featured: !!s.featured,
  };
}

function normalizePortfolioMedia(raw: unknown): VendorMedia[] {
  const list: unknown[] = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { items?: unknown[] } | undefined)?.items)
      ? (raw as { items: unknown[] }).items
      : [];
  return list.map((item) => {
    const m = item as Record<string, unknown>;
    return {
      id: String(m.id ?? ""),
      url: String(m.url ?? m.media_url ?? ""),
      caption: typeof m.caption === "string" ? m.caption : null,
      service_id: typeof m.service_id === "string" ? m.service_id : null,
      service_name: typeof m.service_name === "string" ? m.service_name : null,
      service_category: typeof m.service_category === "string"
        ? m.service_category
        : typeof m.category === "string" ? m.category : null,
    };
  });
}

function toVendorService(svc: CatalogService): VendorService {
  return {
    id: svc.id,
    name: svc.name,
    description: svc.description ?? null,
    price: svc.price,
    duration_minutes: svc.duration ?? null,
    category: svc.category ?? null,
    is_active: svc.status !== "inactive",
    trending: !!svc.trending,
    featured: !!svc.featured,
    inclusions: svc.inclusions,
  };
}

// ── Products ─────────────────────────────────────────────────────────────────
// Salon-only retail catalog. Lightweight enough to keep local rather than
// promote to the shared package.

interface Product {
  id: string;
  name: string;
  price: number;
  stock?: number;
  category?: string;
  description?: string;
}

function ProductCard({
  product, onEdit, onDelete,
}: {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
}) {
  // `stock` is optional. Treat undefined as "unknown" rather than zero so we
  // don't shout "Out of stock" at salons that simply haven't recorded it.
  const stock = typeof product.stock === "number" ? product.stock : null;
  const stockBadge =
    stock === null
      ? { dot: "bg-muted-foreground/40", text: "text-muted-foreground", label: "Stock not tracked" }
      : stock > 10
        ? { dot: "bg-emerald-500", text: "text-emerald-400", label: `${stock} in stock` }
        : stock > 0
          ? { dot: "bg-amber-500", text: "text-amber-400", label: `Only ${stock} left` }
          : { dot: "bg-destructive", text: "text-destructive", label: "Out of stock" };

  return (
    <Card className="group border-border/40 transition-all duration-300 hover:shadow-md">
      <CardContent className="p-4 lg:p-5">
        <div className="mb-1 flex items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold">{product.name}</p>
          <p className="shrink-0 font-serif text-base font-bold text-primary">
            ₹{Number(product.price ?? 0).toLocaleString("en-IN")}
          </p>
        </div>
        {product.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{product.description}</p>
        )}
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/40 pt-3">
          <div className="flex min-w-0 items-center gap-2">
            {product.category && (
              <Badge variant="secondary" className="truncate text-[10px] font-normal">{product.category}</Badge>
            )}
            <div className="flex min-w-0 items-center gap-1.5">
              <div className={cn("h-2 w-2 shrink-0 rounded-full", stockBadge.dot)} />
              <span className={cn("truncate text-xs font-medium", stockBadge.text)}>{stockBadge.label}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              className="rounded p-1 hover:bg-muted"
              onClick={onEdit}
              aria-label={`Edit ${product.name}`}
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
            </button>
            <button
              className="rounded p-1 hover:bg-muted"
              onClick={onDelete}
              aria-label={`Delete ${product.name}`}
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ProductFormValues {
  name: string;
  category: string;
  price: string;
  stock: string;
  description: string;
}

const EMPTY_PRODUCT_FORM: ProductFormValues = {
  name: "", category: "", price: "", stock: "", description: "",
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Services() {
  // Services data
  const servicesResult = useServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  // Products data
  const productsResult = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  // Detail sheet inputs
  const portfolioResult = usePortfolio();
  const businessResult = useBusinessProfile();
  const primaryLocationId =
    (businessResult.data as { primary_location_id?: string } | undefined)?.primary_location_id;
  const reviewsResult = useOwnVendorReviews({
    vendor_type: "salon_location",
    vendor_id: primaryLocationId ?? "",
    limit: 50,
  });

  const rawServices = useMemo(
    () => (Array.isArray(servicesResult.data) ? servicesResult.data : []),
    [servicesResult.data],
  );
  const services: CatalogService[] = useMemo(
    () => rawServices.map(normalizeService),
    [rawServices],
  );
  const products: Product[] = useMemo(
    () => (Array.isArray(productsResult.data) ? productsResult.data : []) as Product[],
    [productsResult.data],
  );
  const portfolioMedia = useMemo(
    () => normalizePortfolioMedia(portfolioResult.data),
    [portfolioResult.data],
  );
  const allReviews: VendorReviewItem[] =
    (reviewsResult.data?.items ?? []) as VendorReviewItem[];

  // ── UI state ────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<"services" | "products">("services");

  // Filters (services tab)
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<ServiceGenderFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Service form
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<CatalogService | null>(null);

  // Detail sheet
  const [selectedService, setSelectedService] = useState<CatalogService | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Product form
  const [productSearch, setProductSearch] = useState("");
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [editProductOpen, setEditProductOpen] = useState(false);
  const [editProductId, setEditProductId] = useState("");
  const [productForm, setProductForm] = useState<ProductFormValues>(EMPTY_PRODUCT_FORM);

  // Bridge: Detail sheet → Edit dialog.
  useEffect(() => {
    const handler = (e: Event) => {
      const svc = (e as CustomEvent<CatalogService>).detail;
      setEditingService(svc);
      setDialogOpen(true);
    };
    window.addEventListener("open-edit-service", handler);
    return () => window.removeEventListener("open-edit-service", handler);
  }, []);

  // Deep-link entry from /portfolio → /services?action=add-service|add-product.
  // Switches to the right tab and auto-opens the matching Add dialog so the
  // vendor lands directly in "create" mode — production apps (Square, Fresha,
  // Stripe) all use this URL-action pattern for cross-page entry points.
  // `from` carries the page that linked us here, so a successful save can
  // bounce the user straight back without dumping them on this catalog list.
  const returnToRef = useRef<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get("action");
    const from = params.get("from");
    if (action === "add-service") {
      setTab("services");
      setEditingService(null);
      setDialogOpen(true);
    } else if (action === "add-product") {
      setTab("products");
      setProductForm(EMPTY_PRODUCT_FORM);
      setEditProductId("");
      setAddProductOpen(true);
    } else {
      return;
    }
    if (from) returnToRef.current = from;
    // Strip the action params so a later refresh doesn't keep re-opening the dialog.
    const url = new URL(window.location.href);
    url.searchParams.delete("action");
    url.searchParams.delete("from");
    window.history.replaceState({}, "", url.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived ─────────────────────────────────────────────────────────────
  const categoriesInUse = useMemo(() => {
    const used = new Set(services.map((s) => s.category));
    const ordered = SERVICE_CATEGORIES.filter((c) => used.has(c));
    used.forEach((c) => {
      if (!ordered.includes(c as typeof SERVICE_CATEGORIES[number])) {
        ordered.push(c as typeof SERVICE_CATEGORIES[number]);
      }
    });
    return ordered as string[];
  }, [services]);

  const filteredServices = useMemo(() => {
    const q = search.toLowerCase().trim();
    return services.filter((s) => {
      const matchSearch = !q
        || s.name.toLowerCase().includes(q)
        || s.category.toLowerCase().includes(q);
      const matchGender = genderFilter === "all"
        || s.gender === genderFilter
        || s.gender === "unisex";
      const matchCategory = categoryFilter === "all" || s.category === categoryFilter;
      return matchSearch && matchGender && matchCategory;
    });
  }, [services, search, genderFilter, categoryFilter]);

  const groupedServices = useMemo(() => {
    return filteredServices.reduce<Record<string, CatalogService[]>>((acc, s) => {
      (acc[s.category] ||= []).push(s);
      return acc;
    }, {});
  }, [filteredServices]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase().trim();
    return q ? products.filter((p) => p.name.toLowerCase().includes(q)) : products;
  }, [products, productSearch]);

  // ── Handlers (services) ────────────────────────────────────────────────
  const openAddService = () => {
    setEditingService(null);
    setDialogOpen(true);
  };

  const navigate = useNavigate();

  /** Pop the saved return URL (if we came here via deep-link) and navigate
   *  back. Only called on successful save so users keep this page when they
   *  cancel a deep-linked dialog. */
  function bounceBackIfDeepLinked() {
    const to = returnToRef.current;
    if (!to) return;
    returnToRef.current = null;
    navigate(to);
  }

  const handleSubmitService = async (
    payload: ServiceWritePayload,
    editingId: string | null,
  ) => {
    try {
      if (editingId) {
        await updateService.mutateAsync({
          serviceId: editingId,
          payload: payload as unknown as Parameters<typeof updateService.mutateAsync>[0]["payload"],
        });
        toast.success("Service updated");
      } else {
        await createService.mutateAsync(
          payload as unknown as Parameters<typeof createService.mutateAsync>[0],
        );
        toast.success("Service submitted for review!");
      }
      setDialogOpen(false);
      setEditingService(null);
      if (!editingId) bounceBackIfDeepLinked();
    } catch {
      toast.error(editingId ? "Failed to update service" : "Failed to create service");
    }
  };

  const handleDeleteService = async (id: string) => {
    const target = services.find((s) => s.id === id);
    if (target && !window.confirm(`Delete "${target.name}"? This cannot be undone.`)) return;
    try {
      await deleteService.mutateAsync(id);
      toast.success("Service deleted");
    } catch {
      toast.error("Failed to delete service");
    }
  };

  // ── Handlers (products) ────────────────────────────────────────────────
  const openAddProduct = () => {
    setProductForm(EMPTY_PRODUCT_FORM);
    setEditProductId("");
    setAddProductOpen(true);
  };

  const openEditProduct = (p: Product) => {
    setEditProductId(p.id);
    setProductForm({
      name: p.name,
      category: p.category ?? "",
      price: String(p.price ?? ""),
      stock: p.stock != null ? String(p.stock) : "",
      description: p.description ?? "",
    });
    setEditProductOpen(true);
  };

  const buildProductPayload = () => ({
    name: productForm.name.trim(),
    category: productForm.category.trim() || undefined,
    price: parseInt(productForm.price, 10),
    stock: productForm.stock ? parseInt(productForm.stock, 10) : 0,
    description: productForm.description.trim() || undefined,
  });

  const handleAddProduct = async () => {
    if (!productForm.name.trim() || !productForm.price) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      await createProduct.mutateAsync(buildProductPayload() as Parameters<typeof createProduct.mutateAsync>[0]);
      toast.success("Product added!");
      setProductForm(EMPTY_PRODUCT_FORM);
      setAddProductOpen(false);
      bounceBackIfDeepLinked();
    } catch {
      toast.error("Failed to add product");
    }
  };

  const handleEditProduct = async () => {
    if (!productForm.name.trim() || !productForm.price) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      await updateProduct.mutateAsync({
        productId: editProductId,
        payload: buildProductPayload() as Parameters<typeof updateProduct.mutateAsync>[0]["payload"],
      });
      toast.success("Product updated");
      setProductForm(EMPTY_PRODUCT_FORM);
      setEditProductOpen(false);
    } catch {
      toast.error("Failed to update product");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteProduct.mutateAsync(id);
      toast.success("Product removed");
    } catch {
      toast.error("Failed to remove product");
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────
  const isLoadingServices = servicesResult.isLoading;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-6 max-w-[1440px] mx-auto space-y-6 pb-12">
      <FadeIn>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold lg:text-2xl tracking-tight font-serif">
              Services & Products
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {services.length} {services.length === 1 ? "service" : "services"} ·{" "}
              {products.length} {products.length === 1 ? "product" : "products"}
            </p>
          </div>
          {/* Primary action follows the active tab. */}
          <div className="flex shrink-0 items-center gap-2">
            {tab === "services" ? (
              <Button size="sm" onClick={openAddService} className="h-9 gap-1.5 rounded-xl">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Service</span>
                <span className="sm:hidden">Service</span>
              </Button>
            ) : (
              <Button size="sm" onClick={openAddProduct} className="h-9 gap-1.5 rounded-xl">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Product</span>
                <span className="sm:hidden">Product</span>
              </Button>
            )}
          </div>
        </div>
      </FadeIn>

      <ServiceStatsCards services={services} />

      <Tabs value={tab} onValueChange={(v) => setTab(v as "services" | "products")}>
        <TabsList className="h-10 rounded-xl bg-muted/50">
          <TabsTrigger value="services" className="gap-1.5 rounded-lg text-xs">
            <Scissors className="h-3.5 w-3.5" /> Services ({services.length})
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-1.5 rounded-lg text-xs">
            <Package className="h-3.5 w-3.5" /> Products ({products.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-6">
          <FadeIn>
            <ServiceFilters
              search={search}
              onSearchChange={setSearch}
              category={categoryFilter}
              onCategoryChange={setCategoryFilter}
              categories={categoriesInUse}
              gender={genderFilter}
              onGenderChange={setGenderFilter}
              searchPlaceholder="Search services..."
            />
          </FadeIn>

          {isLoadingServices ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
              ))}
            </div>
          ) : filteredServices.length === 0 ? (
            <ServicesEmptyState onAdd={openAddService} hasAny={services.length > 0} />
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedServices).map(([category, items]) => (
                <FadeIn key={category}>
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{category}</h3>
                      <div className="h-px flex-1 bg-border/40" />
                      <span className="text-[10px] text-muted-foreground">
                        {items.length} {items.length === 1 ? "service" : "services"}
                      </span>
                    </div>
                    <StaggerContainer className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {items.map((svc) => (
                        <StaggerItem key={svc.id}>
                          <ServiceCard
                            service={svc}
                            onClick={() => { setSelectedService(svc); setDetailOpen(true); }}
                          />
                        </StaggerItem>
                      ))}
                    </StaggerContainer>
                  </div>
                </FadeIn>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="products" className="space-y-5">
          <FadeIn>
            <Card className="rounded-2xl border-border/40 shadow-sm">
              <CardContent className="p-4">
                <Input
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="h-10 rounded-xl"
                />
              </CardContent>
            </Card>
          </FadeIn>

          {productsResult.isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <Card className="rounded-2xl border-dashed border-border/40">
              <CardContent className="flex flex-col items-center justify-center py-14 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-serif text-lg font-bold">
                  {products.length > 0 ? "No products match your search" : "No products yet"}
                </h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  {products.length > 0
                    ? "Try a different keyword."
                    : "Add the retail products you sell at the salon."}
                </p>
                {products.length === 0 && (
                  <Button onClick={openAddProduct} className="mt-4 rounded-xl font-semibold">
                    <Plus className="mr-1.5 h-4 w-4" /> Add your first product
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <StaggerContainer className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((p) => (
                <StaggerItem key={p.id}>
                  <ProductCard
                    product={p}
                    onEdit={() => openEditProduct(p)}
                    onDelete={() => handleDeleteProduct(p.id)}
                  />
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </TabsContent>
      </Tabs>

      {/* Shared service form (add + edit) */}
      <ServiceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingService={editingService}
        photos={editingService
          ? portfolioMedia
              .filter((m) => m.service_id === editingService.id)
              .map((m) => ({
                id: m.id,
                url: m.url,
                caption: m.caption,
                service_id: m.service_id,
              }))
          : []}
        onSubmit={handleSubmitService}
        isSubmitting={createService.isPending || updateService.isPending}
        showReviewBanner
      />

      {/* Detail sheet — Edit / Delete in the footer */}
      <ServiceDetailSheet
        service={selectedService ? toVendorService(selectedService) : null}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        galleryImages={
          selectedService
            ? portfolioMedia
                .filter((m) => m.service_id === selectedService.id)
                .map((m) => ({ url: m.url, label: m.caption ?? null }))
            : []
        }
        serviceReviews={
          selectedService
            ? allReviews.filter((r) => {
                const ids = (r as unknown as { service_ids?: unknown[] }).service_ids;
                const id = (r as unknown as { service_id?: string }).service_id;
                return Array.isArray(ids) ? ids.includes(selectedService.id) : id === selectedService.id;
              })
            : []
        }
        bookingCount={
          selectedService
            ? Number(
                (rawServices.find((s) => (s as { id?: string })?.id === selectedService.id) as
                  | { booking_count?: number | string | null }
                  | undefined)?.booking_count ?? 0,
              )
            : 0
        }
        footer={
          selectedService ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-1.5 rounded-xl hover:bg-muted"
                onClick={() => {
                  setDetailOpen(false);
                  window.dispatchEvent(
                    new CustomEvent("open-edit-service", { detail: selectedService }),
                  );
                }}
              >
                Edit
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-1.5 rounded-xl border-destructive/20 text-destructive hover:bg-destructive/5"
                onClick={() => {
                  handleDeleteService(selectedService.id);
                  setDetailOpen(false);
                }}
              >
                Delete
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Add Product (kept inline — small dialog, salon-only) */}
      <Dialog open={addProductOpen} onOpenChange={setAddProductOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
          </DialogHeader>
          <ProductFormFields form={productForm} onChange={setProductForm} />
          <Button
            className="h-10 w-full rounded-xl"
            onClick={handleAddProduct}
            disabled={createProduct.isPending}
          >
            {createProduct.isPending ? "Adding…" : "Add Product"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Edit Product */}
      <Dialog open={editProductOpen} onOpenChange={setEditProductOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <ProductFormFields form={productForm} onChange={setProductForm} />
          <Button
            className="h-10 w-full rounded-xl"
            onClick={handleEditProduct}
            disabled={updateProduct.isPending}
          >
            {updateProduct.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Local product form fields ────────────────────────────────────────────────

function ProductFormFields({
  form, onChange,
}: {
  form: ProductFormValues;
  onChange: (next: ProductFormValues) => void;
}) {
  return (
    <div className="space-y-3 pt-2">
      <Input
        placeholder="Product Name *"
        className="h-10 rounded-xl"
        value={form.name}
        onChange={(e) => onChange({ ...form, name: e.target.value })}
      />
      {/* Category — single-select picker backed by the same taxonomy as the
          Portfolio Skills picker and the Service form's Category. Products
          and services now share the same hierarchy: adding a category here
          makes it visible in both surfaces. */}
      <CategorySingleSelect
        mode="top"
        value={form.category}
        onChange={(name) => onChange({ ...form, category: name })}
        placeholder="Pick a category"
      />
      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="Price (₹) *"
          type="number"
          className="h-10 rounded-xl"
          value={form.price}
          onChange={(e) => onChange({ ...form, price: e.target.value })}
        />
        <Input
          placeholder="Stock Quantity"
          type="number"
          className="h-10 rounded-xl"
          value={form.stock}
          onChange={(e) => onChange({ ...form, stock: e.target.value })}
        />
      </div>
      <Input
        placeholder="Description"
        className="h-10 rounded-xl"
        value={form.description}
        onChange={(e) => onChange({ ...form, description: e.target.value })}
      />
    </div>
  );
}
