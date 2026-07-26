import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FavoritesPage } from "@/components/favorites/favorites-page";
import { favoritesDemoData } from "@/data/mock/favorites";

describe("FavoritesPage", () => {
  it("presenta el resumen y ranking del mockup aprobado", () => {
    render(<FavoritesPage data={favoritesDemoData} isDemo />);

    expect(screen.getByRole("heading", { name: "Mis Favoritos" })).toBeInTheDocument();
    expect(screen.getAllByText("24")).toHaveLength(2);
    expect(screen.getByText("8.62")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tu ranking personal" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Top 5 personales" })).toBeInTheDocument();
  });

  it("filtra, ordena y restablece la colección", () => {
    render(<FavoritesPage data={favoritesDemoData} isDemo />);

    fireEvent.change(screen.getByLabelText("Filtrar favoritos por género"), { target: { value: "Romance" } });
    expect(screen.getByRole("heading", { name: "Violet Memory" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Eclipse of the Abyss" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(screen.getByRole("heading", { name: "Eclipse of the Abyss" })).toBeInTheDocument();
  });

  it("permite retirar un favorito solo en la presentación local", () => {
    render(<FavoritesPage data={favoritesDemoData} isDemo />);

    fireEvent.click(screen.getByRole("button", { name: "Quitar Eclipse of the Abyss de favoritos demo" }));
    expect(screen.queryByRole("heading", { name: "Eclipse of the Abyss" })).not.toBeInTheDocument();
    expect(screen.getByText("Mostrando 1 a 5 de 24 favoritos")).toBeInTheDocument();
  });

  it("destaca el segmento del anillo al interactuar con su leyenda", () => {
    const { container } = render(<FavoritesPage data={favoritesDemoData} isDemo />);
    const actionLegend = screen.getByRole("button", { name: /Acción8 \(33%\)/ });

    fireEvent.mouseEnter(actionLegend);
    expect(container.querySelector(".favorites-donut strong")).toHaveTextContent("8");

    fireEvent.mouseLeave(actionLegend);
    expect(container.querySelector(".favorites-donut strong")).toHaveTextContent("24");
  });
});
