import { TapeStrip } from "@/components/notebook";
import { Button } from "@/components/ui/button";
import { useFavoriteStores } from "@/hooks/use-favorites";
import { discountValueLabel, formatDate, remainingLabel } from "@/lib/format";
import { formatDistance, mapsUrl } from "@/lib/geo";
import type { DiscountView } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ExternalLink, Heart, MapPin, Store as StoreIcon } from "lucide-react";
import { useNavigate } from "react-router";

/** صورة العرض، وإن لم تُرفع بعد نعرض بطاقة مصنّفة بالرمز التعبيري. */
export function DiscountThumb({
  discount,
  size = "md",
  className,
}: {
  discount: DiscountView;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const box =
    size === "sm" ? "size-14" : size === "lg" ? "size-24" : "size-[68px]";
  const image = discount.images[0];

  if (image) {
    return (
      <img
        src={image}
        alt={discount.title}
        loading="lazy"
        className={cn(
          "shrink-0 rounded-md border border-rule object-cover",
          box,
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "ruled-lines flex shrink-0 items-center justify-center rounded-md border border-dashed border-rule bg-background",
        box,
        className,
      )}
    >
      <span
        className={size === "lg" ? "text-3xl" : "text-xl"}
        title={discount.store.categoryName ?? "بدون تصنيف"}
      >
        {discount.store.categoryEmoji ?? "🏷️"}
      </span>
    </div>
  );
}

/** ختم قيمة الخصم على شكل ورقة ملاحظات مائلة. */
export function ValueStamp({
  type,
  value,
  size = "md",
  className,
}: {
  type: "percent" | "amount";
  value: number;
  size?: "md" | "lg";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky-note flex shrink-0 -rotate-6 flex-col items-center justify-center border border-dashed border-margin-line/50",
        size === "lg" ? "size-20" : "size-14",
        className,
      )}
    >
      <span
        className={cn(
          "font-display font-bold leading-tight text-highlight-foreground",
          size === "lg" ? "text-2xl" : "text-lg",
        )}
      >
        {discountValueLabel(type, value)}
      </span>
      <span className="text-[9px] text-highlight-foreground/70">خصم</span>
    </div>
  );
}

export function Chip({
  children,
  icon: Icon,
  className,
}: {
  children: React.ReactNode;
  icon?: typeof MapPin;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-rule/80 bg-background/80 px-2 py-0.5 text-[10px] text-muted-foreground",
        className,
      )}
    >
      {Icon ? <Icon className="size-3" /> : null}
      {children}
    </span>
  );
}

export function DiscountCard({
  discount,
  onOpen,
  rotate = 0,
}: {
  discount: DiscountView;
  onOpen: (discount: DiscountView) => void;
  rotate?: number;
}) {
  const { isFavorite, toggle } = useFavoriteStores();
  const navigate = useNavigate();
  const favorite = isFavorite(discount.store.id);

  return (
    <article
      className="index-card overflow-hidden"
      style={rotate ? { transform: `rotate(${rotate}deg)` } : undefined}
    >
      <TapeStrip className="-top-2 start-10" />
      <div className="flex gap-3 p-3 pt-4">
        <button
          type="button"
          onClick={() => onOpen(discount)}
          className="shrink-0"
          aria-label={`عرض تفاصيل ${discount.title}`}
        >
          <DiscountThumb discount={discount} />
        </button>

        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onOpen(discount)}
            className="block w-full text-start"
          >
            <h3 className="line-clamp-2 text-sm font-bold leading-6">
              {discount.title}
            </h3>
          </button>

          <button
            type="button"
            onClick={() => navigate(`/app/store/${discount.store.id}`)}
            className="mt-1 flex max-w-full items-center gap-1 text-[11px] text-muted-foreground hover:text-primary"
          >
            <StoreIcon className="size-3 shrink-0" />
            <span className="truncate">{discount.store.name}</span>
          </button>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Chip icon={MapPin} className="border-primary/30 bg-primary/5">
              {formatDistance(discount.distanceKm)}
            </Chip>
            <Chip>{remainingLabel(discount.endDate)}</Chip>
          </div>
        </div>

        <ValueStamp type={discount.type} value={discount.value} />
      </div>

      {discount.description ? (
        <p className="line-clamp-2 border-t border-dashed border-rule/80 px-3 py-2 text-[11px] leading-6 text-muted-foreground">
          {discount.description}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-2 border-t border-rule/80 px-3 py-2">
        <span className="truncate text-[10px] text-muted-foreground">
          {formatDate(discount.startDate)} — {formatDate(discount.endDate)}
        </span>
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label={favorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
            onClick={() => toggle(discount.store.id)}
          >
            <Heart
              className={cn(
                "size-4",
                favorite && "fill-current text-destructive",
              )}
            />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            asChild
            aria-label="فتح موقع المتجر على الخريطة"
          >
            <a
              href={mapsUrl(discount.store.lat, discount.store.lng)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="size-4" />
            </a>
          </Button>
        </div>
      </div>
    </article>
  );
}
