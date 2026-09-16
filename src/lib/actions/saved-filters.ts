"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SCOPE_PATHS: Record<string, string> = {
  "discover-creators": "/dashboard/startup/discover",
  "discover-brands": "/dashboard/creator/discover",
  "creator-feed": "/dashboard/creator",
};

export async function saveFilterAction(scope: string, name: string, query: string) {
  const session = await auth();
  if (!session) throw new Error("Not authorized.");

  const trimmed = name.trim();
  if (!trimmed) throw new Error("Please enter a name.");
  if (!query) throw new Error("No filters are set to save.");

  await prisma.savedFilter.create({
    data: { userId: session.user.id, scope, name: trimmed.slice(0, 60), query },
  });

  const path = SCOPE_PATHS[scope];
  if (path) revalidatePath(path);
}

export async function deleteSavedFilterAction(id: string) {
  const session = await auth();
  if (!session) throw new Error("Not authorized.");

  const filter = await prisma.savedFilter.findUnique({ where: { id } });
  if (!filter || filter.userId !== session.user.id) {
    throw new Error("This saved filter could not be found.");
  }

  await prisma.savedFilter.delete({ where: { id } });

  const path = SCOPE_PATHS[filter.scope];
  if (path) revalidatePath(path);
}
