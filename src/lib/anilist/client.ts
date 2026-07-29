const ANILIST_ENDPOINT = "https://graphql.anilist.co";

export type AniListAnime = {
  id: number;
  idMal: number | null;
  title: string;
  nativeTitle: string | null;
  alternativeTitle: string | null;
  description: string;
  format: string | null;
  status: string | null;
  season: string | null;
  seasonYear: number | null;
  episodes: number | null;
  duration: number | null;
  averageScore: number | null;
  popularity: number;
  genres: string[];
  studios: string[];
  coverUrl: string;
  bannerUrl: string | null;
  sourceUrl: string;
  isAlreadyCatalogued?: boolean;
};

export type AniListFranchiseEntry = AniListAnime & {
  relationType: string;
  startDate: string | null;
};

export type AniListRelationSnapshot = {
  source: AniListFranchiseEntry;
  relations: Array<{
    id: number;
    format: string | null;
    relationType: string;
    startDate: string | null;
  }>;
};

export type AniListWatchLink = {
  provider: string;
  url: string;
  language: string | null;
  iconUrl: string | null;
  color: string | null;
};

export type AniListLibrarySignal = {
  id: number;
  status: string | null;
  nextEpisode: number | null;
  airingAt: number | null;
};

export type AniListCharacter = {
  id: number;
  name: string;
  role: string;
  imageUrl: string;
};

export type AniListEpisode = {
  title: string;
  thumbnailUrl: string;
  url: string;
};

export type AniListRelatedAnime = {
  id: number;
  title: string;
  relation: string;
  coverUrl: string;
  score: number | null;
};

export type AniListAnimeDetails = AniListAnime & {
  characters: AniListCharacter[];
  episodesList: AniListEpisode[];
  related: AniListRelatedAnime[];
  recommendations: AniListRelatedAnime[];
  watchLinks: AniListWatchLink[];
};

type AniListSearchOptions = {
  query: string;
  page?: number;
  perPage?: number;
  format?: string;
  seasonYear?: number;
};

type AniListMediaPayload = {
  id: number;
  idMal?: number | null;
  title: { romaji?: string | null; english?: string | null; native?: string | null };
  description?: string | null;
  format?: string | null;
  status?: string | null;
  season?: string | null;
  seasonYear?: number | null;
  episodes?: number | null;
  duration?: number | null;
  averageScore?: number | null;
  popularity?: number | null;
  genres?: string[];
  siteUrl?: string | null;
  coverImage?: { extraLarge?: string | null; large?: string | null };
  bannerImage?: string | null;
  studios?: { nodes?: Array<{ name?: string | null }> };
  startDate?: { year?: number | null; month?: number | null; day?: number | null };
  relations?: {
    edges?: Array<{
      relationType?: string | null;
      node?: AniListMediaPayload | null;
    }>;
  };
  externalLinks?: Array<{
    site?: string | null;
    url?: string | null;
    type?: string | null;
    language?: string | null;
    icon?: string | null;
    color?: string | null;
    isDisabled?: boolean | null;
  }> | null;
  nextAiringEpisode?: {
    episode?: number | null;
    airingAt?: number | null;
  } | null;
};

function searchQuery(includeFormat: boolean, includeYear: boolean) {
  const variableDefinitions = [
    "$search: String!",
    "$page: Int!",
    "$perPage: Int!",
    ...(includeFormat ? ["$format: MediaFormat!"] : []),
    ...(includeYear ? ["$seasonYear: Int!"] : []),
  ];
  const mediaArguments = [
    "search: $search",
    "type: ANIME",
    ...(includeFormat ? ["format: $format"] : []),
    ...(includeYear ? ["seasonYear: $seasonYear"] : []),
    "sort: SEARCH_MATCH",
  ];
  return `
  query SearchAnime(${variableDefinitions.join(", ")}) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        currentPage
        hasNextPage
        lastPage
        total
      }
      media(${mediaArguments.join(", ")}) {
        id
        idMal
        title { romaji english native }
        description(asHtml: false)
        format
        status
        season
        seasonYear
        episodes
        duration
        averageScore
        popularity
        genres
        siteUrl
        coverImage { extraLarge large }
        bannerImage
        studios(isMain: true) { nodes { name } }
      }
    }
  }
`;
}

