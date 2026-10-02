import { BrandProfileView } from "@/components/brand-profile-view";

export default async function BrandProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BrandProfileView id={id} variant="page" />;
}
