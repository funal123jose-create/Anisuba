import { describe, expect, it } from "vitest";
import { registerSchema, verificationSchema } from "@/lib/auth/validation";

describe("validación de autenticación", () => {
  it("normaliza el usuario y acepta un registro completo", () => {
    const result = registerSchema.safeParse({
      firstName: "José",
      lastName: "Luis",
      email: "jose@example.com",
      username: "Jose_Anime",
      birthDate: "1995-06-14",
      password: "AniSuba!2026",
      confirmPassword: "AniSuba!2026",
      terms: "on",
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.username).toBe("jose_anime");
  });

  it("rechaza códigos que no tengan seis dígitos", () => {
    expect(verificationSchema.safeParse({ email: "jose@example.com", token: "12345" }).success).toBe(false);
  });
});
