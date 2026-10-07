import { SITE_URL } from "@/lib/site";
import { NOTICE_KIND_LABEL, parseNoticeBody } from "@/lib/admin-notice-format";
import type { Email } from "@/lib/email-templates";

const escapeHtml = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");

// The mail copy of a notice: plain and quick to read, no marketing frame. The text is escaped, the body comes from our
// own reports and never from user input, but names of requests do pass through it.
export function adminNoticeEmail(notice: { kind: keyof typeof NOTICE_KIND_LABEL; title: string; body: string; href?: string | null }): Email {
  const url = `${SITE_URL}${notice.href && notice.href.startsWith("/") ? notice.href : "/admin/mitteilungen"}`;
  const sections = parseNoticeBody(notice.body);
  const FONT = "Lato,Helvetica,Arial,sans-serif";
  const html = `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(notice.title)}</title></head>
<body style="margin:0;padding:0;background:#ffffff;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:28px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
<tr><td style="font-family:${FONT};font-size:12px;color:#6b6b6b;padding-bottom:6px;">comtor Admin · ${NOTICE_KIND_LABEL[notice.kind]}</td></tr>
<tr><td style="font-family:${FONT};font-size:26px;line-height:1.2;font-weight:900;color:#0a0a0a;padding-bottom:18px;">${escapeHtml(notice.title)}</td></tr>
${sections
  .map(
    (s) => `<tr><td style="padding-bottom:18px;">${
      s.title ? `<p style="margin:0 0 6px;font-family:${FONT};font-size:12px;font-weight:700;color:#6b6b6b;">${escapeHtml(s.title)}</p>` : ""
    }${s.lines.map((l) => `<p style="margin:0 0 4px;font-family:${FONT};font-size:15px;line-height:1.5;color:#1a1a1a;">${escapeHtml(l)}</p>`).join("")}</td></tr>`,
  )
  .join("\n")}
<tr><td style="padding-top:6px;"><a href="${escapeHtml(url)}" style="display:inline-block;background:#0a0a0a;color:#ffffff;font-family:${FONT};font-size:15px;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:999px;">Dashboard öffnen</a></td></tr>
<tr><td style="font-family:${FONT};font-size:12px;line-height:1.5;color:#6b6b6b;padding-top:22px;">Diese Mail ist eine Kopie der Mitteilung im Dashboard. Du kannst sie unter Anpassen ausschalten.</td></tr>
</table></td></tr></table></body></html>`;
  const text = [notice.title, "", ...sections.flatMap((s) => [...(s.title ? [s.title] : []), ...s.lines, ""]), `Dashboard: ${url}`, "", "Diese Mail ist eine Kopie der Mitteilung im Dashboard. Du kannst sie unter Anpassen ausschalten."].join("\n");
  return { subject: `${notice.kind === "URGENT" ? "Dringend: " : ""}${notice.title}`, html, text };
}
