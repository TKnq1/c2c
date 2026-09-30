import { prisma } from "@/lib/prisma";
import { parseUserAgent } from "@/lib/user-agent";
import { LocalDate } from "@/components/local-date";
import { SettingsRow } from "@/components/settings-section";

export async function LoginActivity({ userId }: { userId: string }) {
  const attempts = await prisma.loginAttempt.findMany({
    where: { userId, succeeded: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  if (attempts.length === 0) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">No login history yet.</p>;
  }

  // Times in the viewer's own zone — formatted on the server they came out
  // in UTC, an hour or two off for anyone in Germany.
  return (
    <>
      {attempts.map((a) => (
        <SettingsRow
          key={a.id}
          label={parseUserAgent(a.userAgent)}
          hint={
            <>
              <LocalDate ms={a.createdAt.getTime()} withTime />
              {a.ipAddress ? ` · ${a.ipAddress}` : ""}
            </>
          }
        />
      ))}
    </>
  );
}
