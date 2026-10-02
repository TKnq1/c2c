import { CreatorProfileView } from "@/components/creator-profile-view";

export default async function CreatorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CreatorProfileView id={id} variant="page" />;
}
