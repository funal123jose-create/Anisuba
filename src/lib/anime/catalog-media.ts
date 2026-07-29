export const CATALOG_MEDIA_BUCKET = "anime-media";
export const MAX_CATALOG_IMAGE_BYTES = 5 * 1024 * 1024;

export const CATALOG_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type CatalogImageMimeType = (typeof CATALOG_IMAGE_MIME_TYPES)[number];
export type CatalogMediaKind = "cover" | "banner";

type ValidatedCatalogImage = {
  bytes: Uint8Array;
  extension: "jpg" | "png" | "webp";
  mimeType: CatalogImageMimeType;
};

function hasPngSignature(bytes: Uint8Array) {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  return signature.every((value, index) => bytes[index] === value);
}

function hasJpegSignature(bytes: Uint8Array) {
  return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

function hasWebpSignature(bytes: Uint8Array) {
  return (
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF"
    && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  );
}

export async function validateCatalogImage(file: File): Promise<ValidatedCatalogImage> {
  if (file.size < 1 || file.size > MAX_CATALOG_IMAGE_BYTES) {
    throw new Error("IMAGE_SIZE_INVALID");
  }

  if (!CATALOG_IMAGE_MIME_TYPES.includes(file.type as CatalogImageMimeType)) {
    throw new Error("IMAGE_TYPE_INVALID");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const validSignature = (
    (file.type === "image/png" && hasPngSignature(bytes))
    || (file.type === "image/jpeg" && hasJpegSignature(bytes))
    || (file.type === "image/webp" && hasWebpSignature(bytes))
  );

  if (!validSignature) {
    throw new Error("IMAGE_CONTENT_INVALID");
  }

  const extension = file.type === "image/png"
    ? "png"
    : file.type === "image/webp"
      ? "webp"
      : "jpg";

  return {
    bytes,
    extension,
    mimeType: file.type as CatalogImageMimeType,
  };
}

export function buildCatalogMediaPath({
  extension,
  franchiseId,
  kind,
  userId,
  uniqueId = crypto.randomUUID(),
}: {
  extension: ValidatedCatalogImage["extension"];
  franchiseId: string;
  kind: CatalogMediaKind;
  userId: string;
  uniqueId?: string;
}) {
  return `user-submissions/${userId}/${franchiseId}/${kind}-${uniqueId}.${extension}`;
}
