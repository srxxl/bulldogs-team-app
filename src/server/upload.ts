import "server-only";
import { randomUUID } from "node:crypto";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export type StoredImage = { url: string } | { error: string };

/** Stores an uploaded image in Vercel Blob (or public/uploads locally). Empty input → null. */
export async function storeImage(file: FormDataEntryValue | null, folder: string): Promise<StoredImage | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  const ext = TYPES[file.type];
  if (!ext) return { error: "Photos need to be JPG, PNG, WebP or AVIF" };
  if (file.size > MAX_BYTES) return { error: "Photos need to be under 5 MB" };

  const name = `${folder}/${randomUUID()}.${ext}`;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(name, file, {
      access: "public",
      contentType: file.type,
    });
    return { url: blob.url };
  }
  if (process.env.NODE_ENV === "production") return { error: "Photo uploads aren't set up yet" };
  const [{ mkdir, writeFile }, path] = await Promise.all([import("node:fs/promises"), import("node:path")]);
  const dest = path.join(process.cwd(), "public", "uploads", name);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, Buffer.from(await file.arrayBuffer()));
  return { url: `/uploads/${name}` };
}
