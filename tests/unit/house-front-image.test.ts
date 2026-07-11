import { describe, expect, it } from "vitest";
import {
  HOUSE_FRONT_IMAGE_MAX_BYTES,
  estimateBase64Bytes,
  validateHouseFrontImageDataUrl,
} from "@/lib/house-front-image";

function buildDataUrl(byteLength: number) {
  const base64 = Buffer.alloc(byteLength, 1).toString("base64");
  return `data:image/jpeg;base64,${base64}`;
}

describe("house front image", () => {
  it("estimates the payload size from the base64 data url", () => {
    const dataUrl = buildDataUrl(1024);
    expect(estimateBase64Bytes(dataUrl)).toBe(1024);
  });

  it("accepts a compacted jpeg payload within the configured limit", () => {
    expect(validateHouseFrontImageDataUrl(buildDataUrl(32 * 1024))).toBeNull();
  });

  it("rejects unsupported payload formats", () => {
    expect(validateHouseFrontImageDataUrl("data:image/png;base64,abc")).toContain("JPEG");
  });

  it("rejects payloads larger than the configured limit", () => {
    expect(validateHouseFrontImageDataUrl(buildDataUrl(HOUSE_FRONT_IMAGE_MAX_BYTES + 1024))).toContain("150 KB");
  });
});
