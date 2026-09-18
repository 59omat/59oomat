import { EmptyNote, PageHeading, StickyNote } from "@/components/notebook";
import { StoreRow } from "@/components/store-row";
import { Button } from "@/components/ui/button";
import { useFavoriteStores } from "@/hooks/use-favorites";
import { useGeoLocation } from "@/hooks/use-geo";
import { distanceKm } from "@/lib/geo";
import { Loader2, Heart } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router";

export default function Favorites() {
  const navigate = useNavigate();
  const { favorites } = useFavoriteStores();
  const geo = useGeoLocation();

  const rows = useMemo(() => {
    if (!favorites) return [];
    return favorites
      .map((store) => ({
        ...store,
        distance: distanceKm(geo.coords, { lat: store.lat, lng: store.lng }),
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [favorites, geo.coords]);

  return (
    <div className="pb-6">
      <PageHeading
        eyebrow="دفتر متاجرك المفضلة"
        title="المفضلة"
        note={
          <span className="inline-flex items-center gap-1.5">
            <Heart className="size-3.5 text-destructive" />
            كل متجر تحفظه هنا يظهر مع عدد عروضه النشطة والمسافة عنك.
          </span>
        }
      />

      {favorites === undefined ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyNote
          emoji="🤍"
          title="لا يوجد متاجر في المفضلة"
          description="اضغط أيقونة القلب على أي متجر ليظهر هنا وتتابع عروضه بسهولة."
          action={
            <Button size="sm" onClick={() => navigate("/app")}>
              تصفح العروض القريبة
            </Button>
          }
        />
      ) : (
        <>
          <div className="px-5 pt-3">
            <StickyNote className="rotate-[-0.5deg]">
              لديك <span className="font-display font-bold">{rows.length}</span>{" "}
              متجر محفوظ. تُرتب القائمة حسب الأقرب إلى موقعك.
            </StickyNote>
          </div>
          <div className="space-y-3 px-5 pt-4">
            {rows.map((store) => (
              <StoreRow
                key={store._id}
                store={{
                  _id: store._id,
                  name: store.name,
                  description: store.description,
                  address: store.address,
                  lat: store.lat,
                  lng: store.lng,
                  logo: store.logo,
                  categoryEmoji: store.categoryEmoji,
                  categoryName: store.categoryName,
                  activeDiscounts: store.activeDiscounts,
                }}
                distanceKm={store.distance}
                onOpen={() => navigate(`/app/store/${store._id}`)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
