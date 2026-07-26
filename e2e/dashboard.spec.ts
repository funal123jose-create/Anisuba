import { expect, test } from "@playwright/test";

test("protege el dashboard para visitantes", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);
  await expect(page.getByRole("heading", { name: "Inicia sesión" })).toBeVisible();
});

test("protege la biblioteca para visitantes", async ({ page }) => {
  await page.goto("/biblioteca");

  await expect(page).toHaveURL(/\/login\?next=%2Fbiblioteca/);
});

test("protege explorar para visitantes", async ({ page }) => {
  await page.goto("/explorar");

  await expect(page).toHaveURL(/\/login\?next=%2Fexplorar/);
});

test("protege favoritos para visitantes", async ({ page }) => {
  await page.goto("/favoritos");

  await expect(page).toHaveURL(/\/login\?next=%2Ffavoritos/);
});

test("protege historial para visitantes", async ({ page }) => {
  await page.goto("/historial");

  await expect(page).toHaveURL(/\/login\?next=%2Fhistorial/);
});

test("protege estadísticas para visitantes", async ({ page }) => {
  await page.goto("/estadisticas");

  await expect(page).toHaveURL(/\/login\?next=%2Festadisticas/);
});

test("protege notificaciones para visitantes", async ({ page }) => {
  await page.goto("/notificaciones");

  await expect(page).toHaveURL(/\/login\?next=%2Fnotificaciones/);
});

test("protege perfil para visitantes", async ({ page }) => {
  await page.goto("/perfil");

  await expect(page).toHaveURL(/\/login\?next=%2Fperfil/);
});

test("protege configuración para visitantes", async ({ page }) => {
  await page.goto("/configuracion");

  await expect(page).toHaveURL(/\/login\?next=%2Fconfiguracion/);
});

test("protege el panel administrativo para visitantes", async ({ page }) => {
  await page.goto("/admin");

  await expect(page).toHaveURL(/\/login\?next=%2Fadmin/);
});

test("la pantalla de acceso no genera desplazamiento horizontal", async ({ page }) => {
  await page.goto("/login");
  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(hasHorizontalOverflow).toBe(false);
});

test("presenta el acceso adaptado en móvil", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Verificación exclusiva del proyecto móvil");
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Inicia sesión" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Iniciar sesión" })).toBeVisible();
});

test("un enlace inválido permite reiniciar la recuperación sin entrar al dashboard", async ({ page }) => {
  await page.goto("/auth/complete?error=callback&next=/nueva-contrasena");

  await expect(page.getByRole("heading", { name: "El enlace no pudo verificarse" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Solicitar un enlace nuevo" })).toHaveAttribute(
    "href",
    "/recuperar-contrasena",
  );
  await expect(page).toHaveURL(/\/auth\/complete/);
});
