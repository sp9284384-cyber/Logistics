import { cn } from "@/lib/utils";
import { STATUS_META } from "@/lib/constants";

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const meta =
    (STATUS_META as Record<string, { label: string; bg: string; text: string }>)[
      status
    ] || {
      label: status,
      bg: "bg-slate-100",
      text: "text-slate-700",
    };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        meta.bg,
        meta.text,
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {meta.label}
    </span>
  );
}
