import { prisma } from "@/lib/prisma";
import { parseUserAgent } from "@/lib/user-agent";
import { RelativeTime } from "@/components/relative-time";
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

  // "3 h ago", worked out in the viewer's own zone: formatted on the server
  // a sign-in came out in UTC, an hour or two off for anyone in Germany.
  return (
    <>
      {attempts.map((a) => (
        <SettingsRow
          key={a.id}
          label={parseUserAgent(a.userAgent)}
          hint={
            <>
              <RelativeTime ms={a.createdAt.getTime()} />
              {a.ipAddress ? ` · ${a.ipAddress}` : ""}
            </>
          }
        />
      ))}
    </>
  );
}
