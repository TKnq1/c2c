import type { InputHTMLAttributes } from "react";
import { FiSearch } from "react-icons/fi";

type Props = InputHTMLAttributes<HTMLInputElement> & { wrapperClassName?: string };

export function SearchInput({ className = "", wrapperClassName = "", ...props }: Props) {
  return (
    <div className={`relative ${wrapperClassName}`}>
      <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 dark:text-neutral-400" />
      <input
        type="search"
        {...props}
        className={`w-full rounded-[14px] border border-neutral-300 pl-9 pr-3 py-2 dark:border-neutral-700 ${className}`}
      />
    </div>
  );
}
