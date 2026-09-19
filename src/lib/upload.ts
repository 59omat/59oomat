import type { Id } from "@/convex/_generated/dataModel";
import {
  isSupabaseConfigured,
  uploadPublicImage,
} from "@/lib/supabase";

/** يرفع صورة إلى مخزن Convex ويعيد معرّف الملف. */
export async function uploadImage(
  file: File,
  generateUploadUrl: () => Promise<string>,
): Promise<Id<"_storage">> {
  const postUrl = await generateUploadUrl();
  const result = await fetch(postUrl, {
    method: "POST",
    headers: { "Content-Type": file.type || "image/jpeg" },
    body: file,
  });
  if (!result.ok) throw new Error("تعذّر رفع الصورة، حاول مرة أخرى.");
  const { storageId } = (await result.json()) as { storageId: Id<"_storage"> };
  return storageId;
}

export async function uploadImages(
  files: FileList | File[],
  generateUploadUrl: () => Promise<string>,
): Promise<Id<"_storage">[]> {
  const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
  const ids: Id<"_storage">[] = [];
  for (const file of list) {
    ids.push(await uploadImage(file, generateUploadUrl));
  }
  return ids;
}

export type UploadedOfferImages = {
  /** معرّفات مفاتيح المخزن في Convex (تستخدمها قاعدة البيانات للصور). */
  ids: Id<"_storage">[];
  /** رابط عام من Supabase Storage لصورة الغلاف، إن كانت Supabase مضبوطة. */
  coverUrl: string | null;
};

/**
 * يرفع صور العرض إلى مخزن Convex (كما كان)، وإذا كانت مفاتيح Supabase مضبوطة
 * يرفع أيضًا صورة الغلاف إلى حاوية Supabase العامة ليصبح للعرض رابط CDN سريع.
 * أي فشل في Supabase لا يوقف الرفع، إذ يبقى Convex هو المسار الأساسي.
 */
export async function uploadOfferImages(
  files: FileList | File[],
  generateUploadUrl: () => Promise<string>,
): Promise<UploadedOfferImages> {
  const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
  const ids = await uploadImages(list, generateUploadUrl);

  let coverUrl: string | null = null;
  if (isSupabaseConfigured && list.length > 0) {
    try {
      coverUrl = await uploadPublicImage(list[0]);
    } catch (error) {
      console.warn("[supabase] تعذّر رفع صورة الغلاف:", error);
    }
  }

  return { ids, coverUrl };
}
