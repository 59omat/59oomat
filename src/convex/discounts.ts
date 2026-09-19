import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireOwnerOrAdmin, requireUser, resolveStoreLogo } from "./authz";
import { REVIEW_STATUS, ROLES } from "./schema";
import type { Doc } from "./_generated/dataModel";

const MAX_IMAGES = 6;

function validateOffer(input: {
  title: string;
  type: "percent" | "amount";
  value: number;
  startDate: number;
  endDate: number;
}) {
  if (input.title.trim().length < 3) {
    throw new Error("اكتب اسمًا واضحًا للعرض (٣ أحرف على الأقل).");
  }
  if (!Number.isFinite(input.value) || input.value <= 0) {
    throw new Error("قيمة الخصم يجب أن تكون أكبر من صفر.");
  }
  if (input.type === "percent" && input.value > 100) {
    throw new Error("نسبة الخصم لا يمكن أن تتجاوز 100%.");
  }
  if (input.endDate <= input.startDate) {
    throw new Error("تاريخ النهاية يجب أن يكون بعد تاريخ البداية.");
  }
}

/** خصومات المتاجر المعتمدة والنشطة الآن — تُرتب في التطبيق حسب المسافة. */
export const listNearby = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const discounts = await ctx.db
      .query("discounts")
      .withIndex("by_status", (q) => q.eq("status", REVIEW_STATUS.APPROVED))
      .collect();

    const categories = await ctx.db.query("categories").collect();
    const catMap = new Map(categories.map((c) => [c._id, c]));

    const rows = [];
    for (const d of discounts) {
      if (d.endDate < now) continue;
      if (d.startDate > now) continue;

      const store: Doc<"stores"> | null = await ctx.db.get(d.storeId);
      if (!store || store.status !== REVIEW_STATUS.APPROVED) continue;

      const cat = store.categoryId ? catMap.get(store.categoryId) : undefined;
      const imageUrls = (
        await Promise.all(d.images.map((id) => ctx.storage.getUrl(id)))
      ).filter((url): url is string => Boolean(url));

      rows.push({
        _id: d._id,
        title: d.title,
        description: d.description ?? null,
        type: d.type,
        value: d.value,
        code: d.code ?? null,
        startDate: d.startDate,
        endDate: d.endDate,
        views: d.views,
        categoryId: store.categoryId ?? null,
        imageUrls,
        imageUrl: d.imageUrl ?? null,
        store: {
          _id: store._id,
          name: store.name,
          address: store.address ?? null,
          phone: store.phone ?? null,
          lat: store.lat,
          lng: store.lng,
          categoryName: cat?.name ?? null,
          categoryEmoji: cat?.emoji ?? null,
          logo: await resolveStoreLogo(ctx, store),
        },
      });
    }

    return rows;
  },
});

/** خصومات التاجر الحالي بكل حالاتها (نشطة / بانتظار المراجعة / منتهية). */
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const rows = await ctx.db
      .query("discounts")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();

    const now = Date.now();
    const sorted = rows.sort((a, b) => b.createdAt - a.createdAt);

    return await Promise.all(
      sorted.map(async (d) => ({
        _id: d._id,
        title: d.title,
        description: d.description ?? null,
        type: d.type,
        value: d.value,
        code: d.code ?? null,
        startDate: d.startDate,
        endDate: d.endDate,
        status: d.status,
        reviewNote: d.reviewNote ?? null,
        views: d.views,
        createdAt: d.createdAt,
        isExpired: d.endDate < now,
        images: d.images,
        imageUrl: d.imageUrl ?? null,
        thumbnail: d.images.length ? await ctx.storage.getUrl(d.images[0]) : null,
      })),
    );
  },
});

export const create = mutation({
  args: {
    storeId: v.id("stores"),
    title: v.string(),
    description: v.optional(v.string()),
    type: v.union(v.literal("percent"), v.literal("amount")),
    value: v.number(),
    code: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.number(),
    images: v.array(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.storeId);
    if (!store) throw new Error("المتجر غير موجود.");
    await requireOwnerOrAdmin(ctx, store.ownerId);

    validateOffer(args);
    if (args.images.length > MAX_IMAGES) {
      throw new Error(`يمكن رفع ${MAX_IMAGES} صور كحد أقصى للعرض.`);
    }

    return await ctx.db.insert("discounts", {
      storeId: args.storeId,
      ownerId: store.ownerId,
      title: args.title.trim(),
      description: args.description?.trim() || undefined,
      type: args.type,
      value: args.value,
      code: args.code?.trim() || undefined,
      startDate: args.startDate,
      endDate: args.endDate,
      images: args.images,
      status: REVIEW_STATUS.PENDING,
      views: 0,
      saves: 0,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("discounts"),
    title: v.string(),
    description: v.optional(v.string()),
    type: v.union(v.literal("percent"), v.literal("amount")),
    value: v.number(),
    code: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.number(),
    images: v.array(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const discount = await ctx.db.get(args.id);
    if (!discount) throw new Error("الخصم غير موجود.");
    const user = await requireOwnerOrAdmin(ctx, discount.ownerId);

    validateOffer(args);
    if (args.images.length > MAX_IMAGES) {
      throw new Error(`يمكن رفع ${MAX_IMAGES} صور كحد أقصى للعرض.`);
    }

    // الصور التي أزالها التاجر تُحذف من المخزن.
    const kept = new Set(args.images);
    for (const image of discount.images) {
      if (!kept.has(image)) await ctx.storage.delete(image);
    }

    await ctx.db.patch(args.id, {
      title: args.title.trim(),
      description: args.description?.trim() || undefined,
      type: args.type,
      value: args.value,
      code: args.code?.trim() || undefined,
      startDate: args.startDate,
      endDate: args.endDate,
      images: args.images,
      // أي تعديل من التاجر يعيد الخصم لقائمة المراجعة.
      status:
        discount.status === REVIEW_STATUS.APPROVED && user.role !== ROLES.ADMIN
          ? REVIEW_STATUS.PENDING
          : discount.status,
      reviewNote: user.role === ROLES.ADMIN ? discount.reviewNote : undefined,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("discounts") },
  handler: async (ctx, args) => {
    const discount = await ctx.db.get(args.id);
    if (!discount) return;
    await requireOwnerOrAdmin(ctx, discount.ownerId);
    for (const image of discount.images) await ctx.storage.delete(image);
    await ctx.db.delete(args.id);
  },
});

/** زيادة عدد المشاهدات عند فتح العرض. */
export const trackView = mutation({
  args: { id: v.id("discounts") },
  handler: async (ctx, args) => {
    const discount = await ctx.db.get(args.id);
    if (!discount) return;
    await ctx.db.patch(args.id, { views: discount.views + 1 });
  },
});
