import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NotificationsPage } from "@/components/notifications/notifications-page";
import { notificationsDemoData } from "@/data/mock/notifications";

describe("NotificationsPage", () => {
  it("presenta el centro de notificaciones aprobado", () => {
    render(<NotificationsPage data={notificationsDemoData} isDemo />);
    expect(screen.getByRole("heading", { name: "Notificaciones" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Resumen de notificaciones" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Preferencias rápidas" })).toBeInTheDocument();
    expect(screen.getAllByText("Nuevo episodio disponible")).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Marcar como leída" })).toHaveLength(notificationsDemoData.items.length);
  });

  it("filtra, marca lecturas y cambia preferencias", () => {
    render(<NotificationsPage data={notificationsDemoData} isDemo />);
    fireEvent.click(screen.getByRole("button", { name: /Nuevas temporadas1/ }));
    expect(screen.getByText("Nueva temporada")).toBeInTheDocument();
    expect(screen.queryByText("Actualización del sistema")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Marcar como leída" }));
    expect(screen.getByText("2", { selector: ".notification-summary-value strong" })).toBeInTheDocument();

    const recommendations = screen.getByRole("button", { name: "Activar Recomendaciones" });
    fireEvent.click(recommendations);
    expect(recommendations).toHaveAttribute("aria-pressed", "true");
  });
});
