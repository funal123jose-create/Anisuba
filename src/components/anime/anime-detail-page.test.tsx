import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AnimeDetailPage } from "@/components/anime/anime-detail-page";

describe("AnimeDetailPage", () => {
  it("presenta la ficha aprobada y la disponibilidad oficial", () => {
    render(<AnimeDetailPage isDemo />);
    expect(screen.getByRole("heading", { name: "Eclipse del Vacío" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sinopsis" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Dónde ver" })).toBeInTheDocument();
    expect(screen.getByText("Colombia")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Crunchyroll/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Regresar" })).toHaveAttribute("href", "/dashboard");
  });

  it("permite actualizar progreso desde el mockup 16, puntuación y pestaña localmente", () => {
    render(<AnimeDetailPage isDemo />);
    fireEvent.click(screen.getByRole("button", { name: "Actualizar progreso" }));
    expect(screen.getByRole("dialog", { name: "Actualización de progreso" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sumar episodio en actualización" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar progreso" }));
    expect(screen.getByRole("button", { name: "Progreso actualizado" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Puntuar 8 de 10" }));
    expect(screen.getByRole("dialog", { name: "Registro de puntuación" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Guardar puntuación" }));
    expect(screen.getByLabelText("Puntuación 8 de 10")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Episodios" }));
    expect(screen.getByRole("heading", { name: "Episodios" })).toBeInTheDocument();
    expect(screen.getByText(/registra tu avance/)).toBeInTheDocument();
  });

  it("permite publicar una reseña privada desde el mockup 18", () => {
    render(<AnimeDetailPage isDemo />);
    fireEvent.click(screen.getByRole("button", { name: "Reseñas" }));
    expect(screen.getByRole("dialog", { name: "Escribe tu reseña" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Agregar etiqueta" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Calificar reseña con 8" }));
    fireEvent.click(screen.getByRole("button", { name: "Marcar reseña como spoiler" }));
    fireEvent.click(screen.getByRole("button", { name: "Publicar reseña" }));
    expect(screen.getByRole("status")).toHaveTextContent("Reseña guardada en modo demo");
  });

  it("abre el cambio de estado desde la actualización de progreso", () => {
    render(<AnimeDetailPage isDemo />);
    fireEvent.click(screen.getByRole("button", { name: "Actualizar progreso" }));
    const changeStatus = screen.getByText("Cambiar estado").closest("button");
    expect(changeStatus).not.toBeNull();
    fireEvent.click(changeStatus!);
    expect(screen.getByRole("dialog", { name: "Cambio de estado" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Esperando nueva temporada/ }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar estado" }));
    expect(screen.queryByRole("dialog", { name: "Cambio de estado" })).not.toBeInTheDocument();
  });

  it("confirma abandono antes de cambiar el estado", () => {
    render(<AnimeDetailPage isDemo />);
    fireEvent.click(screen.getByRole("button", { name: "Actualizar progreso" }));
    fireEvent.click(screen.getByText("Cambiar estado").closest("button")!);
    fireEvent.click(screen.getByRole("button", { name: /Abandonado/ }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar estado" }));
    expect(screen.getByRole("dialog", { name: "¿Abandonar este anime?" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar abandono" }));
    expect(screen.queryByRole("dialog", { name: "¿Abandonar este anime?" })).not.toBeInTheDocument();
  });

  it("muestra la confirmación antes de eliminar el anime", () => {
    render(<AnimeDetailPage isDemo />);
    fireEvent.click(screen.getByRole("button", { name: "Eliminar de mi biblioteca" }));
    expect(screen.getByRole("dialog", { name: "¿Eliminar de tu biblioteca?" })).toBeInTheDocument();
  });
});
