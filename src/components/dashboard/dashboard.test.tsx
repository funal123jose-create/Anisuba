import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Dashboard } from "@/components/dashboard/dashboard";
import { dashboardData } from "@/data/mock/dashboard";

describe("Dashboard", () => {
  it("presenta la identidad y el contenido principal del usuario", () => {
    render(<Dashboard data={dashboardData} />);

    expect(screen.getByRole("heading", { name: /(?:Buenos días|Buenas tardes|Buenas noches), José Luis/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Continúa viendo" }).closest(".featured-card")).not.toBeNull();
    expect(screen.getAllByText("Kimetsu no Yaiba").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Ver detalle" })).toHaveAttribute("href", "/anime/eclipse-del-vacio");
    expect(screen.getByLabelText("Resumen de estadísticas")).toBeInTheDocument();
  });

  it("mantiene coherente el total con la distribución por estado", () => {
    const total = dashboardData.statusDistribution.reduce((sum, item) => sum + item.value, 0);
    expect(total).toBe(156);
    expect(dashboardData.metrics[0].value).toBe(String(total));
  });

  it("muestra cantidad y porcentaje en la distribución por estado", () => {
    render(<Dashboard data={dashboardData} />);

    expect(screen.getAllByText((_, element) => element?.tagName === "STRONG" && element.textContent === "12 (8%)").length).toBeGreaterThan(0);
    expect(screen.getAllByText((_, element) => element?.tagName === "STRONG" && element.textContent === "67 (43%)").length).toBeGreaterThan(0);
  });

  it("identifica claramente los datos ficticios cuando el modo demo está activo", () => {
    render(<Dashboard data={dashboardData} isDemo />);

    expect(screen.getByLabelText("Datos de demostración")).toBeInTheDocument();
    expect(screen.getByText("Modo demo")).toBeInTheDocument();
  });

  it("permite resaltar la distribución desde teclado o toque", () => {
    const { container } = render(<Dashboard data={dashboardData} />);
    const watchingLegend = within(container).getByRole("button", { name: "Resaltar Viendo: 12 animes" });

    fireEvent.focus(watchingLegend);
    expect(watchingLegend).toHaveClass("is-active");

    fireEvent.blur(watchingLegend);
    expect(watchingLegend).not.toHaveClass("is-active");

    fireEvent.click(watchingLegend);
    expect(watchingLegend).toHaveClass("is-active");
  });
});
