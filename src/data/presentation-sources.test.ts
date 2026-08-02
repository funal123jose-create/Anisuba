import { afterEach, describe, expect, it } from "vitest";
import { getHistoryPresentationData } from "./history-source";
import { getProfilePresentationData } from "./profile-source";
import { getStatisticsPresentationData } from "./statistics-source";

const originalHistoryMode = process.env.ANISUBA_HISTORY_DATA_MODE;
const originalStatisticsMode = process.env.ANISUBA_STATISTICS_DATA_MODE;
const originalProfileMode = process.env.ANISUBA_PROFILE_DATA_MODE;

afterEach(() => {
  if (originalHistoryMode === undefined) delete process.env.ANISUBA_HISTORY_DATA_MODE;
  else process.env.ANISUBA_HISTORY_DATA_MODE = originalHistoryMode;
  if (originalStatisticsMode === undefined) delete process.env.ANISUBA_STATISTICS_DATA_MODE;
  else process.env.ANISUBA_STATISTICS_DATA_MODE = originalStatisticsMode;
  if (originalProfileMode === undefined) delete process.env.ANISUBA_PROFILE_DATA_MODE;
  else process.env.ANISUBA_PROFILE_DATA_MODE = originalProfileMode;
});

describe("fuentes de presentación todavía no conectadas", () => {
  it("conservan el contenido demo por defecto aunque el modo global sea live", () => {
    process.env.ANISUBA_DATA_MODE = "live";
    delete process.env.ANISUBA_HISTORY_DATA_MODE;
    delete process.env.ANISUBA_STATISTICS_DATA_MODE;
    delete process.env.ANISUBA_PROFILE_DATA_MODE;

    const history = getHistoryPresentationData();
    const statistics = getStatisticsPresentationData();
    const profile = getProfilePresentationData();

    expect(history.mode).toBe("demo");
    expect(history.data.events.length).toBeGreaterThan(0);
    expect(statistics.mode).toBe("demo");
    expect(statistics.data.metrics.length).toBeGreaterThan(0);
    expect(profile.mode).toBe("demo");
    expect(profile.data.favorites.length).toBeGreaterThan(0);
  });
});
