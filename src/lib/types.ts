import type { Id } from "@/convex/_generated/dataModel";

export type StoreRef = {
  id: Id<"stores">;
  name: string;
  address: string | null;
  phone: string | null;
  lat: number;
  lng: number;
  categoryName: string | null;
  categoryEmoji: string | null;
  logo: string | null;
};

/** شكل العرض الموحّد بين شاشات التطبيق. */
export type DiscountView = {
  id: Id<"discounts">;
  title: string;
  description: string | null;
  type: "percent" | "amount";
  value: number;
  code: string | null;
  startDate: number;
  endDate: number;
  images: string[];
  views: number | null;
  distanceKm: number | null;
  store: StoreRef;
};

type NearbyRow = {
  _id: Id<"discounts">;
  title: string;
  description: string | null;
  type: "percent" | "amount";
  value: number;
  code: string | null;
  startDate: number;
  endDate: number;
  views: number;
  imageUrls: string[];
  imageUrl: string | null;
  store: {
    _id: Id<"stores">;
    name: string;
    address: string | null;
    phone: string | null;
    lat: number;
    lng: number;
    categoryName: string | null;
    categoryEmoji: string | null;
    logo: string | null;
  };
};

export function fromNearby(row: NearbyRow, distance: number): DiscountView {
  return {
    id: row._id,
    title: row.title,
    description: row.description,
    type: row.type,
    value: row.value,
    code: row.code,
    startDate: row.startDate,
    endDate: row.endDate,
    images: [...row.imageUrls, ...(row.imageUrl ? [row.imageUrl] : [])],
    views: row.views,
    distanceKm: distance,
    store: {
      id: row.store._id,
      name: row.store.name,
      address: row.store.address,
      phone: row.store.phone,
      lat: row.store.lat,
      lng: row.store.lng,
      categoryName: row.store.categoryName,
      categoryEmoji: row.store.categoryEmoji,
      logo: row.store.logo,
    },
  };
}

type StoreDiscountRow = {
  _id: Id<"discounts">;
  title: string;
  description: string | null;
  type: "percent" | "amount";
  value: number;
  code: string | null;
  startDate: number;
  endDate: number;
  views: number;
  imageUrls: string[];
  imageUrl: string | null;
};

export function fromStoreDiscount(
  row: StoreDiscountRow,
  store: StoreRef,
  distance: number | null,
): DiscountView {
  return {
    id: row._id,
    title: row.title,
    description: row.description,
    type: row.type,
    value: row.value,
    code: row.code,
    startDate: row.startDate,
    endDate: row.endDate,
    images: [...row.imageUrls, ...(row.imageUrl ? [row.imageUrl] : [])],
    views: row.views,
    distanceKm: distance,
    store,
  };
}
