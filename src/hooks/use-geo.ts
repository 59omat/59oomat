import { useCallback, useEffect, useState } from "react";
import { DEFAULT_CENTER, type Coords } from "@/lib/geo";

export type GeoStatus = "locating" | "granted" | "denied" | "unsupported";

export type GeoState = {
  coords: Coords;
  /** true عندما نعرض مركزًا افتراضيًا بدل موقع المستخدم الحقيقي. */
  isFallback: boolean;
  status: GeoStatus;
  error: string | null;
};

type CapacitorGeo = {
  getCurrentPosition: (options?: {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
  }) => Promise<{
    coords: { latitude: number; longitude: number };
  }>;
};

/**
 * يطلب موقع المستخدم عبر GPS. عند الرفض أو الفشل يعرض موقعًا افتراضيًا
 * (وسط الرياض) حتى يظل التطبيق قابلًا للاستخدام.
 * على iOS/Android يستخدم الإضافة الأصلية Capacitor Geolocation (تعمل بدون
 * HTTPS ومباشرة مع GPS الجهاز)، وفي المتصفح يستخدم navigator.geolocation.
 */
export function useGeoLocation() {
  const [state, setState] = useState<GeoState>({
    coords: { lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng },
    isFallback: true,
    status: "locating",
    error: null,
  });

  const locate = useCallback(() => {
    const fallback = (status: GeoStatus, error: string) =>
      setState({
        coords: { lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng },
        isFallback: true,
        status,
        error,
      });

    // 1) بيئة أصلية (تطبيق App Store / Google Play)
    if (typeof window !== "undefined" && (window as unknown as { Capacitor?: unknown }).Capacitor) {
      void import("@capacitor/geolocation")
        .then(({ Geolocation }) =>
          Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 10000,
          }),
        )
        .then((position) => {
          setState({
            coords: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
            isFallback: false,
            status: "granted",
            error: null,
          });
        })
        .catch(() =>
          fallback(
            "denied",
            "لم نتمكن من الوصول إلى موقعك، نعرض لك عروض مركز المدينة.",
          ),
        );
      return;
    }

    // 2) متصفح عادي
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      fallback("unsupported", "متصفحك لا يدعم تحديد الموقع.");
      return;
    }

    setState((prev) => ({ ...prev, status: "locating", error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          isFallback: false,
          status: "granted",
          error: null,
        });
      },
      (error) => {
        fallback(
          error.code === error.PERMISSION_DENIED ? "denied" : "unsupported",
          error.code === error.PERMISSION_DENIED
            ? "لم تسمح للتطبيق بالوصول إلى موقعك، نعرض لك عروض مركز المدينة."
            : "تعذّر تحديد موقعك، نعرض لك عروض مركز المدينة.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  useEffect(() => {
    locate();
  }, [locate]);

  return { ...state, locate };
}
