import { SidePanel } from "@/components/side-panel";
import { BrandProfileView } from "@/components/brand-profile-view";
import { getT } from "@/lib/i18n/server";

export default async function BrandProfilePanel({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const { id } = await params;
  return (
    <SidePanel label={t("screens.ui.brandProfile")} fullPageHref={`/dashboard/creator/discover/${id}`}>
      <BrandProfileView id={id} variant="panel" />
    </SidePanel>
  );
}
