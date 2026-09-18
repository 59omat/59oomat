import { api } from "@/convex/_generated/api";
import { DiscountThumb, ValueStamp } from "@/components/discount-card";
import { StatusStamp } from "@/components/notebook";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useFavoriteStores } from "@/hooks/use-favorites";
import {
  discountValueLabel,
  formatFullDate,
  remainingLabel,
} from "@/lib/format";
import { formatDistance, mapsUrl } from "@/lib/geo";
import type { DiscountView } from "@/lib/types";
import { useMutation } from "convex/react";
import { useEffect, useRef } from "react";
import {
  ClipboardCopy,
  ExternalLink,
  Eye,
  Heart,
  Phone,
  Store as StoreIcon,
} from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

/** تفاصيل العرض في لوحة سفلية — تجربة تطبيق لا صفحة ويب. */
export function DiscountSheet({
  discount,
  onClose,
}: {
  discount: DiscountView | null;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const trackView = useMutation(api.discounts.trackView);
  const { isFavorite, toggle } = useFavoriteStores();
  const tracked = useRef<string | null>(null);

  useEffect(() => {
    if (!discount) {
      tracked.current = null;
      return;
    }
    if (tracked.current === discount.id) return;
    tracked.current = discount.id;
    void trackView({ id: discount.id }).catch(() => undefined);
  }, [discount, trackView]);

  const favorite = discount ? isFavorite(discount.store.id) : false;

  return (
    <Drawer
      open={Boolean(discount)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DrawerContent className="bg-card">
        {discount ? (
          <>
            <DrawerHeader className="pb-2">
              <DrawerTitle className="font-display text-lg">
                تفاصيل العرض
              </DrawerTitle>
            </DrawerHeader>

            <div className="max-h-[70vh] overflow-y-auto px-4 pb-8">
              <div className="flex items-start gap-3">
                <DiscountThumb discount={discount} size="lg" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold leading-7">
                    {discount.title}
                  </h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <StoreIcon className="size-3.5" />
                    <span className="truncate">{discount.store.name}</span>
                    {discount.store.categoryName ? (
                      <span className="text-muted-foreground/80">
                        · {discount.store.categoryEmoji}{" "}
                        {discount.store.categoryName}
                      </span>
                    ) : null}
                  </p>
                  {discount.distanceKm !== null ? (
                    <p className="mt-2 text-[11px] text-primary">
                      يبعد {formatDistance(discount.distanceKm)} عن موقعك
                    </p>
                  ) : null}
                </div>
                <ValueStamp
                  type={discount.type}
                  value={discount.value}
                  size="lg"
                />
              </div>

              {discount.description ? (
                <p className="mt-4 rounded-lg border border-dashed border-rule bg-background/70 p-3 text-xs leading-7 text-muted-foreground">
                  {discount.description}
                </p>
              ) : null}

              <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-lg border border-rule/80 bg-background/60 p-2">
                  <p className="text-muted-foreground">يبدأ في</p>
                  <p className="font-bold">{formatFullDate(discount.startDate)}</p>
                </div>
                <div className="rounded-lg border border-rule/80 bg-background/60 p-2">
                  <p className="text-muted-foreground">ينتهي في</p>
                  <p className="font-bold">{formatFullDate(discount.endDate)}</p>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between gap-2">
                <StatusStamp status="active" />
                <span className="text-[10px] text-muted-foreground">
                  {remainingLabel(discount.endDate)}
                </span>
              </div>

              {discount.code ? (
                <div className="mt-4 flex items-center justify-between gap-2 rounded-lg border-2 border-dashed border-margin-line/50 bg-highlight/40 p-3">
                  <div>
                    <p className="text-[10px] text-highlight-foreground/80">
                      رمز العرض
                    </p>
                    <p className="font-display text-lg font-bold tracking-widest text-highlight-foreground">
                      {discount.code}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="gap-1.5"
                    onClick={() => {
                      void navigator.clipboard
                        .writeText(discount.code ?? "")
                        .then(() => toast.success("تم نسخ رمز العرض"))
                        .catch(() =>
                          toast.error("تعذّر النسخ، انسخ الرمز يدويًا."),
                        );
                    }}
                  >
                    <ClipboardCopy className="size-3.5" />
                    نسخ
                  </Button>
                </div>
              ) : null}

              {discount.images.length > 1 ? (
                <div className="mt-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {discount.images.slice(1).map((image) => (
                    <img
                      key={image}
                      src={image}
                      alt={discount.title}
                      className="h-20 w-28 shrink-0 rounded-md border border-rule object-cover"
                    />
                  ))}
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  className="flex-1 gap-2"
                  onClick={() =>
                    window.open(
                      mapsUrl(discount.store.lat, discount.store.lng),
                      "_blank",
                      "noopener,noreferrer",
                    )
                  }
                >
                  <ExternalLink className="size-4" />
                  موقع المتجر على الخريطة
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => toggle(discount.store.id)}
                >
                  <Heart
                    className={
                      favorite ? "size-4 fill-current text-destructive" : "size-4"
                    }
                  />
                  {favorite ? "في المفضلة" : "أضف للمفضلة"}
                </Button>
                {discount.store.phone ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    asChild
                  >
                    <a href={`tel:${discount.store.phone}`}>
                      <Phone className="size-4" />
                      اتصال
                    </a>
                  </Button>
                ) : null}
              </div>

              <div className="mt-4 flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Eye className="size-3" />
                  {discount.views ?? 0} مشاهدة
                </span>
                <button
                  type="button"
                  className="underline hover:text-primary"
                  onClick={() => {
                    onClose();
                    navigate(`/app/store/${discount.store.id}`);
                  }}
                >
                  كل عروض {discount.store.name}
                </button>
              </div>

              <p className="mt-3 text-center text-[10px] text-muted-foreground">
                قيمة الخصم: {discountValueLabel(discount.type, discount.value)}{" "}
                · تحقق من العرض داخل المتجر
              </p>
            </div>
          </>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
