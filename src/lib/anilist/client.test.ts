import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getAniListFranchiseById,
  getAniListRelationSnapshots,
  searchAniListAnime,
} from "./client";

function media(id: number, title: string, year: number, relations: unknown[] = []) {
  return {
    id,
    idMal: id + 1000,
    title: { english: title, romaji: title, native: null },
    description: `${title} synopsis`,
    format: "TV",
    status: "FINISHED",
    season: "SPRING",
    seasonYear: year,
    episodes: 12,
    duration: 24,
    startDate: { year, month: 4, day: 1 },
    averageScore: 80,
    popularity: 100,
    genres: ["Action"],
    siteUrl: `https://anilist.co/anime/${id}`,
    coverImage: { extraLarge: `https://img.example/${id}.jpg` },
    bannerImage: null,
    studios: { nodes: [{ name: "Studio" }] },
    relations: { edges: relations },
  };
}

describe("getAniListFranchiseById", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("recorre secuelas y las ordena cronológicamente", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        data: {
          Page: {
            media: [
              media(10, "Temporada 1", 2020, [{
                relationType: "SEQUEL",
                node: { id: 20, type: "ANIME", format: "TV", startDate: { year: 2022, month: 4, day: 1 } },
              }]),
            ],
          },
        },
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        data: { Page: { media: [media(20, "Temporada 2", 2022)] } },
      }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await getAniListFranchiseById(10);
    expect(result.map((entry) => entry.title)).toEqual(["Temporada 1", "Temporada 2"]);
    expect(result[1]).toMatchObject({
      relationType: "SEQUEL",
      startDate: "2022-04-01",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("searchAniListAnime", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("omite formato y año cuando Tipo: Todo no tiene filtros", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: {
        Page: {
          pageInfo: { currentPage: 1, hasNextPage: false, total: 1 },
          media: [media(10, "Anime mixto", 2024)],
        },
      },
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await searchAniListAnime({ query: "Anime mixto" });
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(request.body)) as {
      query: string;
      variables: Record<string, unknown>;
    };

    expect(result.results).toHaveLength(1);
    expect(body.query).not.toContain("format:");
    expect(body.query).not.toContain("seasonYear:");
    expect(body.variables).not.toHaveProperty("format");
    expect(body.variables).not.toHaveProperty("seasonYear");
  });
});

describe("getAniListRelationSnapshots", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("deduplica IDs y conserva solo relaciones útiles para el tracking", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: {
        Page: {
          media: [media(10, "Temporada 1", 2020, [
            {
              relationType: "SEQUEL",
              node: {
                id: 20,
                type: "ANIME",
                format: "TV",
                startDate: { year: 2022, month: 4, day: 1 },
              },
            },
            {
              relationType: "CHARACTER",
              node: {
                id: 30,
                type: "ANIME",
                format: "TV",
                startDate: { year: 2023, month: 1, day: 1 },
              },
            },
          ])],
        },
      },
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await getAniListRelationSnapshots([10, 10, -1]);
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(request.body)) as {
      variables: { ids: number[] };
    };

    expect(body.variables.ids).toEqual([10]);
    expect(result).toHaveLength(1);
    expect(result[0].relations).toEqual([{
      id: 20,
      format: "TV",
      relationType: "SEQUEL",
      startDate: "2022-04-01",
    }]);
  });
});
