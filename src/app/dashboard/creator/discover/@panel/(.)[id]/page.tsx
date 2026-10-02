import { SidePanel } from "@/components/side-panel";
import { BrandProfileView } from "@/components/brand-profile-view";

export default async function BrandProfilePanel({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <SidePanel label="Brand profile" fullPageHref={`/dashboard/creator/discover/${id}`}>
      <BrandProfileView id={id} variant="panel" />
    </SidePanel>
  );
}
