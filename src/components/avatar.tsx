export function Avatar({ src, name, size = 40 }: { src: string | null; name: string; size?: number }) {
  if (src) {
    return (
      // Rendering user-uploaded data-URI images — next/image has nothing to
      // optimize here, so a plain img keeps this simple.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className="rounded-full object-cover border border-ink/10 bg-white shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center font-medium border border-ink/10 shrink-0 dark:bg-neutral-700 dark:text-neutral-400"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