const MEDIA_BY_ID_QUERY = `
  query AnimeById($id: Int!) {
    Media(id: $id, type: ANIME) {
      id
      idMal
      title { romaji english native }
      description(asHtml: false)
      format
      status
      season
      seasonYear
      episodes
      duration
      averageScore
      popularity
      genres
      siteUrl
      coverImage { extraLarge large }
      bannerImage
      studios(isMain: true) { nodes { name } }
    }
  }
`;

const MEDIA_DETAILS_QUERY = `
  query AnimeDetails($id: Int!) {
    Media(id: $id, type: ANIME) {
      id idMal title { romaji english native } description(asHtml: false)
      format status season seasonYear episodes duration averageScore popularity genres siteUrl
      coverImage { extraLarge large } bannerImage studios(isMain: true) { nodes { name } }
      characters(page: 1, perPage: 8, sort: [ROLE, RELEVANCE, ID]) {
        edges { role node { id name { full } image { large } } }
      }
      streamingEpisodes { title thumbnail url }
      externalLinks { site url type language icon color isDisabled }
      relations {
        edges {
          relationType(version: 2)
          node { id title { romaji english } averageScore coverImage { extraLarge large } }
        }
      }
      recommendations(page: 1, perPage: 8, sort: [RATING_DESC]) {
        nodes {
          mediaRecommendation { id title { romaji english } averageScore coverImage { extraLarge large } }
        }
      }
    }
  }
`;

const FRANCHISE_BATCH_QUERY = `
  query FranchiseBatch($ids: [Int!]!) {
    Page(page: 1, perPage: 50) {
      media(id_in: $ids, type: ANIME) {
        id
        idMal
        title { romaji english native }
        description(asHtml: false)
        format
        status
        season
        seasonYear
        episodes
        duration
        startDate { year month day }
        averageScore
        popularity
        genres
        siteUrl
        coverImage { extraLarge large }
        bannerImage
        studios(isMain: true) { nodes { name } }
        relations {
          edges {
            relationType(version: 2)
            node {
              id
              type
              format
              startDate { year month day }
            }
          }
        }
      }
    }
  }
`;

const MEDIA_BY_MAL_IDS_QUERY = `
  query AnimeByMalIds($ids: [Int]) {
    Page(page: 1, perPage: 50) {
      media(idMal_in: $ids, type: ANIME) {
        id
        idMal
        title { romaji english native }
        description(asHtml: false)
        format
        status
        season
        seasonYear
        episodes
        duration
        averageScore
        popularity
        genres
        siteUrl
        coverImage { extraLarge large }
        bannerImage
        studios(isMain: true) { nodes { name } }
      }
    }
  }
`;

const DISCOVER_QUERY = `
  query DiscoverAnime {
    trending: Page(page: 1, perPage: 24) {
      media(type: ANIME, isAdult: false, sort: [TRENDING_DESC, POPULARITY_DESC]) {
        id
        idMal
        title { romaji english native }
        description(asHtml: false)
        format
        status
        season
        seasonYear
        episodes
        duration
        averageScore
        popularity
        genres
        siteUrl
        coverImage { extraLarge large }
        bannerImage
        studios(isMain: true) { nodes { name } }
      }
    }
    popular: Page(page: 1, perPage: 24) {
      media(type: ANIME, isAdult: false, sort: [POPULARITY_DESC, SCORE_DESC]) {
        id
        idMal
        title { romaji english native }
        description(asHtml: false)
        format
        status
        season
        seasonYear
        episodes
        duration
        averageScore
        popularity
        genres
        siteUrl
        coverImage { extraLarge large }
        bannerImage
        studios(isMain: true) { nodes { name } }
      }
    }
  }
`;

const LIBRARY_SIGNALS_QUERY = `
  query LibrarySignals($ids: [Int!]!) {
    Page(page: 1, perPage: 50) {
      media(id_in: $ids, type: ANIME) {
        id
        status
        nextAiringEpisode { episode airingAt }
        externalLinks {
          site
          url
          type
          language
          icon
          color
          isDisabled
        }
      }
    }
  }
`;

const TRACKING_RELATIONS = new Set([
  "PREQUEL",
  "SEQUEL",
  "SIDE_STORY",
  "SPIN_OFF",
  "PARENT",
]);

const TRACKING_FORMATS = new Set(["TV", "TV_SHORT", "MOVIE", "OVA", "ONA", "SPECIAL"]);

function plainText(value: string | null | undefined) {
  return (value ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+\n/g, "\n")
    .trim();
}

