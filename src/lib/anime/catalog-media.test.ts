import { describe, expect, it } from "vitest";
import {
  buildCatalogMediaPath,
  MAX_CATALOG_IMAGE_BYTES,
  validateCatalogImage,
} from "@/lib/anime/catalog-media";

describe("catalog media", () => {
  it("acepta una imagen PNG cuya firma coincide con su MIME", async () => {
    const file = new File(
      [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])],
      "cover.png",
      { type: "image/png" },
    );

    await expect(validateCatalogImage(file)).resolves.toMatchObject({
      extension: "png",
      mimeType: "image/png",
    });
  });

  it("rechaza archivos disfrazados de imagen", async () => {
    const file = new File(["not-an-image"], "cover.png", { type: "image/png" });
    await expect(validateCatalogImage(file)).rejects.toThrow("IMAGE_CONTENT_INVALID");
  });

  it("rechaza imágenes que superan el límite de 5 MB", async () => {
    const file = new File(
      [new Uint8Array(MAX_CATALOG_IMAGE_BYTES + 1)],
      "huge.webp",
      { type: "image/webp" },
    );
    await expect(validateCatalogImage(file)).rejects.toThrow("IMAGE_SIZE_INVALID");
  });

  it("genera una ruta aislada por usuario y borrador", () => {
    expect(buildCatalogMediaPath({
      extension: "jpg",
      franchiseId: "franchise-id",
      kind: "cover",
      uniqueId: "asset-id",
      userId: "user-id",
    })).toBe("user-submissions/user-id/franchise-id/cover-asset-id.jpg");
  });
});
