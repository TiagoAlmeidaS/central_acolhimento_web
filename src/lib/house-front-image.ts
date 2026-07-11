export const HOUSE_FRONT_IMAGE_MAX_DIMENSION = 768;
export const HOUSE_FRONT_IMAGE_TARGET_BYTES = 120 * 1024;
export const HOUSE_FRONT_IMAGE_MAX_BYTES = 150 * 1024;

const HOUSE_FRONT_IMAGE_PREFIX = /^data:image\/(?:jpeg|jpg);base64,/i;

export function estimateBase64Bytes(dataUrl: string) {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

export function validateHouseFrontImageDataUrl(dataUrl: string | null | undefined) {
  if (!dataUrl) {
    return null;
  }

  if (!HOUSE_FRONT_IMAGE_PREFIX.test(dataUrl)) {
    return "A foto da frente da casa deve ser enviada em JPEG compactado.";
  }

  if (estimateBase64Bytes(dataUrl) > HOUSE_FRONT_IMAGE_MAX_BYTES) {
    return "A foto da frente da casa excede o limite de 150 KB apos a compressao.";
  }

  return null;
}
