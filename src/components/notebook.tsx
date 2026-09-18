import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** ربط لولبي أعلى الصفحة — تفصيلة دفتر ورقي. */
export function SpiralBinding({
  count = 10,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn("flex items-center justify-between px-4", className)}
    >
      {Array.from({ length: count }).map((_, index) => (
        <span key={index} className="hole" />
      ))}
    </div>
  );
}

/** شريط لاصق يثبّت البطاقة على الصفحة. */
export function TapeStrip({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute h-4 w-14 -rotate-3 rounded-[2px] bg-highlight/75 shadow-[0_1px_2px_rgba(0,0,0,0.12)] ring-1 ring-highlight-foreground/10",
        className,
      )}
    />
  );
}

export function StickyNote({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("sticky-note p-3 text-xs leading-6", className)}>
      {children}
    </div>
  );
}

/** عنوان صفحة بأسلوب دفتر: سطر توضيحي صغير + عنوان بخط اليد + ملاحظة جانبية. */
export function PageHeading({
  eyebrow,
  title,
  note,
  action,
}: {
  eyebrow?: string;
  title: string;
  note?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="px-5 pt-4 pb-1">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[11px] font-semibold tracking-wide text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="doodle-underline mt-1 inline-block font-display text-2xl font-bold leading-9">
            {title}
          </h1>
        </div>
        {action}
      </div>
      {note ? (
        <div className="annotation-line mt-3 ps-3 text-[11px] leading-6 text-muted-foreground">
          {note}
        </div>
      ) : null}
    </header>
  );
}

export function SectionLabel({
  children,
  action,
  className,
}: {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 px-5 pt-5 pb-2",
        className,
      )}
    >
      <h2 className="font-display text-base font-bold">{children}</h2>
      {action}
    </div>
  );
}

/** ختم الحالة على طريقة الأختام الورقية. */
export function StatusStamp({
  status,
  className,
}: {
  status: "pending" | "approved" | "active" | "rejected" | "expired";
  className?: string;
}) {
  const map = {
    pending: { label: "بانتظار المراجعة", tone: "pending" },
    approved: { label: "معتمد", tone: "ok" },
    active: { label: "نشط الآن", tone: "ok" },
    rejected: { label: "مرفوض", tone: "bad" },
    expired: { label: "منتهي", tone: "muted" },
  } as const;
  const item = map[status];

  return (
    <span
      className={cn(
        "inline-flex -rotate-2 items-center rounded-md border border-dashed px-2 py-0.5 text-[10px] font-bold tracking-wide",
        item.tone === "pending" &&
          "border-margin-line/60 bg-highlight/70 text-highlight-foreground",
        item.tone === "ok" &&
          "border-emerald-600/45 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
        item.tone === "bad" &&
          "border-destructive/50 bg-destructive/10 text-destructive",
        item.tone === "muted" &&
          "border-border bg-muted text-muted-foreground",
        className,
      )}
    >
      {item.label}
    </span>
  );
}

/** ملاحظة فارغة بأسلوب ورقة ملاحظات. */
export function EmptyNote({
  emoji = "📝",
  title,
  description,
  action,
}: {
  emoji?: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="px-5 py-6">
      <div className="sticky-note rotate-[-0.6deg] p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl leading-7">{emoji}</span>
          <div className="min-w-0">
            <p className="font-display text-base font-bold">{title}</p>
            {description ? (
              <p className="mt-1 text-[11px] leading-6 text-muted-foreground">
                {description}
              </p>
            ) : null}
            {action ? <div className="mt-3">{action}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/** رقم إحصائي داخل بطاقة صغيرة. */
export function StatCard({
  label,
  value,
  hint,
  emoji,
}: {
  label: string;
  value: string | number;
  hint?: string;
  emoji?: string;
}) {
  return (
    <div className="index-card p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{label}</span>
        {emoji ? <span className="text-sm">{emoji}</span> : null}
      </div>
      <p className="mt-1 font-display text-xl font-bold leading-7">{value}</p>
      {hint ? (
        <p className="text-[10px] leading-5 text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/** شريط تقدم ورقي بسيط للإحصائيات. */
export function PaperBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary/80"
        style={{ width: `${Math.max(pct, value > 0 ? 6 : 0)}%` }}
      />
    </div>
  );
}
