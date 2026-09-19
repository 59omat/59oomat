import { mutation } from "./_generated/server";
import { ROLES, REVIEW_STATUS } from "./schema";

const DAY = 1000 * 60 * 60 * 24;

const CATEGORIES = [
  { name: "مطاعم", emoji: "🍽️" },
  { name: "مقاهي", emoji: "☕" },
  { name: "ملابس", emoji: "👕" },
  { name: "إلكترونيات", emoji: "📱" },
  { name: "بقالة", emoji: "🛒" },
  { name: "صحة وجمال", emoji: "💅" },
  { name: "رياضة", emoji: "🏋️" },
  { name: "أطفال", emoji: "🧸" },
];

type SeedDiscount = {
  title: string;
  description: string;
  type: "percent" | "amount";
  value: number;
  code?: string;
  startOffset: number;
  endOffset: number;
  status: "approved" | "pending";
  views: number;
};

type SeedStore = {
  name: string;
  owner: string;
  category: string;
  description: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  status: "approved" | "pending";
  discounts: SeedDiscount[];
};

const STORES: SeedStore[] = [
  {
    name: "مطعم قلم رصاص",
    owner: "خالد الحربي",
    category: "مطاعم",
    description: "مطعم مشاوي ومأكولات شعبية بلمسة عصرية.",
    address: "شارع العليا العام، حي الملز، الرياض",
    phone: "0512345678",
    lat: 24.7155,
    lng: 46.678,
    status: "approved",
    discounts: [
      {
        title: "خصم 30% على وجبات المشاوي",
        description: "يشمل جميع أطباق المشاوي المشكلة طوال أيام الأسبوع عدا الجمعة.",
        type: "percent",
        value: 30,
        code: "GRILL30",
        startOffset: -4,
        endOffset: 12,
        status: "approved",
        views: 412,
      },
      {
        title: "غداء عائلي بـ 99 ريال",
        description: "وجبة عائلية كاملة لأربعة أشخاص مع المشروبات.",
        type: "amount",
        value: 99,
        code: "FAM99",
        startOffset: -2,
        endOffset: 20,
        status: "approved",
        views: 188,
      },
    ],
  },
  {
    name: "مقهى الدفتر",
    owner: "نورة العتيبي",
    category: "مقاهي",
    description: "قهوة مختصة وأجواء هادئة للعمل والقراءة.",
    address: "طريق الملك عبدالله، حي الملقا، الرياض",
    phone: "0554321987",
    lat: 24.7085,
    lng: 46.67,
    status: "approved",
    discounts: [
      {
        title: "اشترِ قهوة والثانية مجانًا",
        description: "على جميع القهوة الباردة والساخنة يوميًا من 3 إلى 6 مساءً.",
        type: "percent",
        value: 50,
        startOffset: -6,
        endOffset: 9,
        status: "approved",
        views: 640,
      },
      {
        title: "خصم 25% على الحلويات",
        description: "مع أي مشروب ساخن، اختيار الكاشير.",
        type: "percent",
        value: 25,
        startOffset: -1,
        endOffset: 30,
        status: "approved",
        views: 143,
      },
    ],
  },
  {
    name: "متجر الوردة للملابس",
    owner: "ريم القحطاني",
    category: "ملابس",
    description: "أزياء نسائية وأطفال بموديلات موسمية.",
    address: "حي النخيل، طريق التخصصي، الرياض",
    phone: "0500112233",
    lat: 24.722,
    lng: 46.685,
    status: "approved",
    discounts: [
      {
        title: "تخفيضات نهاية الموسم 40%",
        description: "على تشكيلة الصيف كاملة، المقاسات محدودة.",
        type: "percent",
        value: 40,
        startOffset: -8,
        endOffset: 6,
        status: "approved",
        views: 903,
      },
      {
        title: "اشترِ قطعتين والثالثة بـ 50 ريال",
        description: "على قسم ملابس الأطفال فقط.",
        type: "amount",
        value: 50,
        startOffset: -3,
        endOffset: 15,
        status: "approved",
        views: 267,
      },
    ],
  },
  {
    name: "إلكترونيات المسطرة",
    owner: "عبدالله الشهري",
    category: "إلكترونيات",
    description: "جوالات وسماعات وأجهزة لوحية بضمان معتمد.",
    address: "شارع التحلية، حي السليمانية، الرياض",
    phone: "0567891234",
    lat: 24.704,
    lng: 46.662,
    status: "approved",
    discounts: [
      {
        title: "خصم 15% على السماعات",
        description: "على جميع السماعات اللاسلكية واللاسلكية المزودة بخاصية إلغاء الضوضاء.",
        type: "percent",
        value: 15,
        startOffset: -5,
        endOffset: 11,
        status: "approved",
        views: 321,
      },
      {
        title: "شاحن أصلي مجانًا مع كل جوال",
        description: "هدية عند شراء أي جوال فوق 1500 ريال.",
        type: "amount",
        value: 120,
        startOffset: -1,
        endOffset: 25,
        status: "approved",
        views: 96,
      },
    ],
  },
  {
    name: "بقالة كراسة",
    owner: "محمد الدوسري",
    category: "بقالة",
    description: "بقالة الحي بمخبوزات طازجة ومنتجات يومية.",
    address: "حي الربوة، الرياض",
    phone: "0533221100",
    lat: 24.73,
    lng: 46.7,
    status: "approved",
    discounts: [
      {
        title: "خصم 10% على الفاتورة كاملة",
        description: "لعملاء التطبيق فقط، بحد أقصى 200 ريال.",
        type: "percent",
        value: 10,
        startOffset: -10,
        endOffset: 4,
        status: "approved",
        views: 512,
      },
      {
        title: "عرض منتصف الأسبوع – انتهى",
        description: "كان على قسم المخبوزات كل ثلاثاء.",
        type: "percent",
        value: 20,
        startOffset: -40,
        endOffset: -3,
        status: "approved",
        views: 214,
      },
    ],
  },
  {
    name: "صالة المسطرة الرياضية",
    owner: "فهد الغامدي",
    category: "رياضة",
    description: "نادٍ رياضي بأجهزة حديثة ومدربين معتمدين.",
    address: "حي المروج، الرياض",
    phone: "0544556677",
    lat: 24.69,
    lng: 46.64,
    status: "approved",
    discounts: [
      {
        title: "اشتراك شهري بـ 199 ريال",
        description: "يشمل جميع الحصص الجماعية والساونا.",
        type: "amount",
        value: 199,
        code: "FIT199",
        startOffset: -7,
        endOffset: 18,
        status: "approved",
        views: 178,
      },
    ],
  },
  {
    name: "عيادة لمعة لطب الأسنان",
    owner: "سارة الزهراني",
    category: "صحة وجمال",
    description: "تنظيف وتبييض وتقويم بأحدث الأجهزة.",
    address: "حي الياسمين، الرياض",
    phone: "0577889900",
    lat: 24.76,
    lng: 46.73,
    status: "pending",
    discounts: [
      {
        title: "تنظيف الأسنان بـ 149 ريال",
        description: "بدلًا من 350 ريال، بانتظار اعتماد الإدارة.",
        type: "amount",
        value: 149,
        startOffset: 0,
        endOffset: 30,
        status: "pending",
        views: 0,
      },
    ],
  },
];

