"use client";

import { useState } from "react";
import { IoClose } from "react-icons/io5";
import { addTags, removeTag, splitTags } from "@/lib/compliance/briefing-helpers";
import { inputClass } from "@/components/deals/ui";
import { useDealText } from "@/components/deals/use-deal-text";

// Hashtags or mentions as chips: type, press Enter (or space or comma), and the word becomes a chip with a cross. The form still
// holds them as one space-separated string, without the # or @, so nothing downstream changes.
export function TagInput({ value, onChange, prefix }: { value: string | undefined; onChange: (next: string) => void; prefix: "#" | "@" }) {
  const u = useDealText();
  const [draft, setDraft] = useState("");
  const tags = splitTags(value);

  const commit = () => {
    if (draft.trim() === "") return;
    onChange(addTags(value, draft));
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-2">
      {tags.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li key={tag} className="flex items-center gap-1 rounded-full bg-ink py-1 pr-1 pl-3 text-sm font-medium text-paper">
              {prefix}
              {tag}
              <button type="button" onClick={() => onChange(removeTag(value, tag))} aria-label={u("briefing.tags.remove", { tag: `${prefix}${tag}` })} className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-paper/20">
                <IoClose className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        value={draft}
        placeholder={u("briefing.tags.add")}
        onChange={(e) => {
          const next = e.target.value;
          // A space or a comma ends the word, like Enter does.
          if (/[\s,]$/.test(next) && next.trim() !== "") {
            onChange(addTags(value, next));
            setDraft("");
          } else {
            setDraft(next);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Backspace" && draft === "" && tags.length > 0) {
            onChange(removeTag(value, tags[tags.length - 1]));
          }
        }}
        onBlur={commit}
        className={inputClass}
      />
    </div>
  );
}
