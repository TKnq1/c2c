import { sniffImage } from "@/lib/image-sniff";

// The client resizes/compresses before submitting (see AvatarUpload), so a
// legitimate upload lands well under this — it's a ceiling against someone
// bypassing that client-side step, not the expected normal size.
const MAX_AVATAR_BYTES = 500 * 1024;

// Only re-encode and save a new image if the user actually picked one — an
// untouched file input still submits an empty File, not null. `avatarUrl:
// null` (vs `undefined`) tells Prisma to explicitly clear the field, for
// the "Remove" button — a plain unchanged form must leave it untouched.
// Lives outside the "use server" action files so it isn't exposed as an
// action endpoint of its own.
export async function processAvatarUpload(
  formData: FormData,
  label: string,
): Promise<{ avatarUrl?: string | null; error?: string }> {
  const avatarFile = formData.get("avatar");
  if (avatarFile instanceof File && avatarFile.size > 0) {
    if (avatarFile.size > MAX_AVATAR_BYTES) {
      return { error: `${label} must be under 500 KB.` };
    }
    // What the file is comes from its first bytes, not from the type the sender names (which also
    // ends up in the stored data URL): JPEG, PNG or WebP, never SVG or anything else.
    const bytes = new Uint8Array(await avatarFile.arrayBuffer());
    const type = sniffImage(bytes);
    if (!type) return { error: `${label} must be a JPEG, PNG or WebP image.` };
    return { avatarUrl: `data:${type};base64,${Buffer.from(bytes).toString("base64")}` };
  }
  if (formData.get("avatarRemove") === "1") {
    return { avatarUrl: null };
  }
  return {};
}
