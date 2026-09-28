import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  invert = false,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: { href: string; label: string };
  invert?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between",
        invert ? "border-paper/30" : "border-ink-200",
        className,
      )}
    >
      <div className="max-w-2xl">
        {eyebrow && (
          <p
            className={cn(
              "mb-2 font-mono text-[0.6rem] tracking-[0.28em] uppercase",
              invert ? "text-ember-300" : "text-ember-600",
            )}
          >
            {eyebrow}
          </p>
        )}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl">{title}</h2>
        {description && (
          <p
            className={cn(
              "mt-3 text-sm leading-relaxed sm:text-base",
              invert ? "opacity-70" : "text-ink-600",
            )}
          >
            {description}
          </p>
        )}
      </div>
      {action && (
        <Link
          href={action.href}
          className={cn("btn shrink-0", invert ? "btn-ghost-light" : "btn-ink")}
        >
          {action.label}
          <ArrowRight className="size-3.5" />
        </Link>
      )}
    </div>
  );
}
