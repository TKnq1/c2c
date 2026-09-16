import { prisma } from "@/lib/prisma";
import { parseUserAgent } from "@/lib/user-agent";

export async function LoginActivity({ userId }: { userId: string }) {
  const attempts = await prisma.loginAttempt.findMany({
    where: { userId, succeeded: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  if (attempts.length === 0) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">No login history yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {attempts.map((a) => (
        <div key={a.id} className="flex items-center justify-between gap-3 text-sm">
          <span className="text-neutral-700 dark:text-neutral-300">{parseUserAgent(a.userAgent)}</span>
          <span className="text-neutral-500 text-xs whitespace-nowrap dark:text-neutral-400">
            {a.createdAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
            {a.ipAddress ? ` · ${a.ipAddress}` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}
