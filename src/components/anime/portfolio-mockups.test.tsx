import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AddAnimePage } from "@/components/anime/add-anime-page";
import { AnimeEditPage } from "@/components/anime/anime-edit-page";
import { ManualAnimePage } from "@/components/anime/manual-anime-page";
import { SeasonManagementPage } from "@/components/anime/season-management-page";
import { PublicProfilePage } from "@/components/profile/public-profile-page";
import { TrackingPage } from "@/components/tracking/tracking-page";
import { InterfaceStatesPage } from "@/components/ui/interface-states-page";

describe("Mockups 19 al 23", () => {
  it("presenta el perfil público y sus pestañas", () => {
    render(<PublicProfilePage />);
    expect(screen.getByRole("heading", { name: "José Luis" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /joseluis#9873/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /youtube.com/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Listas" }));
    expect(screen.getByRole("heading", { name: "Listas" })).toBeInTheDocument();
  });

  it("filtra el seguimiento por estado", () => {
    render(<TrackingPage />);
    expect(screen.getByRole("heading", { name: "Mi seguimiento" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Actualizar progreso" })).toHaveLength(4);
    expect(screen.getAllByRole("link", { name: "Ver detalle" }).length).toBeGreaterThan(0);
    const gardensBefore = screen.getAllByText("Jardín de los Recuerdos").length;
    fireEvent.click(screen.getByRole("button", { name: "Ver más de Viendo actualmente" }));
    expect(screen.getAllByText("Jardín de los Recuerdos").length).toBeGreaterThan(gardensBefore);
    fireEvent.click(screen.getByRole("button", { name: /Planeo ver28/ }));
    expect(screen.getByRole("heading", { name: /Planeo ver/ })).toBeInTheDocument();
  });

  it("agrega un resultado API en modo demo", () => {
    render(<AddAnimePage />);
    expect(screen.getByRole("link", { name: "Registro manual" })).toHaveAttribute("href", "/agregar-anime/manual");
    expect(screen.getByText("Jikan API (MyAnimeList)")).toBeInTheDocument();
    expect(screen.getByText("Abr 6, 2024 – Sep 21, 2024")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Agregar a favoritos" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Agregar a mi biblioteca" }));
    expect(screen.getByRole("button", { name: "Agregado a mi biblioteca" })).toBeInTheDocument();
  });

  it("guarda un borrador manual localmente", () => {
    render(<ManualAnimePage />);
    fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));
    expect(screen.getByRole("status")).toHaveTextContent("Borrador guardado");
  });

  it("presenta la edición administrativa y guarda cambios en modo demo", () => {
    render(<AnimeEditPage />);
    expect(screen.getByRole("heading", { name: "Editar anime" })).toBeInTheDocument();
    expect(screen.getByText("Método de registro")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Desplegar géneros" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Desplegar estudios" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(screen.getByRole("status")).toHaveTextContent("Cambios guardados");
  });

  it("filtra la gestión de temporadas", () => {
    render(<SeasonManagementPage />);
    expect(screen.getByRole("heading", { name: "Eclipse del Vacío" })).toBeInTheDocument();
    expect(screen.getByText("Total episodios")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Anime guardado" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Películas" }));
    expect(screen.getByRole("heading", { name: "Película" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Temporada 1" })).not.toBeInTheDocument();
  });

  it("presenta los seis estados reutilizables de interfaz", () => {
    render(<InterfaceStatesPage />);
    expect(screen.getByRole("heading", { name: "Tu biblioteca está vacía" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ups, algo salió mal" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Aún no hay datos suficientes" })).toBeInTheDocument();
  });
});
