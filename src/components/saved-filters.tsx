"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { FiX } from "react-icons/fi";
import { saveFilterAction, deleteSavedFilterAction } from "@/lib/actions/saved-filters";
import { toast } from "@/lib/toast";

type SavedFilter = { id: string; name: string; query: string };

export function SavedFilters({ scope, savedFilters }: { scope: string; savedFilters: SavedFilter[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);
  const currentQuery = searchParams.toString();

  async function handleSave() {
    let name: string | null;
    try {
      name = window.prompt("Name this filter:");
    } catch {
      // Some embedded/sandboxed contexts don't support window.prompt at all.
      toast.error("Can't prompt for a name here.");
      return;
    }
    if (!name || !name.trim()) return;
    setSaving(true);
    try {
      await saveFilterAction(scope, name, currentQuery);
      toast.success("Filter saved.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteSavedFilterAction(id);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (savedFilters.length === 0 && !currentQuery) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {savedFilters.map((f) => (
        <span
          key={f.id}
          className="flex items-center gap-1.5 rounded border border-neutral-300 pl-3 pr-1.5 py-1 text-xs dark:border-neutral-700"
        >
          <Link href={f.query ? `${pathname}?${f.query}` : pathname} className="hover:underline">
            {f.name}
          </Link>
          <button
            type="button"
            onClick={() => handleDelete(f.id)}
            aria-label={`Delete saved filter "${f.name}"`}
            className="text-neutral-400 hover:text-ink transition dark:text-neutral-500"
          >
            <FiX className="h-3 w-3" />
          </button>
        </span>
      ))}
      {currentQuery && (
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="text-xs text-neutral-500 hover:text-neutral-900 transition disabled:opacity-50 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          + Save current filters
        </button>
      )}
    </div>
  );
}
