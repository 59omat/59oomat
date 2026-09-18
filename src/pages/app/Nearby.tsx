import { api } from "@/convex/_generated/api";
import { DiscountCard } from "@/components/discount-card";
import { DiscountSheet } from "@/components/discount-sheet";
import {
  EmptyNote,
  PageHeading,
  StickyNote,
} from "@/components/notebook";
import { StoreRow } from "@/components/store-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useGeoLocation } from "@/hooks/use-geo";
import { DEFAULT_CENTER, distanceKm } from "@/lib/geo";
import { fromNearby, type DiscountView } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { LocateFixed, MapPin, Search, Store as StoreIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";

type SortMode = "distance" | "value";

export default function Nearby() {
  const navigate = useNavigate();
  const discounts = useQuery(api.discounts.listNearby);
  const stores = useQuery(api.stores.listApproved);
  const categories = useQuery(api.categories.list);
  const geo = useGeoLocation();

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [radius, setRadius] = useState(8);
  const [sort, setSort] = useState<SortMode>("distance");
  const [tab, setTab] = useState<"offers" | "stores">("offers");
  const [selected, setSelected] = useState<DiscountView | null>(null);

  const activeCategories = useMemo(
    () => (categories ?? []).filter((c) => c.isActive),
    [categories],
  );

  const selectedCategoryName = useMemo(
    () =>
      activeCategories.find((c) => c._id === categoryId)?.name ?? null,
    [activeCategories, categoryId],
  );

  const offers = useMemo(() => {
    if (!discounts) return [];
    const term = search.trim().toLowerCase();

    return discounts
      .map((row) =>
        fromNearby(
          row,
          distanceKm(geo.coords, { lat: row.store.lat, lng: row.store.lng }),
        ),
      )
      .filter((d) => (d.distanceKm ?? 99) <= radius)
      .filter(
        (d) => !selectedCategoryName || d.store.categoryName === selectedCategoryName,
      )
      .filter((d) => {
        if (!term) return true;
        return `${d.title} ${d.description ?? ""} ${d.store.name} ${
          d.store.categoryName ?? ""
        }`
          .toLowerCase()
          .includes(term);
      })
      .sort((a, b) =>
        sort === "distance"
          ? (a.distanceKm ?? 0) - (b.distanceKm ?? 0)
          : b.value - a.value,
      );
  }, [discounts, geo.coords, radius, selectedCategoryName, search, sort]);

  const nearbyStores = useMemo(() => {
    if (!stores) return [];
    const term = search.trim();
    return stores
      .map((store) => ({
        ...store,
        distance: distanceKm(geo.coords, { lat: store.lat, lng: store.lng }),
      }))
      .filter((store) => store.distance <= radius)
      .filter(
        (store) =>
          !selectedCategoryName || store.categoryName === selectedCategoryName,
      )
      .filter((store) => (term ? store.name.includes(term) : true))
      .sort(
        (a, b) =>
          b.activeDiscounts - a.activeDiscounts || a.distance - b.distance,
      );
  }, [stores, geo.coords, radius, selectedCategoryName, search]);

  const isLoading = discounts === undefined || stores === undefined;

  return (
    <div className="pb-4">
      <PageHeading
        eyebrow="تابع عروض المحلات حولك"
        title="الخصومات القريبة"
        note={
          geo.status === "locating" ? (
            <span className="inline-flex items-center gap-1.5">
              <LocateFixed className="size-3.5 animate-pulse" />
              جارٍ تحديد موقعك عبر GPS…
            </span>
          ) : geo.isFallback ? (
            <span className="flex flex-col gap-2">
              <span>📍 {geo.error}</span>
              <button
                type="button"
                onClick={geo.locate}
                className="w-fit underline decoration-dashed hover:text-primary"
              >
                إعادة محاولة تحديد الموقع
              </button>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5 text-primary" />
              رتّبنا العروض من الأقرب إلى الأبعد حسب موقعك الحالي.
            </span>
          )
        }
      />

      <div className="mt-2 space-y-3 px-5">
        <div className="relative">
          <Search className="pointer-events-none absolute inset-y-0 end-3 my-auto size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ابحث عن عرض أو متجر…"
            className="h-10 bg-card pe-9"
          />
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-dashed border-rule bg-card/70 p-2">
          <span className="text-[11px] text-muted-foreground">النطاق</span>
          <Slider
            value={[radius]}
            min={1}
            max={40}
            step={1}
            onValueChange={(value) => setRadius(value[0] ?? 8)}
            className="flex-1"
          />
          <span className="w-14 shrink-0 text-end text-[11px] font-bold">
            {radius} كم
          </span>
        </div>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto px-5 pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => setCategoryId(null)}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1 text-[11px] transition-colors",
            categoryId === null
              ? "border-primary bg-primary text-primary-foreground"
              : "border-rule bg-card text-muted-foreground",
          )}
        >
          الكل
        </button>
        {activeCategories.map((category) => (
          <button
            key={category._id}
            type="button"
            onClick={() =>
              setCategoryId(categoryId === category._id ? null : category._id)
            }
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-[11px] transition-colors",
              categoryId === category._id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-rule bg-card text-muted-foreground",
            )}
          >
            {category.emoji} {category.name}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 px-5">
        <div className="flex items-center gap-1 rounded-lg border border-rule bg-card/70 p-1">
          <button
            type="button"
            onClick={() => setTab("offers")}
            className={cn(
              "rounded-md px-3 py-1 text-[11px] transition-colors",
              tab === "offers"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground",
            )}
          >
            العروض
          </button>
          <button
            type="button"
            onClick={() => setTab("stores")}
            className={cn(
              "rounded-md px-3 py-1 text-[11px] transition-colors",
              tab === "stores"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground",
            )}
          >
            المتاجر
          </button>
        </div>

        {tab === "offers" ? (
          <div className="flex items-center gap-1 text-[11px]">
            <button
              type="button"
              onClick={() => setSort("distance")}
              className={cn(
                "rounded-md px-2 py-1 transition-colors",
                sort === "distance"
                  ? "font-bold text-primary"
                  : "text-muted-foreground",
              )}
            >
              الأقرب
            </button>
            <span className="text-rule">|</span>
            <button
              type="button"
              onClick={() => setSort("value")}
              className={cn(
                "rounded-md px-2 py-1 transition-colors",
                sort === "value"
                  ? "font-bold text-primary"
                  : "text-muted-foreground",
              )}
            >
              الأقوى خصمًا
            </button>
          </div>
        ) : (
          <span className="text-[11px] text-muted-foreground">
            {nearbyStores.length} متجر قريب
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3 px-5 pt-4">
          {[0, 1, 2].map((key) => (
            <div
              key={key}
              className="index-card h-24 animate-pulse bg-muted/40"
            />
          ))}
        </div>
      ) : tab === "offers" ? (
        offers.length > 0 ? (
          <>
            <div className="px-5 pt-4">
              <StickyNote className="rotate-[-0.5deg]">
                <span className="font-display font-bold">{offers.length}</span>{" "}
                عرض متاح داخل نطاق {radius} كم
                {geo.isFallback
                  ? ` حول ${DEFAULT_CENTER.label}`
                  : " من موقعك"}
                .
              </StickyNote>
            </div>
            <div className="space-y-3 px-5 pt-4">
              {offers.map((discount, index) => (
                <DiscountCard
                  key={discount.id}
                  discount={discount}
                  onOpen={setSelected}
                  rotate={index % 2 === 0 ? -0.35 : 0.35}
                />
              ))}
            </div>
          </>
        ) : (
          <EmptyNote
            emoji="🔍"
            title="لا توجد عروض مطابقة"
            description={
              search || categoryId
                ? "جرّب تغيير التصنيف أو مسح كلمة البحث."
                : "لم نجد خصومات داخل هذا النطاق، وسّع المسافة قليلًا."
            }
            action={
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRadius(Math.min(40, radius + 8))}
                >
                  توسيع النطاق إلى {Math.min(40, radius + 8)} كم
                </Button>
                {search || categoryId ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSearch("");
                      setCategoryId(null);
                    }}
                  >
                    مسح الفلاتر
                  </Button>
                ) : null}
              </div>
            }
          />
        )
      ) : nearbyStores.length > 0 ? (
        <div className="space-y-3 px-5 pt-4">
          {nearbyStores.map((store) => (
            <StoreRow
              key={store._id}
              store={store}
              distanceKm={store.distance}
              onOpen={() => navigate(`/app/store/${store._id}`)}
            />
          ))}
        </div>
      ) : (
        <EmptyNote
          emoji="🏬"
          title="لا توجد متاجر في هذا النطاق"
          description="جرّب توسيع نطاق البحث أو اختيار تصنيف آخر."
        />
      )}

      <div className="px-5 pt-6">
        <div className="annotation-line ps-3 text-[11px] leading-6 text-muted-foreground">
          <StoreIcon className="me-1 inline size-3.5" />
          هل أنت صاحب متجر؟ أضف عروضك من تبويب «متجري» وستظهر هنا بعد اعتمادها.
        </div>
      </div>

      <DiscountSheet discount={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
