import { notFound } from "next/navigation";
import { SeasonManagementPage } from "@/components/anime/season-management-page";
import { getSeasonManagementData } from "@/lib/anime/season-management";
import {
  deleteManagedEntryAction,
  saveManagedEntryAction,
  syncAniListTrackingAction,
  updateManagedEntryProgressAction,
} from "./actions";

export default async function ManagedSeasonRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getSeasonManagementData(slug);
  if (!data) notFound();
  return (
    <SeasonManagementPage
      data={data}
      onDeleteEntry={deleteManagedEntryAction}
      onSaveEntry={saveManagedEntryAction}
      onSyncAniList={syncAniListTrackingAction}
      onUpdateProgress={updateManagedEntryProgressAction}
    />
  );
}
