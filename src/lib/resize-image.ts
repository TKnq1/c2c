// Images are stored as data URIs directly in the database (see AGENTS.md /
// session notes) — there's no separate object storage yet — so an unresized
// upload ships in full on every page that renders it. A raw phone photo can
// be several MB; this resizes to fit within maxDimension and re-encodes as
// JPEG before it's ever submitted, typically landing in the tens to low
// hundreds of KB instead of several MB. Drawing to canvas also sidesteps
// HEIC (iPhones' default format): most browsers can't display a HEIC <img>
// at all, but canvas re-encoding always outputs a normal, universally-
// supported JPEG.
export function resizeImageFile(
  file: File,
  { maxDimension = 512, quality = 0.85 }: { maxDimension?: number; quality?: number } = {},
): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Couldn't process that image."));
          resolve({ blob, dataUrl: canvas.toDataURL("image/jpeg", quality) });
        },
        "image/jpeg",
        quality,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Couldn't read that image — try a JPEG or PNG."));
    };
    img.src = objectUrl;
  });
}
