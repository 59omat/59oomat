import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin, requireUser } from "./authz";

/** كل التصنيفات مرتبة. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();
    return categories.sort((a, b) => a.order - b.order);
  },
});

export const create = mutation({
  args: { name: v.string(), emoji: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const name = args.name.trim();
    if (name.length < 2) throw new Error("اسم التصنيف قصير جدًا.");

    const all = await ctx.db.query("categories").collect();
    const order = all.reduce((max, c) => Math.max(max, c.order), 0) + 1;
    return await ctx.db.insert("categories", {
      name,
      emoji: args.emoji.trim() || "🏷️",
      order,
      isActive: true,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("categories"),
    name: v.optional(v.string()),
    emoji: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...rest } = args;
    const patch: Record<string, unknown> = {};
    if (rest.name !== undefined) patch.name = rest.name.trim();
    if (rest.emoji !== undefined) patch.emoji = rest.emoji.trim() || "🏷️";
    if (rest.isActive !== undefined) patch.isActive = rest.isActive;
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const stores = await ctx.db
      .query("stores")
      .collect()
      .then((rows) => rows.filter((s) => s.categoryId === args.id));
    if (stores.length > 0) {
      throw new Error(
        `لا يمكن حذف التصنيف: مرتبط بـ ${stores.length} متجر. أوقفه بدل الحذف.`,
      );
    }
    await ctx.db.delete(args.id);
  },
});

/** أي مستخدم مسجل يمكنه إنشاء تصنيف مقترح (يظهر فورًا للمشرف). */
export const suggest = mutation({
  args: { name: v.string(), emoji: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const all = await ctx.db.query("categories").collect();
    if (all.some((c) => c.name.trim() === args.name.trim())) {
      throw new Error("هذا التصنيف موجود مسبقًا.");
    }
    const order = all.reduce((max, c) => Math.max(max, c.order), 0) + 1;
    return await ctx.db.insert("categories", {
      name: args.name.trim(),
      emoji: args.emoji?.trim() || "🏷️",
      order,
      isActive: true,
    });
  },
});
