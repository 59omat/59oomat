import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { DiscountCard } from "@/components/discount-card";
import { DiscountSheet } from "@/components/discount-sheet";
import {
  EmptyNote,
  PageHeading,
  StatusStamp,
  StickyNote,
} from "@/components/notebook";
import { Button } from "@/components/ui/button";
import { useFavoriteStores } from "@/hooks/use-favorites";
import { useGeoLocation } from "@/hooks/use-geo";
import { distanceKm, formatDistance, mapsUrl } from "@/lib/geo";
import {
  fromStoreDiscount,
  type DiscountView,
  type StoreRef,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import {
  ArrowRight,
  ExternalLink,
  Heart,
  Loader2,
  MapPin,
  Phone,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";

export default function StoreDetail() {
  const navigate = useNavigate();
  const { storeId } = useParams<{ storeId: string }>();
  const id = storeId as Id<"stores"> | undefined;
  const store = useQuery(api.stores.get, id ? { id } : "skip");
  const geo = useGeoLocation();
  const { isFavorite, toggle } = useFavoriteStores();
  const [selected, setSelected] = useState<DiscountView | null>(null);

  const distance = useMemo(
    () =>
      store ? distanceKm(geo.coords, { lat: store.lat, lng: store.lng }) : null,
    [store, geo.coords],
  );

  const offers = useMemo(() => {
    if (!store) return [];
    const ref: StoreRef = {
      id: store._id,
      name: store.name,
      address: store.address,
      phone: store.phone,
      lat: store.lat,
      lng: store.lng,
      categoryName: store.categoryName,
      categoryEmoji: store.categoryEmoji,
      logo: store.logo,
    };
    return store.discounts.map((discount) =>
      fromStoreDiscount(discount, ref, distance),
    );
  }, [store, distance]);

  if (store === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (store === null) {
    return (
      <EmptyNote
        emoji="🧾"
        title="لم نجد هذا المتجر"
        description="ربما تم حذفه أو إيقافه من إدارة التطبيق."
        action={
          <Button size="sm" onClick={() => navigate("/app")}>
            العودة للعروض القريبة
          </Button>
        }
      />
    );
  }

  const favorite = isFavorite(store._id);
  const closed = store.status !== "approved";

  return (
    <div className="pb-6">
      <div className="px-5 pt-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary"
        >
          <ArrowRight className="size-3.5" />
          رجوع
        </button>
      </div>

      <PageHeading
        eyebrow={store.categoryName ?? "متجر"}
        title={store.name}
        action={
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label={favorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
            onClick={() => toggle(store._id)}
            className="border-dashed"
          >
            <Heart
              className={cn(
                "size-4",
                favorite && "fill-current text-destructive",
              )}
            />
          </Button>
        }
        note={
          <span className="flex flex-col gap-1">
            {store.address ? <span>📍 {store.address}</span> : null}
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {distance !== null
                ? `يبعد ${formatDistance(distance)} عن موقعك`
                : "الموقع غير محدد"}
            </span>
          </span>
        }
      />

      {closed ? (
        <div className="px-5 pt-3">
          <StickyNote className="rotate-[-0.6deg]">
            هذا المتجر بانتظار اعتماد إدارة التطبيق، وقد لا تظهر عروضه للجميع
            بعد.
          </StickyNote>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2 px-5">
        <Button
          type="button"
          size="sm"
          className="gap-1.5"
          onClick={() =>
            window.open(
              mapsUrl(store.lat, store.lng),
              "_blank",
              "noopener,noreferrer",
            )
          }
        >
          <ExternalLink className="size-4" />
          الموقع على الخريطة
        </Button>
        {store.phone ? (
          <Button size="sm" variant="outline" className="gap-1.5" asChild>
            <a href={`tel:${store.phone}`}>
              <Phone className="size-4" />
              {store.phone}
            </a>
          </Button>
        ) : null}
        {store.canManage ? (
          <Button
            size="sm"
            variant="secondary"
            className="gap-1.5"
            onClick={() => navigate("/app/merchant")}
          >
            إدارة المتجر
          </Button>
        ) : null}
      </div>

      <div className="mt-4 flex items-baseline justify-between px-5">
        <h2 className="font-display text-base font-bold">
          العروض النشطة ({offers.length})
        </h2>
        {offers.length > 0 ? <StatusStamp status="active" /> : null}
      </div>

      {offers.length > 0 ? (
        <div className="space-y-3 px-5 pt-3">
          {offers.map((discount, index) => (
            <DiscountCard
              key={discount.id}
              discount={discount}
              onOpen={setSelected}
              rotate={index % 2 === 0 ? 0.3 : -0.3}
            />
          ))}
        </div>
      ) : (
        <EmptyNote
          emoji="🗒️"
          title="لا توجد عروض نشطة الآن"
          description="تابع المتجر في المفضلة وسيصلك كل عرض جديد يضيفه."
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => toggle(store._id)}
            >
              {favorite ? "إزالة من المفضلة" : "أضف المتجر للمفضلة"}
            </Button>
          }
        />
      )}

      <DiscountSheet discount={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
