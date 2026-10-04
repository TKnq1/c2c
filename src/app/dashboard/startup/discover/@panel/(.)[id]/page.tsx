import { SidePanel } from "@/components/side-panel";
import { CreatorProfileView } from "@/components/creator-profile-view";
import { getT } from "@/lib/i18n/server";

export default async function CreatorProfilePanel({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const { id } = await params;
  return (
    <SidePanel label={t("screens.ui.creatorProfile")} fullPageHref={`/dashboard/startup/discover/${id}`}>
      <CreatorProfileView id={id} variant="panel" />
    </SidePanel>
  );
}
