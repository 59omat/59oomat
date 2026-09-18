import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  dateInputToTs,
  discountValueHint,
  tsToDateInput,
} from "@/lib/format";
import { uploadImages } from "@/lib/upload";
import { useMutation } from "convex/react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

export type DiscountFormValues = {
  title: string;
  description?: string;
  type: "percent" | "amount";
  value: number;
  code?: string;
  startDate: number;
  endDate: number;
  images: Id<"_storage">[];
};

const DAY = 1000 * 60 * 60 * 24;

type Preview = { id?: Id<"_storage">; url: string };

export function DiscountForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: {
    title: string;
    description: string | null;
    type: "percent" | "amount";
    value: number;
    code: string | null;
    startDate: number;
    endDate: number;
    images: Id<"_storage">[];
    thumbnail?: string | null;
  };
  submitLabel: string;
  onSubmit: (values: DiscountFormValues) => Promise<unknown>;
}) {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [type, setType] = useState<"percent" | "amount">(
    initial?.type ?? "percent",
  );
  const [value, setValue] = useState(String(initial?.value ?? 20));
  const [code, setCode] = useState(initial?.code ?? "");
  const [startDate, setStartDate] = useState(
    tsToDateInput(initial?.startDate ?? Date.now()),
  );
  const [endDate, setEndDate] = useState(
    tsToDateInput(initial?.endDate ?? Date.now() + DAY * 14),
  );
  const [images, setImages] = useState<Id<"_storage">[]>(initial?.images ?? []);
  const [previews, setPreviews] = useState<Preview[]>(
    initial?.thumbnail ? [{ url: initial.thumbnail }] : [],
  );
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleImages(files: FileList | null) {
    if (!files || files.length === 0) return;
    const room = Math.max(0, 6 - images.length);
    const picked = Array.from(files).slice(0, room);
    if (picked.length === 0) {
      toast.error("الحد الأقصى 6 صور للعرض.");
      return;
    }
    setUploading(true);
    try {
      const ids = await uploadImages(picked, generateUploadUrl);
      setImages((prev) => [...prev, ...ids]);
      setPreviews((prev) => [
        ...prev,
        ...picked.map((file) => ({ url: URL.createObjectURL(file) })),
      ]);
      toast.success("تم رفع صور العرض");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذّر رفع الصور");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await onSubmit({
        title,
        description,
        type,
        value: Number(value),
        code,
        startDate: dateInputToTs(startDate),
        endDate: dateInputToTs(endDate),
        images,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذّر حفظ العرض");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="d-title">اسم العرض</Label>
        <Input
          id="d-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="مثال: خصم 30% على المشاوي"
          className="bg-card"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="d-desc">وصف العرض</Label>
        <Textarea
          id="d-desc"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="اكتب تفاصيل العرض وشروطه"
          className="bg-card"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>نوع الخصم</Label>
          <div className="flex rounded-md border border-input bg-card p-1">
            <button
              type="button"
              onClick={() => setType("percent")}
              className={`flex-1 rounded px-2 py-1 text-[11px] ${
                type === "percent"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              نسبة %
            </button>
            <button
              type="button"
              onClick={() => setType("amount")}
              className={`flex-1 rounded px-2 py-1 text-[11px] ${
                type === "amount"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              مبلغ ريال
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="d-value">{discountValueHint(type)}</Label>
          <Input
            id="d-value"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            inputMode="decimal"
            className="bg-card"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="d-start">تاريخ البداية</Label>
          <Input
            id="d-start"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="bg-card text-[11px]"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="d-end">تاريخ النهاية</Label>
          <Input
            id="d-end"
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="bg-card text-[11px]"
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="d-code">رمز العرض (اختياري)</Label>
        <Input
          id="d-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="GRILL30"
          className="bg-card"
        />
      </div>

      <div className="space-y-1.5">
        <Label>صور الخصم (حتى 6 صور)</Label>
        <div className="flex flex-wrap items-center gap-2">
          {previews.map((preview, index) => (
            <div key={`${preview.url}-${index}`} className="relative">
              <img
                src={preview.url}
                alt={`صورة الخصم ${index + 1}`}
                className="size-16 rounded-md border border-rule object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setPreviews((prev) => prev.filter((_, i) => i !== index));
                  setImages((prev) => prev.filter((_, i) => i !== index));
                }}
                className="absolute -end-1.5 -top-1.5 rounded-full border border-rule bg-card p-0.5"
                aria-label="إزالة الصورة"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => void handleImages(event.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-16 w-16 flex-col gap-1 border-dashed text-[10px]"
            disabled={uploading || images.length >= 6}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ImagePlus className="size-4" />
            )}
            إضافة
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          الصور تُرفع إلى مخزن التطبيق وتظهر للمستخدمين داخل بطاقة العرض.
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={busy || uploading}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : null}
        {submitLabel}
      </Button>
    </form>
  );
}
