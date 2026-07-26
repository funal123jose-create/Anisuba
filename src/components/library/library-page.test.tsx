import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LibraryPage } from "@/components/library/library-page";
import { libraryDemoData } from "@/data/mock/library";

describe("LibraryPage", () => {
  it("presenta el escenario demo aprobado y su total", () => {
    render(<LibraryPage data={libraryDemoData} isDemo />);

    expect(screen.getByRole("heading", { name: "Mi biblioteca" })).toBeInTheDocument();
    expect(screen.getByText("Modo demo")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Todos 146/ })).toBeInTheDocument();
    expect(screen.getAllByRole("article").length).toBeGreaterThan(10);
  });

  it("filtra por estado y permite limpiar los filtros", () => {
    render(<LibraryPage data={libraryDemoData} isDemo />);

    fireEvent.click(screen.getByRole("tab", { name: /Completados 67/ }));
    expect(screen.getByRole("heading", { name: "Código: Arcanum" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Eclipse del Vacío" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Limpiar filtros/ }));
    expect(screen.getByRole("heading", { name: "Eclipse del Vacío" })).toBeInTheDocument();
  });

  it("busca títulos, alterna la vista y cambia favoritos localmente", () => {
    const { container } = render(<LibraryPage data={libraryDemoData} isDemo />);

    fireEvent.change(screen.getByPlaceholderText("Buscar en mi biblioteca..."), { target: { value: "Aurora" } });
    expect(screen.getByRole("heading", { name: "Aurora de Cristal" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Eclipse del Vacío" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Vista en lista" }));
    expect(container.querySelector(".library-cards")).toHaveClass("is-list");

    const favorite = screen.getByRole("button", { name: "Añadir Aurora de Cristal a favoritos" });
    fireEvent.click(favorite);
    expect(favorite).toHaveAttribute("aria-pressed", "true");
  });

  it("incluye el filtro de estado y los metadatos del panel lateral", () => {
    render(<LibraryPage data={libraryDemoData} isDemo />);

    fireEvent.change(screen.getByLabelText("Filtrar por estado"), { target: { value: "paused" } });
    expect(screen.getByRole("heading", { name: "Neón Reverie" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Eclipse del Vacío" })).not.toBeInTheDocument();

    expect(screen.getByText("Hace 2 h")).toBeInTheDocument();
    expect(screen.getAllByText(/\d+%/).length).toBeGreaterThan(0);
  });
});
