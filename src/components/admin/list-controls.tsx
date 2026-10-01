import Link from "next/link";
import { SearchInput } from "@/components/search-input";

type Params = Record<string, string | undefined>;

// Builds a list URL from the current filters, dropping empty values and
// resetting to page 1 unless a page is passed explicitly.
export function listHref(path: string, params: Params, changes: Params) {
  const merged: Params = { ...params, page: undefined, ...changes };
  const query = new URLSearchParams(
    Object.entries(merged).filter((entry): entry is [string, string] => !!entry[1]),
  ).toString();
  return query ? `${path}?${query}` : path;
}

// A row of filter chips, each a plain link so filters survive reloads and
// can be shared.
export function FilterTabs({
  path,
  params,
  name,
  options,
}: {
  path: string;
  params: Params;
  name: string;
  options: { value: string | undefined; label: string; count?: number }[];
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide md:flex-wrap md:overflow-visible" role="group">
      {options.map((o) => {
        const active = params[name] === o.value;
        return (
          <Link
            key={o.label}
            href={listHref(path, params, { [name]: o.value })}
            aria-current={active ? "true" : undefined}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm transition ${
              active ? "bg-ink font-medium text-paper" : "bg-fog text-neutral-700 hover:bg-ink/10 dark:text-neutral-300"
            }`}
          >
            {o.label}
            {o.count !== undefined && <span className="ml-1.5 tabular-nums opacity-60">{o.count}</span>}
          </Link>
        );
      })}
    </div>
  );
}

// GET form, so the search term lands in the URL like the filters do.
export function ListSearch({
  path,
  params,
  placeholder,
}: {
  path: string;
  params: Params;
  placeholder: string;
}) {
  return (
    <form action={path} method="get" role="search" className="w-full sm:max-w-xs">
      {Object.entries(params)
        .filter(([key, value]) => key !== "q" && key !== "page" && value)
        .map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
      <SearchInput name="q" defaultValue={params.q ?? ""} placeholder={placeholder} aria-label={placeholder} />
    </form>
  );
}

export function Pagination({
  path,
  params,
  page,
  pageSize,
  total,
}: {
  path: string;
  params: Params;
  page: number;
  pageSize: number;
  total: number;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages === 1) return null;
  const linkClass = "rounded-full bg-fog px-3 py-1.5 text-sm transition hover:bg-ink/10";

  return (
    <nav aria-label="Pages" className="flex items-center justify-between gap-3 text-sm">
      <span className="tabular-nums text-neutral-500 dark:text-neutral-400">
        Page {page} of {pages} · {total.toLocaleString("en-US")} total
      </span>
      <span className="flex gap-2">
        {page > 1 && (
          <Link href={listHref(path, params, { page: String(page - 1) })} className={linkClass}>
            Previous
          </Link>
        )}
        {page < pages && (
          <Link href={listHref(path, params, { page: String(page + 1) })} className={linkClass}>
            Next
          </Link>
        )}
      </span>
    </nav>
  );
}

// Reads ?page= safely: anything missing or malformed is page 1.
export function pageFrom(value: string | undefined) {
  const page = Number.parseInt(value ?? "", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

// Next's searchParams values can be arrays; the admin lists only ever use
// one value per key.
export function firstParams(searchParams: Record<string, string | string[] | undefined>): Params {
  return Object.fromEntries(
    Object.entries(searchParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
  );
}
