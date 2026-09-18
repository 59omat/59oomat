import type { Id } from "@/convex/_generated/dataModel";

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
