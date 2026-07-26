import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExplorePage } from "@/components/explore/explore-page";
import { exploreDemoData } from "@/data/mock/explore";

describe("ExplorePage", () => {
  it("presenta el catálogo demo y sus bloques ejecutivos", () => {
    render(<ExplorePage data={exploreDemoData} isDemo />);

    expect(screen.getByRole("heading", { name: "Explorar" })).toBeInTheDocument();
    expect(screen.getByText("Modo demo")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tendencias" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Populares" })).toBeInTheDocument();
    expect(screen.getByText("8.46")).toBeInTheDocument();
  });

  it("filtra el catálogo y permite restablecer los controles", () => {
    const { container } = render(<ExplorePage data={exploreDemoData} isDemo />);

    fireEvent.change(screen.getByLabelText("Filtrar por género"), { target: { value: "Ciencia ficción" } });
    expect(container.querySelectorAll(".explore-content-section:last-of-type .explore-card")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Filtros" }));
    fireEvent.click(screen.getByRole("button", { name: "Restablecer" }));
    expect(container.querySelectorAll(".explore-content-section:last-of-type .explore-card")).toHaveLength(6);
  });

  it("cambia el destacado y mantiene las adiciones dentro del modo demo", () => {
    render(<ExplorePage data={exploreDemoData} isDemo />);

    fireEvent.click(screen.getByRole("button", { name: "Destacado siguiente" }));
    expect(screen.getByRole("heading", { level: 2, name: "Vórtice Celestial" })).toBeInTheDocument();

    const addButton = screen.getAllByRole("button", { name: /Añadir .* a la selección demo/ })[0];
    fireEvent.click(addButton);
    expect(addButton).toHaveAttribute("aria-pressed", "true");
  });
});
