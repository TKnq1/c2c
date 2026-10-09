import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { IoChevronBack } from "react-icons/io5";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/i18n/server";
import { BusinessForm } from "@/components/deals/business-form";
import { PageTitle } from "@/components/page-title";
import { cardClass } from "@/components/deals/ui";
import { dealLocale, issueMessage } from "@/lib/deals/copy";
import { hasErrors } from "@/lib/deals/issues";
import { uiText } from "@/lib/deals/ui-copy";
import { canUseDeals } from "@/lib/deals/queries";
import { businessReadiness } from "@/lib/tax/business";

export default async function BusinessPage() {
  const session = await auth();
  if (!session || (session.user.role !== "STARTUP" && session.user.role !== "CREATOR")) redirect("/login");
  const role = session.user.role;
  if (!(await canUseDeals(session.user.id, role))) notFound();
  const locale = dealLocale(await getLocale());
  const u = uiText(locale);

  const profile = await prisma.businessProfile.findUnique({ where: { userId: session.user.id } });
  // Nothing saved yet: the form starts with the name the account already has, so the first deal does not hang on a long form.
  const accountName = profile
    ? null
    : role === "STARTUP"
      ? (await prisma.startupProfile.findUnique({ where: { userId: session.user.id }, select: { companyName: true } }))?.companyName
      : (await prisma.creatorProfile.findUnique({ where: { userId: session.user.id }, select: { displayName: true } }))?.displayName;
  const issues = businessReadiness(profile, role);
  const complete = !hasErrors(issues);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 pb-8">
      <Link href="/dashboard/deals" className="inline-flex w-fit items-center gap-1 text-sm text-neutral-500 hover:text-ink dark:text-neutral-400">
        <IoChevronBack className="h-4 w-4" aria-hidden />
        {u("business.back")}
      </Link>
      <PageTitle description={u("business.description")}>{u("business.title")}</PageTitle>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">{u("business.why")}</p>

      {profile && (
        <div className={`${cardClass} text-sm`}>
          {complete ? (
            <p className="font-medium">✓ {u("business.ready")}</p>
          ) : (
            <>
              <p className="font-medium">{u("business.missing")}</p>
              <ul className="mt-1 flex flex-col gap-0.5">
                {issues
                  .filter((i) => i.severity === "error")
                  .map((i) => (
                    <li key={i.code + i.field}>✕ {issueMessage(i, locale)}</li>
                  ))}
              </ul>
            </>
          )}
        </div>
      )}

      <div className={cardClass}>
        <BusinessForm
          role={role}
          initial={{
            legalName: profile?.legalName ?? accountName ?? "",
            businessType: profile?.businessType ?? "",
            country: profile?.country ?? "DE",
            addressLine1: profile?.addressLine1 ?? "",
            addressLine2: profile?.addressLine2 ?? "",
            postalCode: profile?.postalCode ?? "",
            city: profile?.city ?? "",
            phone: profile?.phone ?? "",
            registerNumber: profile?.registerNumber ?? "",
            taxNumber: profile?.taxNumber ?? "",
            vatId: profile?.vatId ?? "",
            smallBusinessExempt: profile?.smallBusinessExempt ?? false,
            traderSelfCertified: profile?.traderSelfCertifiedAt != null,
            selfBillingAccepted: profile?.selfBillingAcceptedAt != null,
          }}
          vat={{
            status: profile?.vatId ? profile.vatIdStatus : "UNCHECKED",
            registeredName: profile?.vatIdRegisteredName ?? null,
            consultationNumber: profile?.vatIdConsultationNumber ?? null,
          }}
        />
      </div>
      {role === "CREATOR" && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {u("business.payout")} <Link href="/dashboard/creator/payments" className="underline">→</Link>
        </p>
      )}
    </div>
  );
}
