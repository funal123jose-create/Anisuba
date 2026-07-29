import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SettingsPage } from "@/components/settings/settings-page";

const props = {
  displayName: "José Luis",
  username: "joseluis12",
  email: "joseluis12@email.com",
  avatarUrl: "/images/profile-avatar-v1.png",
  isDemo: true,
};

describe("SettingsPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });
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

  it("analiza una exportación real antes de importar MyAnimeList", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      filename: "animelist.xml.gz",
      summary: {
        total: 191,
        duplicates: 5,
        ready: 186,
        matched: 186,
        unresolved: 0,
        counts: { completed: 101, dropped: 0, paused: 27, plan_to_watch: 62, watching: 1 },
      },
      items: [{
        malId: 25397,
        title: "Absolute Duo",
        status: "completed",
        watchedEpisodes: 12,
        totalEpisodes: 12,
        score: 8,
        alreadyCatalogued: false,
        resolution: "matched",
        match: {
          anilistId: 101,
          title: "Absolute Duo",
          format: "TV",
          episodes: 12,
          coverUrl: "https://img.example/absolute-duo.jpg",
          seasonYear: 2015,
        },
      }],
    }), { status: 200 })));
    render(<SettingsPage {...props} />);

    fireEvent.click(screen.getByRole("button", { name: /Importar biblioteca/ }));
    expect(screen.getByRole("dialog", { name: "Importar desde MyAnimeList" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Archivo XML o XML.GZ/), {
      target: { files: [new File(["gzip"], "animelist.xml.gz", { type: "application/gzip" })] },
    });
    expect(await screen.findByText("191")).toBeInTheDocument();
    const reviewButton = screen.getByRole("button", { name: /Continuar a revisión/ });
    expect(reviewButton).toBeEnabled();
    fireEvent.click(reviewButton);
    expect(screen.getByText("Absolute Duo")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Importar Absolute Duo" })).toBeChecked();
  });
});
