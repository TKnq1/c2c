// A notice's body is plain text: a line starting with "# " opens a section, the lines under it are its rows, an empty
// line ends it. Kept as text so it reads fine in a mail without HTML and can be stored in one column.
export type NoticeSection = { title: string | null; lines: string[] };

export function parseNoticeBody(body: string): NoticeSection[] {
  const sections: NoticeSection[] = [];
  let current: NoticeSection | null = null;
  for (const raw of body.split("\n")) {
    const line = raw.trimEnd();
    if (line.startsWith("# ")) {
      current = { title: line.slice(2).trim(), lines: [] };
      sections.push(current);
    } else if (line.trim() === "") {
      current = null;
    } else {
      if (!current) {
        current = { title: null, lines: [] };
        sections.push(current);
      }
      current.lines.push(line.trim());
    }
  }
  return sections;
}

export function formatNoticeBody(sections: { title?: string; lines: string[] }[]): string {
  return sections
    .filter((s) => s.lines.length > 0)
    .map((s) => [...(s.title ? [`# ${s.title}`] : []), ...s.lines].join("\n"))
    .join("\n\n");
}

export const NOTICE_KIND_LABEL = { DAILY: "Tagesbericht", WEEKLY: "Wochenbericht", URGENT: "Dringend" } as const;
