import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  EmptyNote,
  PageHeading,
  PaperBar,
  SectionLabel,
  StatCard,
  StatusStamp,
} from "@/components/notebook";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import {
  discountValueLabel,
  formatCount,
  formatFullDate,
  relativeTime,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import {
  BadgeCheck,
  Ban,
  Check,
  Database,
  ExternalLink,
  Loader2,
  Plus,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

type Role = "admin" | "user" | "member" | "merchant";

type RejectTarget = {
  kind: "store" | "discount";
  id: string;
  title: string;
};

export default function Admin() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const adminExists = useQuery(api.admin.adminExists);
  const claimAdmin = useMutation(api.admin.claimAdmin);
  const seed = useMutation(api.seed.run);

  const stats = useQuery(api.admin.stats, isAdmin ? {} : "skip");
  const pendingStores = useQuery(
    api.admin.pendingStores,
    isAdmin ? {} : "skip",
  );
  const pendingDiscounts = useQuery(
    api.admin.pendingDiscounts,
    isAdmin ? {} : "skip",
  );
  const allStores = useQuery(api.admin.allStores, isAdmin ? {} : "skip");
  const allDiscounts = useQuery(api.admin.allDiscounts, isAdmin ? {} : "skip");
  const users = useQuery(api.admin.listUsers, isAdmin ? {} : "skip");
  const categories = useQuery(api.categories.list);

  const setStoreStatus = useMutation(api.admin.setStoreStatus);
  const setDiscountStatus = useMutation(api.admin.setDiscountStatus);
  const setUserRole = useMutation(api.admin.setUserRole);
  const createCategory = useMutation(api.categories.create);
  const updateCategory = useMutation(api.categories.update);
  const removeCategory = useMutation(api.categories.remove);
  const removeDiscount = useMutation(api.discounts.remove);

  const [reject, setReject] = useState<RejectTarget | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [newCategory, setNewCategory] = useState({ emoji: "🏷️", name: "" });

  if (!isAdmin) {
    return (
      <div className="pb-8">
        <PageHeading
          eyebrow="مركز الإدارة"
          title="لوحة الإدارة"
          note="هذه اللوحة مخصّصة لمشرف التطبيق لاعتماد المتاجر ومراجعة الخصومات وإدارة التصنيفات."
        />
        <EmptyNote
          emoji="🛡️"
          title="تحتاج صلاحية مشرف"
          description={
            adminExists === false
              ? "لا يوجد مشرف للتطبيق بعد، ويمكنك تفعيل حسابك كمشرف أول."
              : "يوجد مشرف للتطبيق بالفعل. تواصل معه لمنحك الصلاحية."
          }
          action={
            adminExists === false ? (
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() =>
                  void claimAdmin({})
                    .then(() => toast.success("تم تفعيلك كمشرف للتطبيق"))
                    .catch((error: unknown) =>
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : "تعذّر تفعيل الصلاحية",
                      ),
                    )
                }
              >
                <ShieldCheck className="size-4" />
                تفعيل صلاحية المشرف
              </Button>
            ) : (
              <div className="annotation-line ps-3 text-[11px] leading-6 text-muted-foreground">
                يمكن للمشرف اعتماد المتاجر، مراجعة الخصومات قبل ظهورها، حذف
                المخالفات، وإدارة التصنيفات.
              </div>
            )
          }
        />
      </div>
    );
  }

  const isLoading = stats === undefined;

  const approveStore = (id: string) =>
    void setStoreStatus({ id: id as Id<"stores">, status: "approved" })
      .then(() => toast.success("تم اعتماد المتجر"))
      .catch(() => toast.error("تعذّر اعتماد المتجر"));

  const approveDiscount = (id: string) =>
    void setDiscountStatus({ id: id as Id<"discounts">, status: "approved" })
      .then(() => toast.success("تم اعتماد الخصم وسيظهر للمستخدمين"))
      .catch(() => toast.error("تعذّر اعتماد الخصم"));

  const submitReject = () => {
    if (!reject) return;
    const id = reject.id;
    const promise =
      reject.kind === "store"
        ? setStoreStatus({
            id: id as Id<"stores">,
            status: "rejected",
            note: rejectNote,
          })
        : setDiscountStatus({
            id: id as Id<"discounts">,
            status: "rejected",
            note: rejectNote,
          });
    void promise
      .then(() => {
        toast.success("تم رفض العنصر وإبلاغ التاجر بالملاحظة");
        setReject(null);
        setRejectNote("");
      })
      .catch(() => toast.error("تعذّر تنفيذ الرفض"));
  };

  return (
    <div className="pb-8">
      <PageHeading
        eyebrow="مركز الإدارة"
        title="لوحة الإدارة"
        note="راجع المتاجر والخصومات قبل ظهورها للمستخدمين، وتابع إحصائيات التطبيق."
        action={
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1 border-dashed text-[11px]"
            onClick={() =>
              void seed({})
                .then(() => toast.success("تم تحميل البيانات التجريبية"))
                .catch(() => toast.error("البيانات موجودة مسبقًا"))
            }
          >
            <Database className="size-3" />
            بيانات تجريبية
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 px-5 pt-3">
            <StatCard
              label="إجمالي المتاجر"
              value={stats.stores.total}
              emoji="🏬"
              hint={`${stats.stores.approved} معتمد · ${stats.stores.pending} بالمراجعة`}
            />
            <StatCard
              label="إجمالي الخصومات"
              value={stats.discounts.total}
              emoji="🏷️"
              hint={`${stats.discounts.running} يعمل الآن`}
            />
            <StatCard
              label="مرات المشاهدة"
              value={formatCount(stats.totalViews)}
              emoji="👀"
              hint="مجموع مشاهدات العروض"
            />
            <StatCard
              label="المستخدمون"
              value={stats.users}
              emoji="👥"
              hint={`${stats.merchants} تاجر · ${stats.favorites} مفضلة`}
            />
          </div>

          <SectionLabel>أكثر التصنيفات تفاعلًا</SectionLabel>
          <div className="space-y-2 px-5">
            {stats.topCategories.map((category) => (
              <div key={category._id} className="index-card p-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold">
                    {category.emoji} {category.name}
                  </span>
                  <span className="text-muted-foreground">
                    {category.stores} متجر · {category.discounts} خصم
                  </span>
                </div>
                <div className="mt-2">
                  <PaperBar
                    value={category.discounts}
                    max={stats.topCategories[0]?.discounts ?? 1}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="px-5 pt-4">
            <Tabs defaultValue="review">
              <TabsList className="w-full">
                <TabsTrigger value="review">
                  المراجعة
                  {(pendingStores?.length ?? 0) +
                    (pendingDiscounts?.length ?? 0) >
                  0 ? (
                    <span className="ms-1 rounded-full bg-destructive/90 px-1.5 text-[9px] text-white">
                      {(pendingStores?.length ?? 0) +
                        (pendingDiscounts?.length ?? 0)}
                    </span>
                  ) : null}
                </TabsTrigger>
                <TabsTrigger value="stores">المتاجر</TabsTrigger>
                <TabsTrigger value="discounts">الخصومات</TabsTrigger>
                <TabsTrigger value="categories">التصنيفات</TabsTrigger>
                <TabsTrigger value="users">المستخدمون</TabsTrigger>
              </TabsList>

              {/* المراجعة */}
              <TabsContent value="review" className="space-y-3 pt-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-bold">
                    متاجر بانتظار الاعتماد
                  </h3>
                  <span className="text-[10px] text-muted-foreground">
                    {pendingStores?.length ?? 0}
                  </span>
                </div>

                {(pendingStores ?? []).length === 0 ? (
                  <p className="annotation-line ps-3 text-[11px] leading-6 text-muted-foreground">
                    لا توجد متاجر بانتظار الاعتماد حاليًا.
                  </p>
                ) : (
                  (pendingStores ?? []).map((store) => (
                    <article key={store._id} className="index-card p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="truncate text-sm font-bold">
                            {store.name}
                          </h4>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            {store.categoryEmoji ?? "🏬"}{" "}
                            {store.categoryName ?? "بدون تصنيف"} ·{" "}
                            {store.ownerName}
                          </p>
                          <p className="mt-1 text-[11px] leading-6 text-muted-foreground">
                            {store.description ?? "بدون وصف"} —{" "}
                            {store.address ?? "بدون عنوان"}
                          </p>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {store.discountsCount} خصم مضاف ·{" "}
                            {relativeTime(store.createdAt)}
                          </p>
                        </div>
                        <StatusStamp status="pending" />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 border-t border-dashed border-rule/80 pt-2">
                        <Button
                          size="sm"
                          className="h-7 gap-1 text-[11px]"
                          onClick={() => approveStore(store._id)}
                        >
                          <Check className="size-3" />
                          اعتماد
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 gap-1 text-[11px] text-destructive"
                          onClick={() =>
                            setReject({
                              kind: "store",
                              id: store._id,
                              title: store.name,
                            })
                          }
                        >
                          <Ban className="size-3" />
                          رفض
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 border-dashed text-[11px]"
                          asChild
                        >
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${store.lat},${store.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="size-3" />
                            الموقع
                          </a>
                        </Button>
                      </div>
                    </article>
                  ))
                )}

                <div className="flex items-center justify-between pt-2">
                  <h3 className="font-display text-sm font-bold">
                    خصومات بانتظار المراجعة
                  </h3>
                  <span className="text-[10px] text-muted-foreground">
                    {pendingDiscounts?.length ?? 0}
                  </span>
                </div>

                {(pendingDiscounts ?? []).length === 0 ? (
                  <p className="annotation-line ps-3 text-[11px] leading-6 text-muted-foreground">
                    لا توجد خصومات بانتظار المراجعة.
                  </p>
                ) : (
                  (pendingDiscounts ?? []).map((discount) => (
                    <article key={discount._id} className="index-card p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold">{discount.title}</h4>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            {discount.storeName} · {discount.ownerName}
                          </p>
                          <p className="mt-1 text-[11px] leading-6 text-muted-foreground">
                            {discount.description ?? "بدون وصف"}
                          </p>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {discountValueLabel(discount.type, discount.value)} ·{" "}
                            {formatFullDate(discount.startDate)} —{" "}
                            {formatFullDate(discount.endDate)}
                          </p>
                          {discount.imageUrls.length === 0 ? (
                            <p className="mt-1 text-[10px] text-margin-line">
                              لا توجد صور مرفقة بهذا العرض.
                            </p>
                          ) : (
                            <div className="mt-2 flex gap-2">
                              {discount.imageUrls.slice(0, 3).map((url) => (
                                <img
                                  key={url}
                                  src={url}
                                  alt={discount.title}
                                  className="size-14 rounded-md border border-rule object-cover"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        <StatusStamp status="pending" />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 border-t border-dashed border-rule/80 pt-2">
                        <Button
                          size="sm"
                          className="h-7 gap-1 text-[11px]"
                          onClick={() => approveDiscount(discount._id)}
                        >
                          <Check className="size-3" />
                          اعتماد ونشر
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 gap-1 text-[11px] text-destructive"
                          onClick={() =>
                            setReject({
                              kind: "discount",
                              id: discount._id,
                              title: discount.title,
                            })
                          }
                        >
                          <Ban className="size-3" />
                          رفض
                        </Button>
                      </div>
                    </article>
                  ))
                )}
              </TabsContent>

              {/* المتاجر */}
              <TabsContent value="stores" className="space-y-3 pt-3">
                {(allStores ?? []).length === 0 ? (
                  <EmptyNote
                    emoji="🏬"
                    title="لا توجد متاجر مسجلة"
                    description="يمكنك تحميل بيانات تجريبية لتجربة التطبيق فورًا."
                  />
                ) : (
                  (allStores ?? []).map((store) => (
                    <article key={store._id} className="index-card p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="truncate text-sm font-bold">
                            {store.name}
                          </h4>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            {store.categoryEmoji ?? "🏬"}{" "}
                            {store.categoryName ?? "بدون تصنيف"} ·{" "}
                            {store.ownerName}
                          </p>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {store.discountsCount} خصم ·{" "}
                            {store.activeDiscounts} نشط
                          </p>
                        </div>
                        <StatusStamp status={store.status} />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 border-t border-dashed border-rule/80 pt-2">
                        {store.status !== "approved" ? (
                          <Button
                            size="sm"
                            className="h-7 gap-1 text-[11px]"
                            onClick={() => approveStore(store._id)}
                          >
                            <Check className="size-3" />
                            اعتماد
                          </Button>
                        ) : null}
                        {store.status !== "rejected" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 gap-1 text-[11px] text-destructive"
                            onClick={() =>
                              setReject({
                                kind: "store",
                                id: store._id,
                                title: store.name,
                              })
                            }
                          >
                            <Ban className="size-3" />
                            إيقاف
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 border-dashed text-[11px]"
                          asChild
                        >
                          <Link to={`/app/store/${store._id}`}>
                            <ExternalLink className="size-3" />
                            عرض الصفحة
                          </Link>
                        </Button>
                      </div>
                    </article>
                  ))
                )}
              </TabsContent>

              {/* الخصومات */}
              <TabsContent value="discounts" className="space-y-2 pt-3">
                {(allDiscounts ?? []).map((discount) => (
                  <div
                    key={discount._id}
                    className="index-card flex items-center gap-3 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">
                        {discount.title}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                        {discount.storeName} ·{" "}
                        {discountValueLabel(discount.type, discount.value)} ·{" "}
                        {discount.views} مشاهدة
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <StatusStamp
                          status={
                            discount.status === "pending"
                              ? "pending"
                              : discount.status === "rejected"
                                ? "rejected"
                                : discount.isExpired
                                  ? "expired"
                                  : "active"
                          }
                        />
                        <span className="text-[10px] text-muted-foreground">
                          {formatFullDate(discount.endDate)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      {discount.status !== "approved" ? (
                        <Button
                          size="icon-sm"
                          variant="outline"
                          className="border-dashed"
                          aria-label="اعتماد"
                          onClick={() => approveDiscount(discount._id)}
                        >
                          <Check className="size-3.5" />
                        </Button>
                      ) : (
                        <Button
                          size="icon-sm"
                          variant="outline"
                          className="border-dashed"
                          aria-label="إيقاف"
                          onClick={() =>
                            void setDiscountStatus({
                              id: discount._id,
                              status: "rejected",
                              note: "أوقفته الإدارة لمخالفته الشروط.",
                            })
                              .then(() => toast.success("تم إيقاف الخصم"))
                              .catch(() => toast.error("تعذّر الإيقاف"))
                          }
                        >
                          <Ban className="size-3.5" />
                        </Button>
                      )}
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="text-destructive"
                        aria-label="حذف"
                        onClick={() =>
                          void removeDiscount({ id: discount._id })
                            .then(() => toast.success("تم حذف الخصم"))
                            .catch(() => toast.error("تعذّر الحذف"))
                        }
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </TabsContent>

              {/* التصنيفات */}
              <TabsContent value="categories" className="space-y-3 pt-3">
                <div className="index-card p-3">
                  <Label className="text-[11px]">إضافة تصنيف جديد</Label>
                  <div className="mt-2 flex gap-2">
                    <Input
                      value={newCategory.emoji}
                      onChange={(event) =>
                        setNewCategory((prev) => ({
                          ...prev,
                          emoji: event.target.value,
                        }))
                      }
                      className="w-16 bg-card text-center"
                      aria-label="رمز التصنيف"
                    />
                    <Input
                      value={newCategory.name}
                      onChange={(event) =>
                        setNewCategory((prev) => ({
                          ...prev,
                          name: event.target.value,
                        }))
                      }
                      placeholder="اسم التصنيف مثل: مخابز"
                      className="flex-1 bg-card"
                    />
                    <Button
                      size="icon"
                      aria-label="إضافة التصنيف"
                      onClick={() =>
                        void createCategory(newCategory)
                          .then(() => {
                            toast.success("تم إضافة التصنيف");
                            setNewCategory({ emoji: "🏷️", name: "" });
                          })
                          .catch((error: unknown) =>
                            toast.error(
                              error instanceof Error
                                ? error.message
                                : "تعذّر إضافة التصنيف",
                            ),
                          )
                      }
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                </div>

                {(categories ?? []).map((category) => (
                  <div
                    key={category._id}
                    className="index-card flex items-center gap-3 p-3"
                  >
                    <span className="text-xl">{category.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">
                        {category.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {category.isActive ? "ظاهر للمستخدمين" : "مخفي"}
                      </p>
                    </div>
                    <Switch
                      checked={category.isActive}
                      onCheckedChange={(checked) =>
                        void updateCategory({
                          id: category._id,
                          isActive: checked,
                        }).catch(() => toast.error("تعذّر تحديث التصنيف"))
                      }
                      aria-label="إظهار التصنيف"
                    />
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="text-destructive"
                      aria-label="حذف التصنيف"
                      onClick={() =>
                        void removeCategory({ id: category._id })
                          .then(() => toast.success("تم حذف التصنيف"))
                          .catch((error: unknown) =>
                            toast.error(
                              error instanceof Error
                                ? error.message
                                : "تعذّر حذف التصنيف",
                            ),
                          )
                      }
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </TabsContent>

              {/* المستخدمون */}
              <TabsContent value="users" className="space-y-2 pt-3">
                {(users ?? []).map((item) => (
                  <div key={item._id} className="index-card p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{item.name}</p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          {item.email ?? "حساب زائر"}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {item.stores} متجر · {item.favorites} مفضلة
                        </p>
                      </div>
                      <span className="flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground">
                        {item.role === "admin" ? (
                          <ShieldCheck className="size-3.5 text-primary" />
                        ) : item.role === "merchant" ? (
                          <BadgeCheck className="size-3.5 text-primary" />
                        ) : (
                          <Users className="size-3.5" />
                        )}
                      </span>
                    </div>
                    <div className="mt-2">
                      <Select
                        value={item.role}
                        onValueChange={(value) =>
                          void setUserRole({
                            userId: item._id,
                            role: value as Role,
                          })
                            .then(() => toast.success("تم تحديث صلاحية المستخدم"))
                            .catch((error: unknown) =>
                              toast.error(
                                error instanceof Error
                                  ? error.message
                                  : "تعذّر تحديث الصلاحية",
                              ),
                            )
                        }
                      >
                        <SelectTrigger
                          className={cn("h-8 w-full bg-card text-[11px]")}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">مستخدم</SelectItem>
                          <SelectItem value="member">عضو</SelectItem>
                          <SelectItem value="merchant">تاجر</SelectItem>
                          <SelectItem value="admin">مشرف</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}

      {/* نافذة سبب الرفض */}
      <Drawer
        open={Boolean(reject)}
        onOpenChange={(open) => {
          if (!open) {
            setReject(null);
            setRejectNote("");
          }
        }}
      >
        <DrawerContent className="bg-card">
          <DrawerHeader>
            <DrawerTitle className="font-display text-lg">
              سبب الرفض أو الإيقاف
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8">
            <p className="mb-2 text-[11px] text-muted-foreground">
              العنصر: {reject?.title}
            </p>
            <Textarea
              value={rejectNote}
              onChange={(event) => setRejectNote(event.target.value)}
              placeholder="مثال: الصورة غير واضحة أو بيانات العرض غير مكتملة."
              className="bg-card"
              rows={3}
            />
            <div className="mt-4 flex gap-2">
              <Button
                className="flex-1 gap-1.5"
                variant="destructive"
                onClick={submitReject}
              >
                <Ban className="size-4" />
                تأكيد الرفض
              </Button>
              <Button
                variant="outline"
                className="border-dashed"
                onClick={() => {
                  setReject(null);
                  setRejectNote("");
                }}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
