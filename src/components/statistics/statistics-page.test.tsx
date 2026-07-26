import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatisticsPage } from "@/components/statistics/statistics-page";
import { statisticsDemoData } from "@/data/mock/statistics";

describe("StatisticsPage", () => {
  it("presenta los indicadores y paneles del mockup aprobado", () => {
    render(<StatisticsPage data={statisticsDemoData} isDemo />);
    expect(screen.getByRole("heading", { name: "Estadísticas" })).toBeInTheDocument();
    expect(screen.getByText("347")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Top géneros" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Insight personal" })).toBeInTheDocument();
  });

  it("permite cambiar el periodo visible", () => {
    render(<StatisticsPage data={statisticsDemoData} isDemo />);
    const threeMonths = screen.getByRole("button", { name: "3 meses" });
    fireEvent.click(threeMonths);
    expect(threeMonths).toHaveAttribute("aria-pressed", "true");
  });
});
