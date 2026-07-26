import { describe, expect, it } from "vitest";
import { getAuthSiteOrigin, safeAuthDestination } from "@/lib/auth/redirects";

describe("auth redirects", () => {
  it("solo acepta destinos internos", () => {
    expect(safeAuthDestination("/nueva-contrasena")).toBe("/nueva-contrasena");
    expect(safeAuthDestination("//sitio-externo.test")).toBe("/dashboard");
    expect(safeAuthDestination("https://sitio-externo.test")).toBe("/dashboard");
  });

  it("prioriza la URL canónica configurada", () => {
    expect(getAuthSiteOrigin("http://127.0.0.1:3000", "http://localhost:3000/")).toBe("http://localhost:3000");
  });

  it("usa el origen de la solicitud si no existe configuración válida", () => {
    expect(getAuthSiteOrigin("https://anisuba.test/path", "")).toBe("https://anisuba.test");
  });
});
