import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
  MERCHANT: "merchant",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
  v.literal(ROLES.MERCHANT),
);
export type Role = Infer<typeof roleValidator>;

/** مراجعة المتاجر والخصومات قبل ظهورها للمستخدمين. */
export const REVIEW_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export const reviewStatusValidator = v.union(
  v.literal(REVIEW_STATUS.PENDING),
  v.literal(REVIEW_STATUS.APPROVED),
  v.literal(REVIEW_STATUS.REJECTED),
);
export type ReviewStatus = Infer<typeof reviewStatusValidator>;

/** نسبة مئوية أو مبلغ ثابت. */
export const discountTypeValidator = v.union(
  v.literal("percent"),
  v.literal("amount"),
);
export type DiscountType = Infer<typeof discountTypeValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
      phone: v.optional(v.string()),
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // تصنيفات المتاجر: مطاعم، مقاهي، ملابس...
    categories: defineTable({
      name: v.string(),
      emoji: v.string(),
      order: v.number(),
      isActive: v.boolean(),
    }).index("by_order", ["order"]),

    // متجر التاجر مع موقعه الجغرافي.
    stores: defineTable({
      ownerId: v.id("users"),
      name: v.string(),
      categoryId: v.optional(v.id("categories")),
      description: v.optional(v.string()),
      address: v.optional(v.string()),
      phone: v.optional(v.string()),
      lat: v.number(),
      lng: v.number(),
      logoId: v.optional(v.id("_storage")),
      logoUrl: v.optional(v.string()),
      status: reviewStatusValidator,
      reviewNote: v.optional(v.string()),
      createdAt: v.number(),
    })
      .index("by_owner", ["ownerId"])
      .index("by_status", ["status"]),

    // خصم داخل متجر: قيمة، تواريخ، صور.
    discounts: defineTable({
      storeId: v.id("stores"),
      ownerId: v.id("users"),
      title: v.string(),
      description: v.optional(v.string()),
      type: discountTypeValidator,
      value: v.number(),
      code: v.optional(v.string()),
      startDate: v.number(),
      endDate: v.number(),
      images: v.array(v.id("_storage")),
      imageUrl: v.optional(v.string()),
      status: reviewStatusValidator,
      reviewNote: v.optional(v.string()),
      views: v.number(),
      saves: v.number(),
      createdAt: v.number(),
    })
      .index("by_store", ["storeId"])
      .index("by_owner", ["ownerId"])
      .index("by_status", ["status"]),

    // متاجر المستخدم المفضلة.
    favorites: defineTable({
      userId: v.id("users"),
      storeId: v.id("stores"),
      createdAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_user_store", ["userId", "storeId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
