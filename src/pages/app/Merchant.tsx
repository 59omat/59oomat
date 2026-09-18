import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  DiscountForm,
  type DiscountFormValues,
} from "@/components/discount-form";
import { Chip } from "@/components/discount-card";
import {
  EmptyNote,
  PageHeading,
  SectionLabel,
  StatCard,
  StatusStamp,
  StickyNote,
} from "@/components/notebook";
import { StoreForm, type StoreFormValues } from "@/components/store-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useGeoLocation } from "@/hooks/use-geo";
import { discountValueLabel, formatCount, formatDate } from "@/lib/format";
import { mapsUrl } from "@/lib/geo";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import {
  Eye,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  Store as StoreIcon,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const TABS = [
  { key: "active", label: "نشطة" },
  { key: "pending", label: "بالمراجعة" },
  { key: "expired", label: "منتهية" },
  { key: "all", label: "الكل" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function Merchant() {
  const store = useQuery(api.stores.myStore);
  const discounts = useQuery(api.discounts.listMine);
  const categories = useQuery(api.categories.list);
  const geo = useGeoLocation();

  const createStore = useMutation(api.stores.create);
  const updateStore = useMutation(api.stores.update);
  const createDiscount = useMutation(api.discounts.create);
  const updateDiscount = useMutation(api.discounts.update);
  const removeDiscount = useMutation(api.discounts.remove);

  const [tab, setTab] = useState<TabKey>("active");
  const [storeFormOpen, setStoreFormOpen] = useState(false);
  const [discountFormOpen, setDiscountFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<"discounts"> | null>(null);

  type MineRow = NonNullable<typeof discounts>[number];
  const rows = (discounts ?? []) as MineRow[];
  const editing = rows.find((row) => row._id === editingId) ?? null;

  const filtered = useMemo(() => {
    if (tab === "all") return rows;
    if (tab === "expired") return rows.filter((row) => row.isExpired);
    if (tab === "pending")
      return rows.filter((row) => row.status === "pending");
    return rows.filter((row) => row.status === "approved" && !row.isExpired);
  }, [rows, tab]);

  async function handleCreateStore(values: StoreFormValues) {
    await createStore(values);
    toast.success("تم إنشاء المتجر، وهو الآن بانتظار اعتماد الإدارة.");
    setStoreFormOpen(false);
  }

  async function handleUpdateStore(values: StoreFormValues) {
    if (!store) return;
    await updateStore({ id: store._id, ...values });
    toast.success("تم تحديث بيانات المتجر.");
    setStoreFormOpen(false);
  }

  async function handleSubmitDiscount(values: DiscountFormValues) {
    if (!store) return;
    if (editing) {
      await updateDiscount({ id: editing._id, ...values });
      toast.success("تم تحديث العرض وسيُعاد لمراجعة الإدارة.");
    } else {
      await createDiscount({ storeId: store._id, ...values });
      toast.success("تم إرسال العرض، وسيظهر للمستخدمين بعد الاعتماد.");
    }
    setDiscountFormOpen(false);
    setEditingId(null);
  }

  if (store === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (store === null) {
    return (
      <div className="pb-8">
        <PageHeading
          eyebrow="لوحة التاجر"
          title="أضف متجرك"
          note="سجّل بيانات متجرك وموقعه، وبعد اعتماد الإدارة يمكنك نشر الخصومات بالصور."
        />
        <div className="px-5 pt-4">
          <div className="index-card p-4">
            <StoreForm
              coords={geo.coords}
              categories={categories ?? []}
              submitLabel="إنشاء المتجر وإرساله للمراجعة"
              onSubmit={handleCreateStore}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-8">
      <PageHeading
        eyebrow="لوحة التاجر"
        title={store.name}
        action={<StatusStamp status={store.status} />}
        note={
          <span className="flex flex-col gap-1">
            <span>
              {store.categoryEmoji ?? "🏬"} {store.categoryName ?? "بدون تصنيف"}
              {store.address ? ` · ${store.address}` : ""}
            </span>
            <a
              href={mapsUrl(store.lat, store.lng)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-1 underline decoration-dashed hover:text-primary"
            >
              <ExternalLink className="size-3" />
              موقع المتجر على الخريطة
            </a>
          </span>
        }
      />

      {store.status === "pending" ? (
        <div className="px-5 pt-2">
          <StickyNote className="rotate-[-0.5deg]">
            متجرك بانتظار اعتماد الإدارة. يمكنك تجهيز عروضك الآن وسيظهر
            للعملاء بمجرد اعتماد المتجر والعرض.
          </StickyNote>
        </div>
      ) : null}

      <SectionLabel
        action={
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1 border-dashed text-[11px]"
            onClick={() => setStoreFormOpen(true)}
          >
            <Pencil className="size-3" />
            تعديل البيانات
          </Button>
        }
      >
        ملخص المتجر
      </SectionLabel>
      <div className="grid grid-cols-2 gap-3 px-5">
        <StatCard label="عروض نشطة" value={store.stats.active} emoji="✅" />
        <StatCard
          label="بانتظار المراجعة"
          value={store.stats.pending}
          emoji="⏳"
        />
        <StatCard label="عروض منتهية" value={store.stats.expired} emoji="🗂️" />
        <StatCard
          label="مرات المشاهدة"
          value={formatCount(store.stats.views)}
          emoji="👀"
        />
      </div>

      <SectionLabel
        action={
          <Button
            size="sm"
            className="h-7 gap-1 text-[11px]"
            onClick={() => {
              setEditingId(null);
              setDiscountFormOpen(true);
            }}
          >
            <Plus className="size-3.5" />
            عرض جديد
          </Button>
        }
      >
        خصوماتي
      </SectionLabel>

      <div className="flex gap-1 px-5 pb-1">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={cn(
              "flex-1 rounded-md border px-2 py-1.5 text-[11px] transition-colors",
              tab === item.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-rule bg-card text-muted-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyNote
          emoji="🗒️"
          title={
            tab === "pending"
              ? "لا توجد عروض بانتظار المراجعة"
              : tab === "expired"
                ? "لا توجد عروض منتهية"
                : "لا توجد عروض في هذه القائمة"
          }
          description="أضف عرضًا جديدًا بالصورة وحدد تاريخ البداية والنهاية."
          action={
            <Button
              size="sm"
              onClick={() => {
                setEditingId(null);
                setDiscountFormOpen(true);
              }}
            >
              <Plus className="size-3.5" />
              إضافة خصم جديد
            </Button>
          }
        />
      ) : (
        <div className="space-y-3 px-5 pt-3">
          {filtered.map((row) => (
            <article key={row._id} className="index-card p-3">
              <div className="flex gap-3">
                {row.thumbnail ? (
                  <img
                    src={row.thumbnail}
                    alt={row.title}
                    className="size-14 shrink-0 rounded-md border border-rule object-cover"
                  />
                ) : (
                  <span className="flex size-14 shrink-0 items-center justify-center rounded-md border border-dashed border-rule bg-background text-xl">
                    {store.categoryEmoji ?? "🏷️"}
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 text-sm font-bold leading-6">
                      {row.title}
                    </h3>
                    <span className="shrink-0 font-display text-sm font-bold text-primary">
                      {discountValueLabel(row.type, row.value)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <StatusStamp
                      status={
                        row.status === "pending"
                          ? "pending"
                          : row.status === "rejected"
                            ? "rejected"
                            : row.isExpired
                              ? "expired"
                              : "active"
                      }
                    />
                    <Chip>
                      {formatDate(row.startDate)} — {formatDate(row.endDate)}
                    </Chip>
                    <Chip icon={Eye}>{row.views}</Chip>
                  </div>
                  {row.reviewNote ? (
                    <p className="mt-1.5 text-[10px] text-destructive">
                      ملاحظة الإدارة: {row.reviewNote}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-end gap-2 border-t border-dashed border-rule/80 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 border-dashed text-[11px]"
                  onClick={() => {
                    setEditingId(row._id);
                    setDiscountFormOpen(true);
                  }}
                >
                  <Pencil className="size-3" />
                  تعديل
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 gap-1 text-[11px] text-destructive"
                    >
                      <Trash2 className="size-3" />
                      حذف
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>حذف العرض؟</AlertDialogTitle>
                      <AlertDialogDescription>
                        سيُحذف «{row.title}» مع صوره نهائيًا، ولا يمكن التراجع عن
                        هذه الخطوة.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          void removeDiscount({ id: row._id })
                            .then(() => toast.success("تم حذف العرض"))
                            .catch(() =>
                              toast.error("تعذّر حذف العرض، حاول مرة أخرى."),
                            )
                        }
                      >
                        حذف نهائي
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="px-5 pt-6">
        <div className="annotation-line ps-3 text-[11px] leading-6 text-muted-foreground">
          <StoreIcon className="me-1 inline size-3.5" />
          كل تعديل على عرض معتمد يعيده لقائمة مراجعة الإدارة قبل ظهوره من جديد.
        </div>
      </div>

      {/* نافذة بيانات المتجر */}
      <Drawer open={storeFormOpen} onOpenChange={setStoreFormOpen}>
        <DrawerContent className="bg-card">
          <DrawerHeader>
            <DrawerTitle className="font-display text-lg">
              بيانات المتجر
            </DrawerTitle>
          </DrawerHeader>
          <div className="max-h-[72vh] overflow-y-auto px-4 pb-8">
            <StoreForm
              coords={geo.coords}
              categories={categories ?? []}
              initial={{
                name: store.name,
                categoryId: store.categoryId,
                description: store.description ?? "",
                address: store.address ?? "",
                phone: store.phone ?? "",
                lat: store.lat,
                lng: store.lng,
                logo: store.logo,
              }}
              submitLabel="حفظ التعديلات"
              onSubmit={handleUpdateStore}
            />
          </div>
        </DrawerContent>
      </Drawer>

      {/* نافذة إضافة/تعديل عرض */}
      <Drawer
        open={discountFormOpen}
        onOpenChange={(open) => {
          setDiscountFormOpen(open);
          if (!open) setEditingId(null);
        }}
      >
        <DrawerContent className="bg-card">
          <DrawerHeader>
            <DrawerTitle className="font-display text-lg">
              {editing ? "تعديل الخصم" : "خصم جديد"}
            </DrawerTitle>
          </DrawerHeader>
          <div className="max-h-[72vh] overflow-y-auto px-4 pb-8">
            <DiscountForm
              initial={
                editing
                  ? {
                      title: editing.title,
                      description: editing.description,
                      type: editing.type,
                      value: editing.value,
                      code: editing.code,
                      startDate: editing.startDate,
                      endDate: editing.endDate,
                      images: editing.images,
                      thumbnail: editing.thumbnail,
                    }
                  : undefined
              }
              submitLabel={editing ? "حفظ التعديلات" : "إرسال العرض للمراجعة"}
              onSubmit={handleSubmitDiscount}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
