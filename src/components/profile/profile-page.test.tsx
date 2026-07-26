import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProfilePage } from "@/components/profile/profile-page";
import { profileDemoData } from "@/data/mock/profile";

describe("ProfilePage", () => {
  it("presenta la identidad, métricas y secciones del mockup aprobado", () => {
    render(<ProfilePage data={profileDemoData} isDemo />);

    expect(screen.getByRole("heading", { name: "José Luis" })).toBeInTheDocument();
    expect(screen.getByText("@joseluis_12")).toBeInTheDocument();
    expect(screen.getByText("1,248 h")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Animes favoritos" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Logros" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Resumen de actividad" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Mi biblioteca actual / Favoritos en curso" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Ver todos" })).toHaveLength(4);
    expect(screen.getByText("12 / 24 logros desbloqueados")).toBeInTheDocument();
    expect(screen.getByText("67%")).toBeInTheDocument();
    expect(screen.getByText("Misterio")).toBeInTheDocument();
  });

  it("responde a las acciones del perfil sin mutar datos reales", () => {
    render(<ProfilePage data={profileDemoData} isDemo />);

    fireEvent.click(screen.getByRole("button", { name: "Editar perfil" }));
    expect(screen.getByRole("status")).toHaveTextContent("edición visual");
    expect(screen.getByRole("button", { name: "Vista previa activa" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Más opciones de perfil" }));
    expect(screen.getByRole("button", { name: "Compartir perfil" })).toBeInTheDocument();
  });
});
