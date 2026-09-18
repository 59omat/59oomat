import { Chip } from "@/components/discount-card";
import { Button } from "@/components/ui/button";
import { useFavoriteStores } from "@/hooks/use-favorites";
import { formatDistance, mapsUrl } from "@/lib/geo";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { ExternalLink, Heart, MapPin } from "lucide-react";

export type StoreRowData = {
  _id: Id<"stores">;
  name: string;
  description?: string | null;
  address?: string | null;
  lat: number;
  lng: number;
  logo?: string | null;
  categoryEmoji?: string | null;
  categoryName?: string | null;
  activeDiscounts: number;
  bestValue?: number;
};

/** صف متجر بأسلوب قائمة الدفتر: دائرة الشعار ثم بيانات مختصرة. */
export function StoreRow({
  store,
  distanceKm,
  onOpen,
}: {
  store: StoreRowData;
  distanceKm: number | null;
  onOpen: () => void;
}) {
  const { isFavorite, toggle } = useFavoriteStores();
  const favorite = isFavorite(store._id);

  return (
    <article className="index-card flex items-center gap-3 p-3">
      <button type="button" onClick={onOpen} className="shrink-0">
        {store.logo ? (
          <img
            src={store.logo}
            alt={store.name}
            className="size-12 rounded-lg border border-rule object-cover"
          />
        ) : (
          <span className="flex size-12 items-center justify-center rounded-lg border border-dashed border-rule bg-background text-xl">
            {store.categoryEmoji ?? "🏬"}
          </span>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={onOpen}
          className="block w-full text-start"
        >
          <h3 className="truncate text-sm font-bold">{store.name}</h3>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {store.address ?? store.description ?? "بدون وصف"}
          </p>
        </button>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {store.categoryName ? <Chip>{store.categoryName}</Chip> : null}
          <Chip icon={MapPin} className="border-primary/30 bg-primary/5">
            {formatDistance(distanceKm)}
          </Chip>
          <Chip
            className={cn(
              store.activeDiscounts > 0
                ? "border-emerald-600/40 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                : undefined,
            )}
          >
            {store.activeDiscounts > 0
              ? `${store.activeDiscounts} عرض نشط`
              : "لا عروض حالية"}
          </Chip>
        </div>
      </div>

      <div className="flex flex-col gap-0.5">
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label={favorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
          onClick={() => toggle(store._id)}
        >
          <Heart
            className={cn("size-4", favorite && "fill-current text-destructive")}
          />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          asChild
          aria-label="فتح الموقع على الخريطة"
        >
          <a
            href={mapsUrl(store.lat, store.lng)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="size-4" />
          </a>
        </Button>
      </div>
    </article>
  );
}
