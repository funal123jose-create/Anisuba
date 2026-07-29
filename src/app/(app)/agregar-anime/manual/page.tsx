import { ManualAnimePage } from "@/components/anime/manual-anime-page";
import {
  submitManualAnimeAction,
  withdrawCatalogSubmissionAction,
} from "@/app/(app)/agregar-anime/manual/actions";
import { getManualAnimePageData } from "@/lib/anime/manual-drafts";

export default async function ManualAnimeRoute({
  searchParams,
}: {
  searchParams: Promise<{
    draft?: string;
    duplicado?: "register" | "review";
    guardado?: string;
    revision?: string;
    retiro?: string;
  }>;
}) {
  const { draft, duplicado, guardado, revision, retiro } = await searchParams;
  const pageData = await getManualAnimePageData(draft, Boolean(duplicado));
  const notice = guardado === "ok"
    ? "Borrador guardado de forma segura."
    : revision === "ok"
      ? "Catálogo enviado a revisión."
      : retiro === "ok"
        ? "La solicitud se retiró y el borrador vuelve a ser editable."
        : retiro === "error"
          ? "No pudimos retirar la solicitud de revisión."
          : undefined;

  return (
    <ManualAnimePage
      duplicateIntent={duplicado}
      duplicates={pageData.duplicates}
      drafts={pageData.drafts}
      initialValues={pageData.selected}
      key={pageData.selected?.franchiseId ?? "new"}
      notice={notice}
      submitAction={submitManualAnimeAction}
      withdrawAction={withdrawCatalogSubmissionAction}
    />
  );
}
