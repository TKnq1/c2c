"use server";

import { auth } from "@/lib/auth";
import { writeLocaleCookie } from "@/lib/i18n/cookie";
import { parseLocale } from "@/lib/i18n/locales";
import { prisma } from "@/lib/prisma";

// The cookie is what the next render reads, so the server and the client
// agree. The account stores the same choice for the next sign-in.
export async function setLocaleAction(locale: string) {
  const next = parseLocale(locale);
  await writeLocaleCookie(next);
  const session = await auth();
  if (!session?.user?.id) return;
  await prisma.user.update({ where: { id: session.user.id }, data: { locale: next } });
}
