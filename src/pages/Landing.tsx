import { api } from "@/convex/_generated/api";
import { Chip } from "@/components/discount-card";
import {
  SpiralBinding,
  StatusStamp,
  StickyNote,
  TapeStrip,
} from "@/components/notebook";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { discountValueLabel, remainingLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import logo from "@/assets/logo.svg";
import {
  ArrowLeft,
  Bell,
  Camera,
  Check,
  Clock,
  Heart,
  MapPin,
  Percent,
  Rocket,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Store,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router";

const FEATURES = [
  {
    icon: MapPin,
    title: "خصومات قريبة منك",
    body: "يحدد التطبيق موقعك عبر GPS ويرتب العروض من الأقرب إلى الأبعد مع المسافة الحقيقية لكل متجر.",
  },
  {
    icon: Camera,
    title: "صور حقيقية للعروض",
    body: "التاجر يرفع صور الخصم، ونعرضها داخل بطاقة واضحة مع نسبة الخصم وتاريخ البداية والنهاية.",
  },
  {
    icon: Heart,
    title: "مفضلة المتاجر",
    body: "احفظ المتاجر التي تحبها وتابع عروضها النشطة أولًا، مع إمكانية فتح موقعها على الخريطة.",
  },
  {
    icon: Percent,
    title: "تصنيفات عربية",
    body: "مطاعم، مقاهي، ملابس، إلكترونيات، بقالة وغيرها — ابحث ونقّح النتائج بضغطة واحدة.",
  },
  {
    icon: Bell,
    title: "تنبيهات العروض",
    body: "تنبيهات فورية عند إضافة عرض جديد قريب منك أو قبل انتهاء عرض محفوظ في المفضلة.",
  },
  {
    icon: ShieldCheck,
    title: "عروض مُراجعة",
    body: "كل متجر وكل خصم يمر على مراجعة الإدارة قبل ظهوره، لتقليل العروض الوهمية أو المكررة.",
  },
];

const STEPS = [
  {
    title: "افتح التطبيق واسمح بالموقع",
    body: "يطلب التطبيق صلاحية الموقع مرة واحدة، ثم يرتب العروض تلقائيًا بحسب المسافة منك.",
  },
  {
    title: "اختر العرض المناسب",
    body: "اضغط أي عرض لتقرأ التفاصيل ورمز الخصم، وافتح موقع المتجر مباشرة على الخريطة.",
  },
  {
    title: "أضف المتجر للمفضلة",
    body: "تابع المتاجر التي تحبها لتصلك عروضها الجديدة أولًا بأول داخل تبويب المفضلة.",
  },
];

const ROLES = [
  {
    icon: Users,
    title: "المستخدم",
    points: [
      "خصومات مرتبة حسب المسافة عبر GPS",
      "بحث وتصفية حسب التصنيف",
      "تفاصيل كاملة: الصورة، النسبة، التواريخ",
      "فتح موقع المتجر على الخريطة",
      "مفضلة للمتاجر القريبة",
    ],
  },
  {
    icon: Store,
    title: "التاجر",
    points: [
      "إنشاء حساب تاجر وإضافة متجره وموقعه",
      "إضافة خصم بالصور والتواريخ ورمز العرض",
      "تعديل أو حذف الخصومات في أي وقت",
      "متابعة الخصومات النشطة والمنتهية",
      "إحصائيات مشاهدات لكل عرض",
    ],
  },
  {
    icon: ShieldCheck,
    title: "الإدارة",
    points: [
      "اعتماد المتاجر ورفض غير المطابق",
      "مراجعة الخصومات قبل ظهورها للمستخدمين",
      "حذف الخصومات المخالفة وإنذار التاجر",
      "إدارة التصنيفات وإظهارها أو إخفائها",
      "إحصائيات المتاجر والخصومات والمشاهدات",
    ],
  },
];

function PhoneMock() {
  return (
    <div className="relative mx-auto w-[270px] sm:w-[300px]">
      <div className="absolute -top-3 end-6 z-20 -rotate-6">
        <StickyNote className="px-2 py-1 text-[10px]">
          أقرب عرض: ٣٥٠ م 🚶
        </StickyNote>
      </div>
      <div className="relative rounded-[32px] border-2 border-ink/20 bg-card p-2 shadow-[10px_12px_0_0_color-mix(in_oklab,var(--paper-shadow)_35%,transparent)]">
        <div className="overflow-hidden rounded-[26px] border border-rule bg-card">
          <div className="border-b border-rule/70 bg-card/95">
            <SpiralBinding className="justify-between px-3 pb-1 pt-2" count={7} />
            <div className="flex items-center gap-2 px-3 pb-2">
              <img src={logo} alt="" className="size-6" />
              <span className="font-display text-xs font-bold">خصم قريب</span>
              <span className="ms-auto rounded-full border border-dashed border-margin-line/50 bg-highlight/60 px-1.5 text-[9px] font-bold text-highlight-foreground">
                الرياض
              </span>
            </div>
          </div>

          <div className="notebook-page space-y-3 p-3">
            <div className="flex gap-1.5 overflow-hidden">
              {["الكل", "🍽️ مطاعم", "☕ مقاهي"].map((label, index) => (
                <span
                  key={label}
                  className={cn(
                    "shrink-0 rounded-full border px-2 py-0.5 text-[9px]",
                    index === 0
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-rule bg-card text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              ))}
            </div>

            {[
              { title: "خصم 30% على المشاوي", store: "مطعم قلم رصاص", value: "30%", dist: "٣٥٠ م" },
              { title: "القهوة الثانية مجانًا", store: "مقهى الدفتر", value: "50%", dist: "٩٠٠ م" },
            ].map((offer, index) => (
              <div
                key={offer.title}
                className="index-card relative p-2.5"
                style={{ transform: `rotate(${index % 2 === 0 ? -0.6 : 0.6}deg)` }}
              >
                <TapeStrip className="-top-2 start-8 h-3 w-10" />
                <div className="flex items-start gap-2">
                  <span className="ruled-lines flex size-10 shrink-0 items-center justify-center rounded-md border border-dashed border-rule bg-background text-base">
                    {index === 0 ? "🍽️" : "☕"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold leading-5">{offer.title}</p>
                    <p className="truncate text-[9px] text-muted-foreground">
                      {offer.store}
                    </p>
                    <div className="mt-1 flex items-center gap-1">
                      <Chip icon={MapPin} className="px-1.5 py-0 text-[8px]">
                        {offer.dist}
                      </Chip>
                      <Chip className="px-1.5 py-0 text-[8px]">
                        يتبقى ٣ أيام
                      </Chip>
                    </div>
                  </div>
                  <span className="sticky-note flex size-10 shrink-0 -rotate-6 items-center justify-center border border-dashed border-margin-line/50 font-display text-[11px] font-bold text-highlight-foreground">
                    {offer.value}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-around border-t border-rule/70 bg-card/95 py-2">
            {[
              { icon: MapPin, label: "قريب مني", active: true },
              { icon: Heart, label: "المفضلة" },
              { icon: Store, label: "متجري" },
              { icon: Users, label: "حسابي" },
            ].map((tab) => (
              <span
                key={tab.label}
                className={cn(
                  "flex flex-col items-center gap-0.5 text-[8px]",
                  tab.active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <tab.icon className="size-3.5" />
                {tab.label}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute -bottom-4 start-2 z-20 rotate-3">
        <StickyNote className="px-2 py-1 text-[10px]">
          % خصم موثّق ✅
        </StickyNote>
      </div>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const categories = useQuery(api.categories.list);
  const stores = useQuery(api.stores.listApproved);
  const offers = useQuery(api.discounts.listNearby);

  const liveOffers = (offers ?? []).slice(0, 3);
  const appHref = isAuthenticated ? "/app" : "/auth";
  const primaryLabel = isAuthenticated
    ? "افتح التطبيق"
    : user === null
      ? "ابدأ الآن مجانًا"
      : "ابدأ الآن مجانًا";

  const stats = [
    { value: `${(offers ?? []).length}`, label: "عرض نشط الآن" },
    { value: `${(stores ?? []).length}`, label: "متجر مشترك" },
    { value: `${(categories ?? []).filter((c) => c.isActive).length}`, label: "تصنيف" },
    { value: "GPS", label: "ترتيب حسب المسافة" },
  ];

  return (
    <div className="notebook-grain min-h-dvh bg-background text-foreground">
      {/* شريط علوي */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-3 px-4">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <img src={logo} alt="خصم قريب" className="size-8" />
            <span className="font-display text-base font-bold">خصم قريب</span>
          </button>
          <nav className="hidden items-center gap-5 text-[11px] text-muted-foreground md:flex">
            <a href="#features" className="hover:text-primary">
              المزايا
            </a>
            <a href="#roles" className="hover:text-primary">
              الأدوار
            </a>
            <a href="#how" className="hover:text-primary">
              كيف يعمل
            </a>
            <a href="#publish" className="hover:text-primary">
              النشر على المتاجر
            </a>
          </nav>
          <div className="flex items-center gap-2">
            {!isAuthenticated ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-[11px]"
                onClick={() => navigate("/auth")}
              >
                تسجيل الدخول
              </Button>
            ) : null}
            <Button
              size="sm"
              className="gap-1.5 text-[11px]"
              onClick={() => navigate(appHref)}
            >
              {primaryLabel}
              <ArrowLeft className="size-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* البطل */}
      <section className="mx-auto w-full max-w-5xl px-4 pt-12 pb-8 md:pt-16">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-margin-line/50 bg-highlight/60 px-3 py-1 text-[10px] font-bold text-highlight-foreground">
              <Smartphone className="size-3.5" />
              تطبيق جوال · يعمل على iOS و Android
            </span>

            <h1 className="mt-4 font-display text-3xl leading-[1.35] font-bold md:text-5xl md:leading-[1.3]">
              خصومات متاجر{" "}
              <span className="highlight-mark">حولك مباشرة</span> — في دفتر
              واحد
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
              تطبيق «خصم قريب» يقرأ موقعك عبر GPS ويعرض لك أقرب عروض المتاجر
              مرتبة بالمسافة مع الصور ونسبة الخصم وتاريخ الانتهاء. ولأصحاب
              المتاجر: لوحة كاملة لإضافة الخصومات بالصور ومتابعة مشاهداتها —
              وكل ذلك بعد مراجعة الإدارة.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                className="gap-2"
                onClick={() => navigate(appHref)}
              >
                {primaryLabel}
                <ArrowLeft className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 border-dashed"
                onClick={() => navigate("/auth?returnTo=/app/merchant")}
              >
                <Store className="size-4" />
                أنا صاحب متجر
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-muted-foreground">
              {[
                { icon: MapPin, text: "ترتيب حسب المسافة" },
                { icon: Camera, text: "صور للعروض" },
                { icon: Heart, text: "مفضلة المتاجر" },
                { icon: ShieldCheck, text: "عروض مُراجعة" },
              ].map((item) => (
                <span key={item.text} className="inline-flex items-center gap-1.5">
                  <item.icon className="size-3.5 text-primary" />
                  {item.text}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <PhoneMock />
          </motion.div>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="index-card p-3 text-center">
              <p className="font-display text-xl font-bold">{stat.value}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* عروض مباشرة */}
      {liveOffers.length > 0 ? (
        <section className="mx-auto w-full max-w-5xl px-4 py-10">
          <div className="flex items-end justify-between gap-3">
            <h2 className="doodle-underline inline-block font-display text-2xl font-bold">
              عروض مضافة الآن
            </h2>
            <span className="text-[11px] text-muted-foreground">
              تُحدَّث لحظيًا من قاعدة بيانات التطبيق
            </span>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {liveOffers.map((offer, index) => (
              <motion.article
                key={offer._id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="index-card p-3"
              >
                <div className="flex items-start gap-3">
                  <span className="ruled-lines flex size-12 shrink-0 items-center justify-center rounded-md border border-dashed border-rule bg-background text-xl">
                    {offer.store.categoryEmoji ?? "🏷️"}
                  </span>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-xs font-bold leading-5">
                      {offer.title}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {offer.store.name}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <Chip className="border-primary/30 bg-primary/5">
                        {discountValueLabel(offer.type, offer.value)}
                      </Chip>
                      <Chip icon={Clock}>{remainingLabel(offer.endDate)}</Chip>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </section>
      ) : null}

      {/* المزايا */}
      <section id="features" className="mx-auto w-full max-w-5xl px-4 py-10">
        <h2 className="doodle-underline inline-block font-display text-2xl font-bold">
          ماذا يقدّم التطبيق؟
        </h2>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.04 }}
              className="index-card p-4"
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <feature.icon className="size-4" />
              </span>
              <h3 className="mt-3 font-display text-base font-bold">
                {feature.title}
              </h3>
              <p className="mt-1.5 text-[11px] leading-6 text-muted-foreground">
                {feature.body}
              </p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* الأدوار */}
      <section
        id="roles"
        className="mx-auto w-full max-w-5xl px-4 py-10"
      >
        <h2 className="doodle-underline inline-block font-display text-2xl font-bold">
          ثلاثة أدوار في تطبيق واحد
        </h2>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {ROLES.map((role, index) => (
            <motion.article
              key={role.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="index-card overflow-hidden"
            >
              <SpiralBinding className="pb-1 pt-3" count={8} />
              <div className="notebook-page p-4">
                <div className="flex items-center gap-2">
                  <span className="flex size-9 items-center justify-center rounded-lg border border-dashed border-rule bg-card text-primary">
                    <role.icon className="size-4" />
                  </span>
                  <h3 className="font-display text-base font-bold">
                    {role.title}
                  </h3>
                </div>
                <ul className="mt-3 space-y-2">
                  {role.points.map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-2 text-[11px] leading-6 text-muted-foreground"
                    >
                      <Check className="mt-1 size-3.5 shrink-0 text-primary" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* كيف يعمل */}
      <section id="how" className="mx-auto w-full max-w-5xl px-4 py-10">
        <h2 className="doodle-underline inline-block font-display text-2xl font-bold">
          كيف يعمل للمستخدم؟
        </h2>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <div key={step.title} className="index-card p-4">
              <span className="flex size-8 items-center justify-center rounded-full border border-dashed border-margin-line/50 bg-highlight/60 font-display text-sm font-bold text-highlight-foreground">
                {index + 1}
              </span>
              <h3 className="mt-3 text-sm font-bold">{step.title}</h3>
              <p className="mt-1.5 text-[11px] leading-6 text-muted-foreground">
                {step.body}
              </p>
            </div>
          ))}
        </div>

        {(categories ?? []).length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {(categories ?? [])
              .filter((c) => c.isActive)
              .map((category) => (
                <span
                  key={category._id}
                  className="rounded-full border border-rule bg-card px-3 py-1 text-[11px] text-muted-foreground"
                >
                  {category.emoji} {category.name}
                </span>
              ))}
          </div>
        ) : null}
      </section>

      {/* النشر على المتاجر */}
      <section id="publish" className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="index-card overflow-hidden">
          <SpiralBinding className="pb-1 pt-3" />
          <div className="notebook-page p-6">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-margin-line/50 bg-highlight/60 px-3 py-1 text-[10px] font-bold text-highlight-foreground">
              <Rocket className="size-3.5" />
              جاهز للنشر على App Store و Google Play
            </span>
            <h2 className="mt-4 font-display text-2xl font-bold">
              تطبيق واحد… ومتجران
            </h2>
            <p className="mt-2 max-w-2xl text-[11px] leading-7 text-muted-foreground">
              التطبيق مبني كتطبيق ويب متقدم (PWA) بواجهة جوال كاملة الشاشة، مع
              ملف manifest وأيقونة خاصة وصلاحية الموقع. يمكنك تغليفه بـ Capacitor
              ونشره على App Store و Google Play بنفس الواجهة والبيانات، دون
              إعادة بناء المنتج.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {[
                {
                  title: "App Store",
                  body: "صلاحية الموقع: NSLocationWhenInUseUsageDescription · أيقونة 1024 · لقطات شاشة للجوال.",
                },
                {
                  title: "Google Play",
                  body: "صلاحية ACCESS_FINE_LOCATION · ملف AAB · سياسة خصوصية توضح استخدام الموقع.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-lg border border-dashed border-rule bg-card/70 p-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold">{item.title}</p>
                    <StatusStamp status="approved" />
                  </div>
                  <p className="mt-1.5 text-[11px] leading-6 text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                className="gap-2"
                onClick={() => navigate(appHref)}
              >
                <Sparkles className="size-4" />
                جرّب التطبيق الآن
              </Button>
              <Button
                variant="outline"
                className="gap-2 border-dashed"
                onClick={() => navigate("/auth?returnTo=/app/merchant")}
              >
                <Store className="size-4" />
                أضف متجرك وعروضك
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* دعوة أخيرة */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-14">
        <div className="sticky-note rotate-[-0.4deg] p-6 text-center">
          <div className="flex justify-center gap-1">
            {[0, 1, 2, 3, 4].map((star) => (
              <Star
                key={star}
                className="size-4 fill-current text-highlight-foreground/70"
              />
            ))}
          </div>
          <h2 className="mt-3 font-display text-2xl font-bold">
            وفّر أكثر في كل مرة تخرج فيها
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-[11px] leading-7 text-muted-foreground">
            حمّل «خصم قريب» وتابع أفضل عروض المتاجر حولك، أو أضف متجرك واجعل
            عملاء جدد يزورونك يوميًا.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              className="gap-2"
              onClick={() => navigate(appHref)}
            >
              {primaryLabel}
              <ArrowLeft className="size-4" />
            </Button>
            {!isAuthenticated ? (
              <Button
                size="lg"
                variant="outline"
                className="gap-2 border-dashed bg-card"
                onClick={() => navigate("/auth")}
              >
                إنشاء حساب بالبريد
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <footer className="border-t border-border/70 py-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-3 px-4 text-[11px] text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <img src={logo} alt="" className="size-6" />
            <span>خصم قريب — دفتر العروض حولك</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="hover:text-primary"
              onClick={() => navigate("/auth?returnTo=/app/merchant")}
            >
              للتجار
            </button>
            <button
              type="button"
              className="hover:text-primary"
              onClick={() => navigate("/auth?returnTo=/app/admin")}
            >
              للإدارة
            </button>
            <button
              type="button"
              className="hover:text-primary"
              onClick={() => navigate(appHref)}
            >
              التطبيق
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
