import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SettingsPage } from "@/components/settings/settings-page";

const props = {
  displayName: "José Luis",
  username: "joseluis12",
  email: "joseluis12@email.com",
  avatarUrl: "/images/profile-avatar-v1.png",
  isDemo: true,
};

describe("SettingsPage", () => {
  it("presenta los seis módulos del mockup aprobado", () => {
    render(<SettingsPage {...props} />);

    expect(screen.getByRole("heading", { name: "Configuración" })).toBeInTheDocument();
    for (const title of ["Cuenta", "Apariencia", "Notificaciones", "Privacidad", "Integraciones", "Seguridad"]) {
      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    }
    expect(screen.getByDisplayValue("José Luis")).toBeInTheDocument();
    expect(screen.getByDisplayValue("joseluis12@email.com")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /País o región/ })).toHaveValue("CO");
    expect(screen.getByText(/plataformas oficiales disponibles/)).toBeInTheDocument();
  });

  it("permite cambiar preferencias solo en la vista local", () => {
    render(<SettingsPage {...props} />);

    const friendsToggle = screen.getByRole("button", { name: "Activar Actividad de amigos" });
    fireEvent.click(friendsToggle);
    expect(friendsToggle).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: /Claro/ }));
    expect(screen.getByRole("button", { name: /Claro/ })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(screen.getByRole("button", { name: "Cambios guardados" })).toBeInTheDocument();
  });

  it("abre la previsualización demo para importar MyAnimeList", () => {
    render(<SettingsPage {...props} />);

    fireEvent.click(screen.getByRole("button", { name: /Importar biblioteca/ }));
    expect(screen.getByRole("dialog", { name: "Importar desde MyAnimeList" })).toBeInTheDocument();
    expect(screen.getByText("146")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Continuar a previsualización/ }));
    expect(screen.getByRole("status")).toHaveTextContent(/Mockup 30/);
  });
});
