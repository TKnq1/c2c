import { SidePanel } from "@/components/side-panel";
import { CreatorProfileView } from "@/components/creator-profile-view";

export default async function CreatorProfilePanel({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <SidePanel label="Creator profile" fullPageHref={`/dashboard/startup/discover/${id}`}>
      <CreatorProfileView id={id} variant="panel" />
    </SidePanel>
  );
}