const PENDING_DISCOUNTS: SeedDiscount[] = [
  {
    title: "خصم 35% على الوجبات السريعة",
    description: "عرض جديد بانتظار مراجعة مشرف التطبيق قبل ظهوره للمستخدمين.",
    type: "percent",
    value: 35,
    code: "FAST35",
    startOffset: 0,
    endOffset: 21,
    status: "pending",
    views: 0,
  },
  {
    title: "تخفيض 60% على العطور",
    description: "بانتظار تأكيد صحة العرض من إدارة التطبيق.",
    type: "percent",
    value: 60,
    startOffset: 0,
    endOffset: 14,
    status: "pending",
    views: 0,
  },
];

/** بيانات تجريبية: تصنيفات ومتاجر وخصومات لتجربة التطبيق مباشرة. */
export const run = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("categories").collect();
    if (existing.length > 0) {
      return { seeded: false, message: "البيانات التجريبية موجودة مسبقًا." };
    }

    const now = Date.now();

    // 1) التصنيفات
    const categoryIds = new Map<string, string>();
    for (let i = 0; i < CATEGORIES.length; i += 1) {
      const cat = CATEGORIES[i];
      const id = await ctx.db.insert("categories", {
        name: cat.name,
        emoji: cat.emoji,
        order: i + 1,
        isActive: true,
      });
      categoryIds.set(cat.name, id);
    }

    // 2) تجار تجريبيون
    const owners = new Map<string, string>();
    for (const store of STORES) {
      if (owners.has(store.owner)) continue;
      const id = await ctx.db.insert("users", {
        name: store.owner,
        email: `${store.owner.replace(/\s+/g, ".")}@demo.khasmqareeb.app`,
        role: ROLES.MERCHANT,
        isAnonymous: false,
      });
      owners.set(store.owner, id);
    }

    // 3) المتاجر وخصوماتها
    let storeCount = 0;
    let discountCount = 0;
    for (const store of STORES) {
      const storeId = await ctx.db.insert("stores", {
        ownerId: owners.get(store.owner) as never,
        name: store.name,
        categoryId: categoryIds.get(store.category) as never,
        description: store.description,
        address: store.address,
        phone: store.phone,
        lat: store.lat,
        lng: store.lng,
        status: store.status,
        createdAt: now - DAY * 12,
      });
      storeCount += 1;

      for (const d of store.discounts) {
        await ctx.db.insert("discounts", {
          storeId: storeId as never,
          ownerId: owners.get(store.owner) as never,
          title: d.title,
          description: d.description,
          type: d.type,
          value: d.value,
          code: d.code,
          startDate: now + DAY * d.startOffset,
          endDate: now + DAY * d.endOffset,
          images: [],
          status: d.status === "pending" ? REVIEW_STATUS.PENDING : REVIEW_STATUS.APPROVED,
          views: d.views,
          saves: 0,
          createdAt: now - DAY * 5,
        });
        discountCount += 1;
      }
    }

    // 4) عروض بانتظار مراجعة الإدارة على متجرين قائمين
    const targets = await ctx.db.query("stores").collect();
    const approvedStores = targets.filter((s) => s.status === REVIEW_STATUS.APPROVED);
    for (let i = 0; i < PENDING_DISCOUNTS.length; i += 1) {
      const store = approvedStores[i % approvedStores.length];
      if (!store) break;
      const d = PENDING_DISCOUNTS[i];
      await ctx.db.insert("discounts", {
        storeId: store._id,
        ownerId: store.ownerId,
        title: d.title,
        description: d.description,
        type: d.type,
        value: d.value,
        code: d.code,
        startDate: now + DAY * d.startOffset,
        endDate: now + DAY * d.endOffset,
        images: [],
        status: REVIEW_STATUS.PENDING,
        views: 0,
        saves: 0,
        createdAt: now - DAY,
      });
      discountCount += 1;
    }

    return {
      seeded: true,
      categories: CATEGORIES.length,
      stores: storeCount + 1,
      discounts: discountCount,
      message: "تم تحميل البيانات التجريبية بنجاح.",
    };
  },
});
