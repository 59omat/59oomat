import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser, resolveStoreLogo } from "./authz";
import { REVIEW_STATUS } from "./schema";

/** المتاجر المفضلة للمستخدم مع عدد عروضها النشطة. */
export const mine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const now = Date.now();
    const categories = await ctx.db.query("categories").collect();
    const catMap = new Map(categories.map((c) => [c._id, c]));

    const rows = [];
    for (const favorite of favorites.sort((a, b) => b.createdAt - a.createdAt)) {
      const store = await ctx.db.get(favorite.storeId);
      if (!store) continue;

      const discounts = await ctx.db
        .query("discounts")
        .withIndex("by_store", (q) => q.eq("storeId", store._id))
        .collect();
      const active = discounts.filter(
        (d) => d.status === REVIEW_STATUS.APPROVED && d.endDate >= now,
      );
      const cat = store.categoryId ? catMap.get(store.categoryId) : undefined;

      rows.push({
        _id: store._id,
        name: store.name,
        description: store.description ?? null,
        address: store.address ?? null,
        phone: store.phone ?? null,
        lat: store.lat,
        lng: store.lng,
        logo: await resolveStoreLogo(ctx, store),
        categoryName: cat?.name ?? null,
        categoryEmoji: cat?.emoji ?? null,
        activeDiscounts: active.length,
        bestValue: active.reduce(
          (max, d) => Math.max(max, d.type === "percent" ? d.value : 0),
          0,
        ),
        savedAt: favorite.createdAt,
      });
    }

    return rows;
  },
});

/** عدد المتاجر المفضلة. */
export const count = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const rows = await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    return rows.length;
  },
});

/** إضافة/إزالة متجر من المفضلة، ويعيد الحالة الجديدة. */
export const toggle = mutation({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const store = await ctx.db.get(args.storeId);
    if (!store) throw new Error("المتجر غير موجود.");

    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_store", (q) =>
        q.eq("userId", user._id).eq("storeId", args.storeId),
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    }

    await ctx.db.insert("favorites", {
      userId: user._id,
      storeId: args.storeId,
      createdAt: Date.now(),
    });
    return true;
  },
});
