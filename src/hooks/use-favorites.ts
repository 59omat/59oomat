import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";

/** إدارة متاجر المستخدم المفضلة (قراءة + إضافة/إزالة). */
export function useFavoriteStores() {
  const favorites = useQuery(api.favorites.mine);
  const toggleMutation = useMutation(api.favorites.toggle);

  const ids = useMemo(
    () => new Set((favorites ?? []).map((store) => store._id)),
    [favorites],
  );

  const isFavorite = useCallback(
    (storeId: Id<"stores">) => ids.has(storeId),
    [ids],
  );

  const toggle = useCallback(
    async (storeId: Id<"stores">) => {
      try {
        const added = await toggleMutation({ storeId });
        toast.success(added ? "أُضيف المتجر إلى المفضلة" : "أُزيل من المفضلة");
      } catch {
        toast.error("تعذّر تحديث المفضلة، حاول مرة أخرى.");
      }
    },
    [toggleMutation],
  );

  return { favorites, isFavorite, toggle, count: ids.size };
}
