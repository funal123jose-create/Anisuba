import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HistoryPage } from "@/components/history/history-page";
import { historyDemoData } from "@/data/mock/history";

describe("HistoryPage", () => {
  it("presenta la actividad y los indicadores aprobados", () => {
    render(<HistoryPage data={historyDemoData} isDemo />);
    expect(screen.getByRole("heading", { name: "Historial" })).toBeInTheDocument();
    expect(screen.getByText("48")).toBeInTheDocument();
    expect(screen.getAllByText("176").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Resumen de actividad" })).toBeInTheDocument();
  });

  it("filtra por tipo y búsqueda", () => {
    render(<HistoryPage data={historyDemoData} isDemo />);
    fireEvent.click(screen.getByRole("button", { name: "Favoritos" }));
    expect(screen.getByText("Marcaste como favorito")).toBeInTheDocument();
    expect(screen.queryByText("Agregaste a tu biblioteca")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Buscar en el historial"), { target: { value: "sin coincidencias" } });
    expect(screen.getByRole("heading", { name: "No encontramos actividad" })).toBeInTheDocument();
  });

  it("agrupa el tracking por fecha y conecta la leyenda con el anillo", () => {
    const { container } = render(<HistoryPage data={historyDemoData} isDemo />);
    const days = Array.from(container.querySelectorAll<HTMLElement>(".history-day"));
    const firstDayTones = Array.from(days[0].querySelectorAll<HTMLElement>(".history-event")).map((event) => event.style.getPropertyValue("--timeline-tone"));
    const secondDayTone = days[1].querySelector<HTMLElement>(".history-event")?.style.getPropertyValue("--timeline-tone");

    expect(new Set(firstDayTones).size).toBe(1);
    expect(secondDayTone).not.toBe(firstDayTones[0]);

    fireEvent.mouseEnter(screen.getByRole("button", { name: /Agregados45/ }));
    expect(container.querySelector(".history-donut strong")).toHaveTextContent("45");
    expect(container.querySelector(".history-donut small")).toHaveTextContent("Agregados");
  });
});
