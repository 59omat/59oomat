import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { uploadImage } from "@/lib/upload";
import { mapsUrl } from "@/lib/geo";
import { useMutation } from "convex/react";
import { ExternalLink, ImagePlus, Loader2, LocateFixed, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

export type StoreFormValues = {
  name: string;
  categoryId?: Id<"categories">;
  description?: string;
  address?: string;
  phone?: string;
  lat: number;
  lng: number;
  logoId?: Id<"_storage">;
};

export function StoreForm({
  initial,
  coords,
  categories,
  submitLabel,
  onSubmit,
}: {
  initial?: Partial<StoreFormValues> & { logo?: string | null };
  coords: { lat: number; lng: number };
  categories: { _id: Id<"categories">; name: string; emoji: string }[];
  submitLabel: string;
  onSubmit: (values: StoreFormValues) => Promise<unknown>;
}) {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initial?.name ?? "");
  const [categoryId, setCategoryId] = useState<string>(
    initial?.categoryId ?? "none",
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [lat, setLat] = useState(String(initial?.lat ?? coords.lat));
  const [lng, setLng] = useState(String(initial?.lng ?? coords.lng));
  const [logoId, setLogoId] = useState<Id<"_storage"> | undefined>(
    initial?.logoId,
  );
  const [logoPreview, setLogoPreview] = useState<string | null>(
    initial?.logo ?? null,
  );
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleLogo(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const id = await uploadImage(file, generateUploadUrl);
      setLogoId(id);
      setLogoPreview(URL.createObjectURL(file));
      toast.success("تم رفع شعار المتجر");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذّر رفع الشعار");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);
    if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
      toast.error("أدخل إحداثيات صحيحة أو استخدم موقعك الحالي.");
      return;
    }
    setBusy(true);
    try {
      await onSubmit({
        name,
        categoryId:
          categoryId === "none" ? undefined : (categoryId as Id<"categories">),
        description,
        address,
        phone,
        lat: parsedLat,
        lng: parsedLng,
        logoId,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذّر الحفظ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="store-name">اسم المتجر</Label>
        <Input
          id="store-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="مثال: مقهى الدفتر"
          className="bg-card"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label>التصنيف</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="w-full bg-card">
            <SelectValue placeholder="اختر تصنيف المتجر" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">بدون تصنيف</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category._id} value={category._id}>
                {category.emoji} {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="store-desc">وصف مختصر</Label>
        <Textarea
          id="store-desc"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="ما الذي يميّز متجرك؟"
          className="bg-card"
          rows={3}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="store-address">العنوان</Label>
        <Input
          id="store-address"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="الحي، الشارع، المدينة"
          className="bg-card"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="store-phone">رقم التواصل</Label>
        <Input
          id="store-phone"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="05xxxxxxxx"
          inputMode="tel"
          className="bg-card"
        />
      </div>

      <div className="rounded-lg border border-dashed border-rule bg-background/60 p-3">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-[11px]">موقع المتجر (GPS)</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 gap-1 text-[11px]"
            onClick={() => {
              setLat(String(coords.lat));
              setLng(String(coords.lng));
              toast.success("تم استخدام موقعك الحالي");
            }}
          >
            <LocateFixed className="size-3.5" />
            موقعي الحالي
          </Button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Input
            value={lat}
            onChange={(event) => setLat(event.target.value)}
            inputMode="decimal"
            className="bg-card text-[11px]"
            aria-label="خط العرض"
          />
          <Input
            value={lng}
            onChange={(event) => setLng(event.target.value)}
            inputMode="decimal"
            className="bg-card text-[11px]"
            aria-label="خط الطول"
          />
        </div>
        <a
          href={mapsUrl(Number(lat) || coords.lat, Number(lng) || coords.lng)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-[10px] text-muted-foreground underline decoration-dashed hover:text-primary"
        >
          <ExternalLink className="size-3" />
          معاينة الموقع على الخريطة
        </a>
      </div>

      <div className="space-y-1.5">
        <Label>شعار المتجر (اختياري)</Label>
        <div className="flex items-center gap-3">
          {logoPreview ? (
            <div className="relative">
              <img
                src={logoPreview}
                alt="شعار المتجر"
                className="size-16 rounded-lg border border-rule object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setLogoPreview(null);
                  setLogoId(undefined);
                }}
                className="absolute -end-1.5 -top-1.5 rounded-full border border-rule bg-card p-0.5"
                aria-label="إزالة الشعار"
              >
                <X className="size-3" />
              </button>
            </div>
          ) : null}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => void handleLogo(event.target.files?.[0])}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 border-dashed"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ImagePlus className="size-4" />
            )}
            {uploading ? "جارٍ الرفع…" : "رفع صورة"}
          </Button>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : null}
        {submitLabel}
      </Button>
    </form>
  );
}
