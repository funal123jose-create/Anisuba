import { describe, expect, it } from "vitest";
import { getAuthSiteOrigin, safeAuthDestination } from "@/lib/auth/redirects";

describe("auth redirects", () => {
  it("solo acepta destinos internos", () => {
    expect(safeAuthDestination("/nueva-contrasena")).toBe("/nueva-contrasena");
    expect(safeAuthDestination("//sitio-externo.test")).toBe("/dashboard");
    expect(safeAuthDestination("https://sitio-externo.test")).toBe("/dashboard");
  });

  it("prioriza la URL canónica de producción configurada", () => {
    expect(getAuthSiteOrigin("https://preview.vercel.app", "https://anisuba.vercel.app/"))
      .toBe("https://anisuba.vercel.app");
  });

  it("impide que una configuración local contamine una solicitud de producción", () => {
    expect(getAuthSiteOrigin("https://anisuba.vercel.app", "http://localhost:3000/"))
      .toBe("https://anisuba.vercel.app");
  });

  it("usa la URL de producción de Vercel si faltan los otros orígenes", () => {
    expect(getAuthSiteOrigin(null, "", "anisuba.vercel.app"))
      .toBe("https://anisuba.vercel.app");
  });

  it("usa el origen de la solicitud si no existe configuración válida", () => {
    expect(getAuthSiteOrigin("https://anisuba.test/path", "")).toBe("https://anisuba.test");
  });
});
