import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireUser } from "./authz";

/** رابط رفع ملف (صورة خصم أو شعار متجر) إلى مخزن Convex. */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const remove = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    await ctx.storage.delete(args.storageId);
  },
});
