import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import {
  currentUser,
  requireOwnerOrAdmin,
  requireUser,
  resolveStoreLogo,
} from "./authz";
import { ROLES, REVIEW_STATUS } from "./schema";

type Ctx = QueryCtx | MutationCtx;

/** ملخص حالة خصومات المتجر (نشط / بانتظار المراجعة / منتهي). */
async function summarizeStore(ctx: Ctx, storeId: Id<"stores">, now: number) {
  const discounts = await ctx.db
    .query("discounts")
    .withIndex("by_store", (q) => q.eq("storeId", storeId))
    .collect();

  return {
    total: discounts.length,
    active: discounts.filter(
      (d) => d.status === REVIEW_STATUS.APPROVED && d.endDate >= now,
    ).length,
    pending: discounts.filter((d) => d.status === REVIEW_STATUS.PENDING).length,
    expired: discounts.filter((d) => d.endDate < now).length,
    views: discounts.reduce((sum, d) => sum + d.views, 0),
  };
}

/** متجر المستخدم الحالي (إن وُجد) مع ملخص خصوماته. */
export const myStore = query({
  args: {},
  handler: async (ctx) => {
    const user = await currentUser(ctx);
    if (!user) return null;

    const store = await ctx.db
      .query("stores")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .first();
    if (!store) return null;

    const category = store.categoryId ? await ctx.db.get(store.categoryId) : null;

    return {
      ...store,
      logo: await resolveStoreLogo(ctx, store),
      categoryName: category?.name ?? null,
      categoryEmoji: category?.emoji ?? null,
      stats: await summarizeStore(ctx, store._id, Date.now()),
    };
  },
});

/** تفاصيل متجر + خصوماته النشطة، مع حالة المفضلة. */
export const get = query({
  args: { id: v.id("stores") },
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.id);
    if (!store) return null;

    const user = await currentUser(ctx);
    const category = store.categoryId ? await ctx.db.get(store.categoryId) : null;
    const now = Date.now();

    const rows = await ctx.db
      .query("discounts")
      .withIndex("by_store", (q) => q.eq("storeId", store._id))
      .collect();

    const visible = rows
      .filter((d) => d.status === REVIEW_STATUS.APPROVED && d.endDate >= now)
      .sort((a, b) => b.value - a.value);

    const discounts = await Promise.all(
      visible.map(async (d) => ({
        _id: d._id,
        title: d.title,
        description: d.description ?? null,
        type: d.type,
        value: d.value,
        code: d.code ?? null,
        startDate: d.startDate,
        endDate: d.endDate,
        views: d.views,
        imageUrls: (
          await Promise.all(d.images.map((id) => ctx.storage.getUrl(id)))
        ).filter((url): url is string => Boolean(url)),
        imageUrl: d.imageUrl ?? null,
      })),
    );

    const favorite = user
      ? await ctx.db
          .query("favorites")
          .withIndex("by_user_store", (q) =>
            q.eq("userId", user._id).eq("storeId", store._id),
          )
          .first()
      : null;

    return {
      _id: store._id,
      name: store.name,
      description: store.description ?? null,
      address: store.address ?? null,
      phone: store.phone ?? null,
      lat: store.lat,
      lng: store.lng,
      status: store.status,
      categoryName: category?.name ?? null,
      categoryEmoji: category?.emoji ?? null,
      logo: await resolveStoreLogo(ctx, store),
      isFavorite: Boolean(favorite),
      canManage: Boolean(
        user && (user._id === store.ownerId || user.role === ROLES.ADMIN),
      ),
      discounts,
    };
  },
});

/** المتاجر المعتمدة مع عدد الخصومات النشطة (لتصفح المتاجر القريبة). */
export const listApproved = query({
  args: {},
  handler: async (ctx) => {
    const stores = await ctx.db
      .query("stores")
      .withIndex("by_status", (q) => q.eq("status", REVIEW_STATUS.APPROVED))
      .collect();

    const now = Date.now();
    const categories = await ctx.db.query("categories").collect();
    const catMap = new Map(categories.map((c) => [c._id, c]));

    return await Promise.all(
      stores.map(async (store) => {
        const stats = await summarizeStore(ctx, store._id, now);
        const cat = store.categoryId ? catMap.get(store.categoryId) : undefined;
        return {
          _id: store._id,
          name: store.name,
          description: store.description ?? null,
          address: store.address ?? null,
          lat: store.lat,
          lng: store.lng,
          logo: await resolveStoreLogo(ctx, store),
          categoryName: cat?.name ?? null,
          categoryEmoji: cat?.emoji ?? null,
          activeDiscounts: stats.active,
          totalDiscounts: stats.total,
        };
      }),
    );
  },
});