function displayTitle(title: { english?: string | null; romaji?: string | null }) {
  return title.english?.trim() || title.romaji?.trim() || "Título sin nombre";
}

function mapMedia(media: AniListMediaPayload): AniListAnime {
  return {
    id: media.id,
    idMal: media.idMal ?? null,
    title: displayTitle(media.title),
    nativeTitle: media.title.native?.trim() || null,
    alternativeTitle: media.title.romaji?.trim() || null,
    description: plainText(media.description),
    format: media.format ?? null,
    status: media.status ?? null,
    season: media.season ?? null,
    seasonYear: media.seasonYear ?? null,
    episodes: media.episodes ?? null,
    duration: media.duration ?? null,
    averageScore: media.averageScore ?? null,
    popularity: media.popularity ?? 0,
    genres: media.genres ?? [],
    studios: media.studios?.nodes?.flatMap((studio) => studio.name ? [studio.name] : []) ?? [],
    coverUrl: media.coverImage?.extraLarge || media.coverImage?.large || "/images/anime-eclipse-cover-v2.png",
    bannerUrl: media.bannerImage ?? null,
    sourceUrl: media.siteUrl || `https://anilist.co/anime/${media.id}`,
  };
}

function isoStartDate(media: AniListMediaPayload) {
  const year = media.startDate?.year ?? media.seasonYear;
  if (!year) return null;
  const month = String(media.startDate?.month ?? 1).padStart(2, "0");
  const day = String(media.startDate?.day ?? 1).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function requestAniList<T>(query: string, variables: Record<string, unknown>) {
  const response = await fetch(ANILIST_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(response.status === 429 ? "ANILIST_RATE_LIMITED" : "ANILIST_UNAVAILABLE");
  }
  return response.json() as Promise<T>;
}

export async function getAniListAnimeById(id: number) {
  const payload = await requestAniList<{
    data?: { Media?: AniListMediaPayload | null };
    errors?: Array<{ message?: string }>;
  }>(MEDIA_BY_ID_QUERY, { id });
  if (payload.errors?.length || !payload.data?.Media) {
    throw new Error("ANILIST_MEDIA_NOT_FOUND");
  }
  return mapMedia(payload.data.Media);
}

export async function getAniListAnimeDetails(id: number): Promise<AniListAnimeDetails> {
  type DetailPayload = AniListMediaPayload & {
    characters?: { edges?: Array<{ role?: string | null; node?: { id: number; name?: { full?: string | null }; image?: { large?: string | null } } | null }> };
    streamingEpisodes?: Array<{ title?: string | null; thumbnail?: string | null; url?: string | null }> | null;
    recommendations?: { nodes?: Array<{ mediaRecommendation?: { id: number; title: { romaji?: string | null; english?: string | null }; averageScore?: number | null; coverImage?: { extraLarge?: string | null; large?: string | null } } | null }> };
  };
  const payload = await requestAniList<{ data?: { Media?: DetailPayload | null }; errors?: Array<{ message?: string }> }>(
    MEDIA_DETAILS_QUERY,
    { id },
  );
  const media = payload.data?.Media;
  if (payload.errors?.length || !media) throw new Error("ANILIST_MEDIA_DETAILS_NOT_FOUND");
  const base = mapMedia(media);
  const watchLinks = (media.externalLinks ?? [])
    .filter((link) => !link.isDisabled && link.type === "STREAMING" && link.site && link.url?.startsWith("https://"))
    .map((link) => ({
      provider: link.site!.trim(),
      url: link.url!,
      language: link.language?.trim() || null,
      iconUrl: link.icon?.startsWith("https://") ? link.icon : null,
      color: link.color?.trim() || null,
    }));
  const toRelated = (node: { id: number; title: { romaji?: string | null; english?: string | null }; averageScore?: number | null; coverImage?: { extraLarge?: string | null; large?: string | null } }, relation: string): AniListRelatedAnime => ({
    id: node.id,
    title: displayTitle(node.title),
    relation,
    coverUrl: node.coverImage?.extraLarge || node.coverImage?.large || "/images/anime-eclipse-cover-v2.png",
    score: node.averageScore ? node.averageScore / 10 : null,
  });
  return {
    ...base,
    characters: (media.characters?.edges ?? []).flatMap((edge) => edge.node ? [{
      id: edge.node.id,
      name: edge.node.name?.full || "Personaje",
      role: edge.role === "MAIN" ? "Principal" : "Secundario",
      imageUrl: edge.node.image?.large || base.coverUrl,
    }] : []),
    episodesList: (media.streamingEpisodes ?? []).flatMap((episode) => episode.url ? [{
      title: episode.title || "Episodio",
      thumbnailUrl: episode.thumbnail || base.bannerUrl || base.coverUrl,
      url: episode.url,
    }] : []),
    related: (media.relations?.edges ?? []).flatMap((edge) => edge.node ? [toRelated(edge.node, edge.relationType ?? "Relacionado")] : []),
    recommendations: (media.recommendations?.nodes ?? []).flatMap((entry) => entry.mediaRecommendation ? [toRelated(entry.mediaRecommendation, "Recomendado")] : []),
    watchLinks,
  };
}

export async function getAniListAnimeByMalIds(ids: number[]) {
  const uniqueIds = [...new Set(ids.filter((id) => Number.isInteger(id) && id > 0))];
  const results: AniListAnime[] = [];
  for (let index = 0; index < uniqueIds.length; index += 50) {
    const chunk = uniqueIds.slice(index, index + 50);
    const payload = await requestAniList<{
      data?: { Page?: { media?: AniListMediaPayload[] | null } | null };
      errors?: Array<{ message?: string }>;
    }>(MEDIA_BY_MAL_IDS_QUERY, { ids: chunk });
    if (payload.errors?.length) throw new Error("ANILIST_MAL_MATCH_FAILED");
    results.push(...(payload.data?.Page?.media ?? []).map(mapMedia));
  }
  return results;
}

export async function getAniListDiscoverCatalog() {
  const payload = await requestAniList<{
    data?: {
      trending?: { media?: AniListMediaPayload[] | null } | null;
      popular?: { media?: AniListMediaPayload[] | null } | null;
    };
    errors?: Array<{ message?: string }>;
  }>(DISCOVER_QUERY, {});
  if (payload.errors?.length || !payload.data) {
    throw new Error("ANILIST_DISCOVER_INVALID_RESPONSE");
  }
  return {
    trending: (payload.data.trending?.media ?? []).map(mapMedia),
    popular: (payload.data.popular?.media ?? []).map(mapMedia),
  };
}

export async function getAniListLibrarySignals(ids: number[]) {
  const uniqueIds = [...new Set(ids.filter((id) => Number.isInteger(id) && id > 0))];
  const signals = new Map<number, AniListLibrarySignal>();
  const watchLinks = new Map<number, AniListWatchLink[]>();
  for (let index = 0; index < uniqueIds.length; index += 50) {
    const chunk = uniqueIds.slice(index, index + 50);
    const payload = await requestAniList<{
      data?: { Page?: { media?: AniListMediaPayload[] | null } | null };
      errors?: Array<{ message?: string }>;
    }>(LIBRARY_SIGNALS_QUERY, { ids: chunk });
    if (payload.errors?.length) throw new Error("ANILIST_LIBRARY_SIGNALS_FAILED");
    for (const media of payload.data?.Page?.media ?? []) {
      signals.set(media.id, {
        id: media.id,
        status: media.status ?? null,
        nextEpisode: media.nextAiringEpisode?.episode ?? null,
        airingAt: media.nextAiringEpisode?.airingAt ?? null,
      });
      const links = (media.externalLinks ?? [])
        .filter((link) => (
          !link.isDisabled
          && link.type === "STREAMING"
          && Boolean(link.site?.trim())
          && Boolean(link.url?.startsWith("https://"))
        ))
        .map((link): AniListWatchLink => ({
          provider: link.site!.trim(),
          url: link.url!,
          language: link.language?.trim() || null,
          iconUrl: link.icon?.startsWith("https://") ? link.icon : null,
          color: link.color?.trim() || null,
        }))
        .filter((link, linkIndex, all) => (
          all.findIndex((candidate) => candidate.provider === link.provider) === linkIndex
        ));
      watchLinks.set(media.id, links);
    }
  }
  return { signals, watchLinks };
}

export async function getAniListRelationSnapshots(
  ids: number[],
): Promise<AniListRelationSnapshot[]> {
  const uniqueIds = [...new Set(ids.filter((id) => Number.isInteger(id) && id > 0))];
  const snapshots: AniListRelationSnapshot[] = [];

  for (let index = 0; index < uniqueIds.length; index += 50) {
    const chunk = uniqueIds.slice(index, index + 50);
    const payload = await requestAniList<{
      data?: { Page?: { media?: AniListMediaPayload[] | null } | null };
      errors?: Array<{ message?: string }>;
    }>(FRANCHISE_BATCH_QUERY, { ids: chunk });
    if (payload.errors?.length) throw new Error("ANILIST_RELATION_SNAPSHOT_FAILED");

    for (const media of payload.data?.Page?.media ?? []) {
      snapshots.push({
        source: {
          ...mapMedia(media),
          relationType: "PRIMARY",
          startDate: isoStartDate(media),
        },
        relations: (media.relations?.edges ?? []).flatMap((edge) => {
          const related = edge.node;
          const relationType = edge.relationType ?? "";
          if (
            !related
            || !TRACKING_RELATIONS.has(relationType)
            || !TRACKING_FORMATS.has(related.format ?? "")
          ) {
            return [];
          }
          return [{
            id: related.id,
            format: related.format ?? null,
            relationType,
            startDate: isoStartDate(related),
          }];
        }),
      });
    }
  }

  return snapshots;
}

export async function getAniListFranchiseById(id: number) {
  const queued = new Set([id]);
  const visited = new Set<number>();
  const relationById = new Map<number, string>([[id, "PRIMARY"]]);
  const mediaById = new Map<number, AniListMediaPayload>();

  for (let depth = 0; depth < 6 && queued.size > 0 && visited.size < 50; depth += 1) {
    const batch = [...queued].filter((mediaId) => !visited.has(mediaId)).slice(0, 50);
    batch.forEach((mediaId) => queued.delete(mediaId));
    if (batch.length === 0) break;
    const payload = await requestAniList<{
      data?: { Page?: { media?: AniListMediaPayload[] } };
      errors?: Array<{ message?: string }>;
    }>(FRANCHISE_BATCH_QUERY, { ids: batch });
    if (payload.errors?.length || !payload.data?.Page) {
      throw new Error("ANILIST_RELATIONS_INVALID_RESPONSE");
    }
    for (const media of payload.data.Page.media ?? []) {
      visited.add(media.id);
      mediaById.set(media.id, media);
      for (const edge of media.relations?.edges ?? []) {
        const related = edge.node;
        const relationType = edge.relationType ?? "";
        if (
          !related
          || !TRACKING_RELATIONS.has(relationType)
          || !TRACKING_FORMATS.has(related.format ?? "")
          || visited.has(related.id)
          || mediaById.has(related.id)
        ) continue;
        relationById.set(related.id, relationType);
        queued.add(related.id);
      }
    }
  }

  return [...mediaById.values()]
    .filter((media) => TRACKING_FORMATS.has(media.format ?? ""))
    .map((media): AniListFranchiseEntry => ({
      ...mapMedia(media),
      relationType: relationById.get(media.id) ?? "OTHER",
      startDate: isoStartDate(media),
    }))
    .sort((left, right) => {
      const leftDate = left.startDate ?? "9999-12-31";
      const rightDate = right.startDate ?? "9999-12-31";
      if (leftDate !== rightDate) return leftDate.localeCompare(rightDate);
      return left.id - right.id;
    });
}

export async function searchAniListAnime({
  format,
  page = 1,
  perPage = 6,
  query,
  seasonYear,
}: AniListSearchOptions) {
  const payload = await requestAniList<{
    data?: {
      Page?: {
        pageInfo?: {
          currentPage?: number;
          hasNextPage?: boolean;
          lastPage?: number;
          total?: number;
        };
        media?: AniListMediaPayload[];
      };
    };
    errors?: Array<{ message?: string }>;
  }>(searchQuery(Boolean(format), Boolean(seasonYear)), {
    search: query,
    page,
    perPage,
    ...(format ? { format } : {}),
    ...(seasonYear ? { seasonYear } : {}),
  });

  if (payload.errors?.length || !payload.data?.Page) {
    throw new Error("ANILIST_INVALID_RESPONSE");
  }

  const pageInfo = payload.data.Page.pageInfo ?? {};
  return {
    pageInfo: {
      currentPage: pageInfo.currentPage ?? page,
      hasNextPage: Boolean(pageInfo.hasNextPage),
      lastPage: pageInfo.lastPage ?? page,
      total: pageInfo.total ?? 0,
    },
    results: (payload.data.Page.media ?? []).map(mapMedia),
  };
}
