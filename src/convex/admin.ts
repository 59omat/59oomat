import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import { currentUser, requireAdmin, resolveStoreLogo } from "./authz";
import { ROLES, REVIEW_STATUS, roleValidator } from "./schema";

async function discountReviewRow(ctx: QueryCtx, discountId: string) {
  const discount = await ctx.db.get(discountId as never);
  return discount;
}

/** هل يوجد مشرف للتطبيق؟ (يُستخدم لإظهار زر التفعيل الأول). */
export const adminExists = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.some((u) => u.role === ROLES.ADMIN);
  },
});

/** أول مستخدم يفعّل نفسه مشرفًا عندما لا يوجد مشرف بعد. */
export const claimAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await currentUser(ctx);
    if (!user) throw new Error("يجب تسجيل الدخول أولًا.");
    const users = await ctx.db.query("users").collect();
    if (users.some((u) => u.role === ROLES.ADMIN)) {
      throw new Error("يوجد مشرف للتطبيق بالفعل.");
    }
    await ctx.db.patch(user._id, { role: ROLES.ADMIN });
    return true;
  },
});

/** إحصائيات عامة للتطبيق. */
export const stats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const now = Date.now();

    const users = await ctx.db.query("users").collect();
    const stores = await ctx.db.query("stores").collect();
    const discounts = await ctx.db.query("discounts").collect();
    const favorites = await ctx.db.query("favorites").collect();
    const categories = await ctx.db.query("categories").collect();

    const merchants = new Set(stores.map((s) => s.ownerId)).size;

    const categoryRows = categories
      .map((c) => ({
        _id: c._id,
        name: c.name,
        emoji: c.emoji,
        stores: stores.filter((s) => s.categoryId === c._id).length,
        discounts: discounts.filter((d) => {
          const store = stores.find((s) => s._id === d.storeId);
          return store?.categoryId === c._id;
        }).length,
      }))
      .sort((a, b) => b.discounts - a.discounts);

    const storeRows = await Promise.all(
      stores.map(async (store) => {
        const own = discounts.filter((d) => d.storeId === store._id);
        return {
          _id: store._id,
          name: store.name,
          logo: await resolveStoreLogo(ctx, store),
          views: own.reduce((sum, d) => sum + d.views, 0),
          active: own.filter(
            (d) => d.status === REVIEW_STATUS.APPROVED && d.endDate >= now,
          ).length,
        };
      }),
    );

    return {
      users: users.length,
      merchants,
      favorites: favorites.length,
      categories: categories.length,
      stores: {
        total: stores.length,
        approved: stores.filter((s) => s.status === REVIEW_STATUS.APPROVED)
          .length,
        pending: stores.filter((s) => s.status === REVIEW_STATUS.PENDING).length,
        rejected: stores.filter((s) => s.status === REVIEW_STATUS.REJECTED)
          .length,
      },
      discounts: {
        total: discounts.length,
        approved: discounts.filter((d) => d.status === REVIEW_STATUS.APPROVED)
          .length,
        pending: discounts.filter((d) => d.status === REVIEW_STATUS.PENDING)
          .length,
        expired: discounts.filter((d) => d.endDate < now).length,
        running: discounts.filter(
          (d) => d.status === REVIEW_STATUS.APPROVED && d.endDate >= now,
        ).length,
      },
      totalViews: discounts.reduce((sum, d) => sum + d.views, 0),
      topCategories: categoryRows.slice(0, 5),
      topStores: storeRows.sort((a, b) => b.views - a.views).slice(0, 5),
    };
  },
});

/** متاجر بانتظار الاعتماد. */
export const pendingStores = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const stores = await ctx.db
      .query("stores")
      .withIndex("by_status", (q) => q.eq("status", REVIEW_STATUS.PENDING))
      .collect();

    const categories = await ctx.db.query("categories").collect();
    const catMap = new Map(categories.map((c) => [c._id, c]));

    return await Promise.all(
      stores.map(async (store) => {
        const owner = await ctx.db.get(store.ownerId);
        const cat = store.categoryId ? catMap.get(store.categoryId) : undefined;
        const count = await ctx.db
          .query("discounts")
          .withIndex("by_store", (q) => q.eq("storeId", store._id))
          .collect();
        return {
          _id: store._id,
          name: store.name,
          description: store.description ?? null,
          address: store.address ?? null,
          phone: store.phone ?? null,
          lat: store.lat,
          lng: store.lng,
          createdAt: store.createdAt,
          logo: await resolveStoreLogo(ctx, store),
          categoryName: cat?.name ?? null,
          categoryEmoji: cat?.emoji ?? null,
          ownerName: owner?.name ?? "تاجر",
          ownerEmail: owner?.email ?? null,
          discountsCount: count.length,
        };
      }),
    );
  },
});

