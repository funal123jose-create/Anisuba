import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminPage } from "@/components/admin/admin-page";
import { adminDemoData } from "@/data/mock/admin";

describe("AdminPage", () => {
  it("presenta las métricas y áreas operativas del mockup administrativo", () => {
    render(<AdminPage data={adminDemoData} isDemo />);

    expect(screen.getByRole("heading", { name: "Panel de Administración" })).toBeInTheDocument();
    expect(screen.getAllByText("24,812")).toHaveLength(2);
    expect(screen.getByRole("heading", { name: "Usuarios recientes" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Alertas de calidad de datos" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Estado de sincronizaciones" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Salud de integraciones API" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Accesos rápidos de catálogo" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Acciones de administración" })).toBeInTheDocument();
    expect(screen.getByText("3M")).toBeInTheDocument();
    expect(screen.getByText("1.0%")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Usuarios: 2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Requests: 45" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Errores: 20%" })).toBeInTheDocument();
  });

  it("mantiene las acciones administrativas en modo demostración", () => {
    render(<AdminPage data={adminDemoData} isDemo />);

    fireEvent.click(screen.getByRole("button", { name: /Gestionar animes/i }));
    expect(screen.getByRole("status")).toHaveTextContent("Vista demo: Gestionar animes");

    fireEvent.click(screen.getByRole("button", { name: /Última actualización/i }));
    expect(screen.getByRole("button", { name: /Última actualización: ahora/i })).toBeInTheDocument();
  });
});
