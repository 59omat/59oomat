import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * تكامل Supabase — يُستخدم لتخزين صور العروض على حاوية عامة (Storage/CDN).
 * قاعدة البيانات والمصادقة تبقى على Convex، لذا التطبيق يعمل كالمعتاد إن لم
 * تُضبط المفاتيح (يعود تلقائيًا إلى مخزن Convex).
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** اسم الحاوية العامة لصور العروض في Supabase Storage. */
export const OFFER_IMAGES_BUCKET = "offer-images";

/** هل أُضيف مفتاحا Supabase؟ */
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

/**
 * يرفع صورة إلى حاوية Supabase العامة ويعيد رابطها العام،
 * أو `null` إذا لم تكن مفاتيح Supabase مضبوطة.
 */
export async function uploadPublicImage(
  file: File,
  folder = "offers",
): Promise<string | null> {
  if (!supabase) return null;

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(OFFER_IMAGES_BUCKET)
    .upload(path, file, {
      cacheControl: "31536000",
      upsert: false,
      contentType: file.type || "image/jpeg",
    });

  if (error) {
    throw new Error(`تعذّر رفع الصورة إلى Supabase: ${error.message}`);
  }

  const { data } = supabase.storage
    .from(OFFER_IMAGES_BUCKET)
    .getPublicUrl(path);
  return data.publicUrl;
}
