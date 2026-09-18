import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { ROLES } from "./schema";

type Ctx = QueryCtx | MutationCtx;

/** المستخدم الحالي أو null. */
export async function currentUser(ctx: Ctx): Promise<Doc<"users"> | null> {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;
  return await ctx.db.get(userId);
}

export async function requireUser(ctx: Ctx): Promise<Doc<"users">> {
  const user = await currentUser(ctx);
  if (!user) throw new Error("يجب تسجيل الدخول للمتابعة.");
  return user;
}

export async function requireAdmin(ctx: Ctx): Promise<Doc<"users">> {
  const user = await requireUser(ctx);
  if (user.role !== ROLES.ADMIN) {
    throw new Error("هذه العملية متاحة لمشرف التطبيق فقط.");
  }
  return user;
}

/** يسمح لمالك المتجر أو للمشرف بالتعديل. */
export async function requireOwnerOrAdmin(
  ctx: Ctx,
  ownerId: Id<"users">,
): Promise<Doc<"users">> {
  const user = await requireUser(ctx);
  if (user._id !== ownerId && user.role !== ROLES.ADMIN) {
    throw new Error("لا تملك صلاحية تعديل هذا العنصر.");
  }
  return user;
}

/** روابط صور الخصم من مخزن الملفات. */
export async function resolveImageUrls(
  ctx: Ctx,
  discount: Doc<"discounts">,
): Promise<string[]> {
  const urls = await Promise.all(
    discount.images.map((storageId) => ctx.storage.getUrl(storageId)),
  );
  return urls.filter((url): url is string => Boolean(url));
}

/** شعار المتجر من مخزن الملفات أو الرابط المباشر. */
export async function resolveStoreLogo(
  ctx: Ctx,
  store: Doc<"stores">,
): Promise<string | null> {
  if (store.logoId) {
    const url = await ctx.storage.getUrl(store.logoId);
    if (url) return url;
  }
  return store.logoUrl ?? null;
}

export const MAX_ACTIVE_DISCOUNTS_PER_STORE = 40;