/** كل المتاجر مع حالتها. */
export const allStores = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const stores = await ctx.db.query("stores").collect();
    const categories = await ctx.db.query("categories").collect();
    const catMap = new Map(categories.map((c) => [c._id, c]));

    return await Promise.all(
      stores
        .sort((a, b) => b.createdAt - a.createdAt)
        .map(async (store) => {
          const owner = await ctx.db.get(store.ownerId);
          const cat = store.categoryId ? catMap.get(store.categoryId) : undefined;
          const own = await ctx.db
            .query("discounts")
            .withIndex("by_store", (q) => q.eq("storeId", store._id))
            .collect();
          return {
            _id: store._id,
            name: store.name,
            status: store.status,
            reviewNote: store.reviewNote ?? null,
            createdAt: store.createdAt,
            address: store.address ?? null,
            logo: await resolveStoreLogo(ctx, store),
            categoryName: cat?.name ?? null,
            categoryEmoji: cat?.emoji ?? null,
            ownerName: owner?.name ?? "تاجر",
            ownerEmail: owner?.email ?? null,
            discountsCount: own.length,
            activeDiscounts: own.filter(
              (d) => d.status === REVIEW_STATUS.APPROVED && d.endDate >= Date.now(),
            ).length,
          };
        }),
    );
  },
});

/** خصومات بانتظار المراجعة. */
export const pendingDiscounts = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db
      .query("discounts")
      .withIndex("by_status", (q) => q.eq("status", REVIEW_STATUS.PENDING))
      .collect();

    return await Promise.all(
      rows.map(async (d) => {
        const store = await ctx.db.get(d.storeId);
        const owner = store ? await ctx.db.get(store.ownerId) : null;
        const imageUrls = (
          await Promise.all(d.images.map((id) => ctx.storage.getUrl(id)))
        ).filter((url): url is string => Boolean(url));
        return {
          _id: d._id,
          title: d.title,
          description: d.description ?? null,
          type: d.type,
          value: d.value,
          code: d.code ?? null,
          startDate: d.startDate,
          endDate: d.endDate,
          createdAt: d.createdAt,
          imageUrls,
          imageUrl: d.imageUrl ?? null,
          storeName: store?.name ?? "متجر",
          storeStatus: store?.status ?? REVIEW_STATUS.PENDING,
          ownerName: owner?.name ?? "تاجر",
        };
      }),
    );
  },
});

/** كل الخصومات (للمراجعة العامة والحذف). */
export const allDiscounts = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("discounts").collect();
    const stores = await ctx.db.query("stores").collect();
    const storeMap = new Map(stores.map((s) => [s._id, s]));
    const now = Date.now();

    return rows
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, args.limit ?? 60)
      .map((d) => ({
        _id: d._id,
        title: d.title,
        type: d.type,
        value: d.value,
        status: d.status,
        views: d.views,
        startDate: d.startDate,
        endDate: d.endDate,
        isExpired: d.endDate < now,
        storeId: d.storeId,
        storeName: storeMap.get(d.storeId)?.name ?? "متجر",
      }));
  },
});

/** إدارة المستخدمين والتجار. */
export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const users = await ctx.db.query("users").collect();
    const stores = await ctx.db.query("stores").collect();
    const favorites = await ctx.db.query("favorites").collect();

    return users
      .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))
      .map((u) => ({
        _id: u._id,
        name: u.name ?? (u.isAnonymous ? "زائر" : "مستخدم"),
        email: u.email ?? null,
        role: u.role ?? (u.isAnonymous ? ROLES.USER : ROLES.MEMBER),
        isAnonymous: Boolean(u.isAnonymous),
        stores: stores.filter((s) => s.ownerId === u._id).length,
        favorites: favorites.filter((f) => f.userId === u._id).length,
      }));
  },
});

export const setStoreStatus = mutation({
  args: {
    id: v.id("stores"),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.id, {
      status: args.status,
      reviewNote: args.note?.trim() || undefined,
    });
  },
});

export const setDiscountStatus = mutation({
  args: {
    id: v.id("discounts"),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const discount = await ctx.db.get(args.id);
    if (!discount) throw new Error("الخصم غير موجود.");
    await ctx.db.patch(args.id, {
      status: args.status,
      reviewNote: args.note?.trim() || undefined,
    });
  },
});

export const setUserRole = mutation({
  args: { userId: v.id("users"), role: roleValidator },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    if (admin._id === args.userId && args.role !== ROLES.ADMIN) {
      throw new Error("لا يمكنك إزالة صلاحية الإدارة عن نفسك.");
    }
    await ctx.db.patch(args.userId, { role: args.role });
  },
});

export { discountReviewRow };
