import { describe, expect, it } from "vitest";
import { sniffImage } from "@/lib/image-sniff";

const bytes = (...values: number[]) => new Uint8Array(values);

describe("sniffImage", () => {
  it("recognises JPEG, PNG and WebP by their first bytes", () => {
    expect(sniffImage(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
    expect(sniffImage(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a))).toBe("image/png");
    expect(sniffImage(bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50))).toBe("image/webp");
  });

  it("refuses everything else, whatever the sender called it", () => {
    expect(sniffImage(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'))).toBeNull();
    expect(sniffImage(new TextEncoder().encode("<html><script>alert(1)</script></html>"))).toBeNull();
    expect(sniffImage(new Uint8Array())).toBeNull();
    expect(sniffImage(bytes(0x52, 0x49, 0x46, 0x46))).toBeNull(); // RIFF but too short to be WebP
  });
});
