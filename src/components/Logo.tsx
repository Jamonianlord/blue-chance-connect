export function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      className={
        "inline-flex items-center rounded-xl bg-[var(--brand-dark)] px-3 py-1.5 font-extrabold tracking-tight text-white shadow-sm " +
        className
      }
    >
      <span className="text-[var(--brand)] text-2xl leading-none">1</span>
      <span className="ml-0.5 text-xl leading-none text-white">chance</span>
    </span>
  );
}