/** إنشاء متجر التاجر (يبقى بانتظار مراجعة المشرف). */
export const create = mutation({
  args: {
    name: v.string(),
    categoryId: v.optional(v.id("categories")),
    description: v.optional(v.string()),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    lat: v.number(),
    lng: v.number(),
    logoId: v.optional(v.id("_storage")),
    logoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const name = args.name.trim();
    if (name.length < 2) throw new Error("اسم المتجر قصير جدًا.");
    if (!Number.isFinite(args.lat) || !Number.isFinite(args.lng)) {
      throw new Error("موقع المتجر غير صالح.");
    }

    const existing = await ctx.db
      .query("stores")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .first();
    if (existing) {
      throw new Error("لديك متجر مسجّل بالفعل في التطبيق.");
    }

    const storeId = await ctx.db.insert("stores", {
      ownerId: user._id,
      name,
      categoryId: args.categoryId,
      description: args.description?.trim() || undefined,
      address: args.address?.trim() || undefined,
      phone: args.phone?.trim() || undefined,
      lat: args.lat,
      lng: args.lng,
      logoId: args.logoId,
      logoUrl: args.logoUrl?.trim() || undefined,
      status: REVIEW_STATUS.PENDING,
      createdAt: Date.now(),
    });

    if (user.role !== ROLES.ADMIN) {
      await ctx.db.patch(user._id, { role: ROLES.MERCHANT });
    }

    return storeId;
  },
});

export const update = mutation({
  args: {
    id: v.id("stores"),
    name: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    description: v.optional(v.string()),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    logoId: v.optional(v.id("_storage")),
    logoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.id);
    if (!store) throw new Error("المتجر غير موجود.");
    const user = await requireOwnerOrAdmin(ctx, store.ownerId);

    const patch: Record<string, unknown> = {};
    if (args.name !== undefined) {
      if (args.name.trim().length < 2) throw new Error("اسم المتجر قصير جدًا.");
      patch.name = args.name.trim();
    }
    if (args.categoryId !== undefined) patch.categoryId = args.categoryId;
    if (args.description !== undefined)
      patch.description = args.description.trim() || undefined;
    if (args.address !== undefined)
      patch.address = args.address.trim() || undefined;
    if (args.phone !== undefined) patch.phone = args.phone.trim() || undefined;
    if (args.lat !== undefined) patch.lat = args.lat;
    if (args.lng !== undefined) patch.lng = args.lng;
    if (args.logoId !== undefined) patch.logoId = args.logoId;
    if (args.logoUrl !== undefined)
      patch.logoUrl = args.logoUrl.trim() || undefined;

    // تعديل التاجر لبيانات المتجر يعيده للمراجعة من جديد.
    if (user.role !== ROLES.ADMIN) {
      patch.status = REVIEW_STATUS.PENDING;
      patch.reviewNote = undefined;
    }

    await ctx.db.patch(args.id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("stores") },
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.id);
    if (!store) return;
    await requireOwnerOrAdmin(ctx, store.ownerId);

    const discounts = await ctx.db
      .query("discounts")
      .withIndex("by_store", (q) => q.eq("storeId", store._id))
      .collect();
    for (const d of discounts) {
      for (const image of d.images) await ctx.storage.delete(image);
      await ctx.db.delete(d._id);
    }

    const favorites = await ctx.db
      .query("favorites")
      .collect()
      .then((rows) => rows.filter((f) => f.storeId === store._id));
    for (const f of favorites) await ctx.db.delete(f._id);

    if (store.logoId) await ctx.storage.delete(store.logoId);
    await ctx.db.delete(store._id);
  },
});
