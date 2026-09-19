import { api } from "@/convex/_generated/api";
import {
  PageHeading,
  SectionLabel,
  StatCard,
  StatusStamp,
} from "@/components/notebook";
import { Button } from "@/components/ui/button";
import { useFavoriteStores } from "@/hooks/use-favorites";
import { useAuth } from "@/hooks/use-auth";
import { formatCount } from "@/lib/format";
import { useMutation, useQuery } from "convex/react";
import {
  BadgeCheck,
  Bell,
  Heart,
  LogOut,
  Rocket,
  ShieldCheck,
  Store,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

const PUBLISH_STEPS = [
  {
    title: "١. جهّز بناء التطبيق",
    body: "التطبيق يعمل الآن كتطبيق ويب قابل للتثبيت (PWA) بملف manifest وأيقونة وشاشة كاملة.",
  },
  {
    title: "٢. غلّفه كتطبيق أصلي",
    body: "استخدم Capacitor لتوليد مشروع iOS وأندرويد من نفس الواجهة، ثم أضف صلاحية الموقع في Info.plist و AndroidManifest.",
  },
  {
    title: "٣. أضف صلاحية الموقع",
    body: "iOS: NSLocationWhenInUseUsageDescription. أندرويد: ACCESS_FINE_LOCATION — التطبيق يطلب الموقع في شاشة «قريب مني».",
  },
  {
    title: "٤. ارفع للمتاجر",
    body: "App Store عبر Xcode و App Store Connect، وGoogle Play عبر ملف AAB في Play Console مع سياسة خصوصية للموقع.",
  },
];

export default function Account() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { count: favoritesCount } = useFavoriteStores();
  const store = useQuery(api.stores.myStore);
  const adminExists = useQuery(api.admin.adminExists);
  const claimAdmin = useMutation(api.admin.claimAdmin);

  const role = user?.role;
  const isAdmin = role === "admin";

  return (
    <div className="pb-8">
      <PageHeading
        eyebrow="ملفك داخل التطبيق"
        title="حسابي"
        note="بيانات حسابك وحالة متجرك وروابط سريعة لكل ما تحتاجه."
      />

      <div className="px-5 pt-3">
        <div className="index-card p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-full border border-dashed border-rule bg-background">
              <UserRound className="size-5 text-muted-foreground" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-base font-bold">
                {user?.name ?? (user?.isAnonymous ? "زائر" : "مستخدم التطبيق")}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {user?.email ?? "حساب زائر بدون بريد إلكتروني"}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusStamp
              status={
                isAdmin ? "approved" : role === "merchant" ? "active" : "pending"
              }
            />
            <span className="text-[10px] text-muted-foreground">
              {isAdmin
                ? "مشرف التطبيق: يمكنك المراجعة والاعتماد"
                : role === "merchant"
                  ? "حساب تاجر"
                  : "حساب مستخدم عادي"}
            </span>
          </div>
        </div>
      </div>

      <SectionLabel>ملخص سريع</SectionLabel>
      <div className="grid grid-cols-2 gap-3 px-5">
        <StatCard
          label="المتاجر المفضلة"
          value={favoritesCount}
          emoji="💗"
          hint="تتابع عروضها أولًا"
        />
        <StatCard
          label="حالة متجري"
          value={
            store === undefined
              ? "…"
              : store === null
                ? "غير مسجّل"
                : store.status === "approved"
                  ? "معتمد"
                  : store.status === "pending"
                    ? "بالمراجعة"
                    : "مرفوض"
          }
          emoji="🏬"
          hint={
            store
              ? `${store.stats.active} عرض نشط · ${formatCount(store.stats.views)} مشاهدة`
              : "أنشئ متجرك وأضف عروضك"
          }
        />
      </div>

      <SectionLabel>روابط سريعة</SectionLabel>
      <div className="space-y-2 px-5">
        {[
          {
            label: "المتاجر المفضلة",
            hint: "استعرض ما حفظته من متاجر",
            icon: Heart,
            action: () => navigate("/app/favorites"),
          },
          {
            label: "لوحة التاجر",
            hint: "أضف متجرك وعروضك بالصور",
            icon: Store,
            action: () => navigate("/app/merchant"),
          },
          ...(isAdmin
            ? [
                {
                  label: "لوحة الإدارة",
                  hint: "اعتماد المتاجر ومراجعة الخصومات",
                  icon: ShieldCheck,
                  action: () => navigate("/app/admin"),
                },
              ]
            : []),
          {
            label: "تنبيهات العروض القريبة",
            hint: "قريبًا: إشعارات فورية عند إضافة عرض قريب منك",
            icon: Bell,
            action: () => toast.info("خدمة الإشعارات الفورية قيد التجهيز."),
          },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={item.action}
            className="index-card flex w-full items-center gap-3 p-3 text-start"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <item.icon className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">{item.label}</span>
              <span className="block truncate text-[10px] text-muted-foreground">
                {item.hint}
              </span>
            </span>
            <BadgeCheck className="size-4 text-muted-foreground/60" />
          </button>
        ))}
      </div>

      {!isAdmin && adminExists === false ? (
        <div className="px-5 pt-4">
          <div className="sticky-note rotate-[-0.4deg] p-3">
            <p className="text-[11px] leading-6">
              لا يوجد مشرف للتطبيق بعد. يمكنك تفعيل حسابك كمشرف لمراجعة المتاجر
              والخصومات.
            </p>
            <Button
              size="sm"
              className="mt-3 gap-1.5"
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
          </div>
        </div>
      ) : null}

      <SectionLabel
        action={
          <span className="text-[10px] text-muted-foreground">
            خطوة بخطوة
          </span>
        }
      >
        دليل النشر على App Store و Google Play
      </SectionLabel>
      <div className="space-y-2 px-5">
        {PUBLISH_STEPS.map((step, index) => (
          <div key={step.title} className="index-card p-3">
            <div className="flex items-start gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-dashed border-margin-line/50 bg-highlight/50 text-[11px] font-bold text-highlight-foreground">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold">{step.title}</p>
                <p className="mt-0.5 text-[11px] leading-6 text-muted-foreground">
                  {step.body}
                </p>
              </div>
            </div>
          </div>
        ))}
        <p className="annotation-line ps-3 text-[10px] leading-6 text-muted-foreground">
          <Rocket className="me-1 inline size-3" />
          التطبيق مهيأ كـ PWA بملف manifest وأيقونة، لذا يعمل مباشرة على الجوال
          كتطبيق كامل الشاشة ويمكن تغليفه ونشره على المتاجر.
        </p>
      </div>

      <div className="px-5 pt-6">
        <Button
          variant="outline"
          className="w-full gap-2 border-dashed"
          onClick={() =>
            void signOut().then(() => {
              toast.success("تم تسجيل الخروج");
              navigate("/");
            })
          }
        >
          <LogOut className="size-4" />
          تسجيل الخروج
        </Button>
        <p className="mt-3 text-center text-[10px] text-muted-foreground">
          خصم قريب — الإصدار 1.0 · دفتر العروض حولك
        </p>
      </div>
    </div>
  );
}
