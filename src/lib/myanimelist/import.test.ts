import { gzipSync } from "node:zlib";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { parseMyAnimeListExport } from "./import";

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<myanimelist>
  <anime>
    <series_animedb_id>123</series_animedb_id>
    <series_title><![CDATA[Anime & Test]]></series_title>
    <series_type>TV</series_type>
    <series_episodes>12</series_episodes>
    <my_watched_episodes>4</my_watched_episodes>
    <my_start_date>2026-01-02</my_start_date>
    <my_finish_date>0000-00-00</my_finish_date>
    <my_score>8</my_score>
    <my_status>Watching</my_status>
  </anime>
  <anime>
    <series_animedb_id>456</series_animedb_id>
    <series_title><![CDATA[Anime completo]]></series_title>
    <series_type>OVA</series_type>
    <series_episodes>3</series_episodes>
    <my_watched_episodes>0</my_watched_episodes>
    <my_score>10</my_score>
    <my_status>Completed</my_status>
  </anime>
</myanimelist>`;

describe("parseMyAnimeListExport", () => {
  it("lee XML.GZ y normaliza estado, progreso y fechas", () => {
    const entries = parseMyAnimeListExport(gzipSync(xml), "animelist.xml.gz");
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      malId: 123,
      title: "Anime & Test",
      status: "watching",
      watchedEpisodes: 4,
      startDate: "2026-01-02",
      finishDate: null,
    });
    expect(entries[1]).toMatchObject({
      malId: 456,
      status: "completed",
      watchedEpisodes: 3,
      totalEpisodes: 3,
    });
  });
});
