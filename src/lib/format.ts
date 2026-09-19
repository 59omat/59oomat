/** تنسيق التواريخ والأرقام بالعربية. */

const DAY = 1000 * 60 * 60 * 24;

const shortDate = new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", {
  day: "numeric",
  month: "short",
});

const longDate = new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatDate(ts: number): string {
  return shortDate.format(new Date(ts));
}

export function formatFullDate(ts: number): string {
  return longDate.format(new Date(ts));
}

export function daysLeft(endTs: number, now = Date.now()): number {
  return Math.max(0, Math.ceil((endTs - now) / DAY));
}

/** «يتبقى ٣ أيام» بصيغة عربية سليمة. */
export function remainingLabel(endTs: number, now = Date.now()): string {
  const days = daysLeft(endTs, now);
  if (days <= 0) return "ينتهي اليوم";
  if (days === 1) return "يتبقى يوم واحد";
  if (days === 2) return "يتبقى يومان";
  if (days <= 10) return `يتبقى ${days} أيام`;
  return `يتبقى ${days} يومًا`;
}

/** نص قيمة الخصم: «30%» أو «99 ر.س». */
export function discountValueLabel(type: "percent" | "amount", value: number) {
  return type === "percent" ? `${value}%` : `${value} ر.س`;
}

export function discountValueHint(type: "percent" | "amount") {
  return type === "percent" ? "نسبة الخصم %" : "قيمة الخصم (ريال)";
}

/** أرقام عربية مختصرة للإحصائيات. */
export function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}م`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}ألف`;
  return `${n}`;
}

export function relativeTime(ts: number, now = Date.now()): string {
  const diff = now - ts;
  if (diff < 1000 * 60 * 60) return "قبل قليل";
  if (diff < DAY)
    return `قبل ${Math.max(1, Math.round(diff / (1000 * 60 * 60)))} ساعة`;
  const days = Math.round(diff / DAY);
  if (days === 1) return "قبل يوم";
  if (days <= 10) return `قبل ${days} أيام`;
  return `قبل ${days} يومًا`;
}

/** يُحوّل قيمة input[type=date] إلى طابع زمني. */
export function dateInputToTs(value: string): number {
  const parsed = new Date(`${value}T12:00:00`).getTime();
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

export function tsToDateInput(ts: number): string {
  const d = new Date(ts);
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}
