import * as React from "react";
import { cn } from "@asaselink/ui/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center text-foreground sm:p-12",
        className,
      )}
    >
      {icon && (
        <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">{title}</h3>
      <p className="mt-1.5 max-w-sm text-xs text-muted-foreground sm:text-sm text-balance">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
