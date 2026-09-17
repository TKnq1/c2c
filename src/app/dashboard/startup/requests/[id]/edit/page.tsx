import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RequestForm } from "@/components/request-form";

export default async function EditRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") redirect("/login");

  const [startup, request] = await Promise.all([
    prisma.startupProfile.findUniqueOrThrow({ where: { userId: session.user.id } }),
    prisma.request.findUnique({ where: { id } }),
  ]);
  if (!request || request.startupId !== startup.id) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-normal">Edit request</h1>
      <RequestForm
        requestId={request.id}
        initial={{
          title: request.title,
          description: request.description,
          niche: request.niche,
          languages: request.languages,
          productCategory: request.productCategory,
          minFollowers: request.minFollowers,
        }}
      />
    </div>
  );
}
