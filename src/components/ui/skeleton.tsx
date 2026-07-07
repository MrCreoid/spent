"use client";

/** Pulsing placeholder block */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-card-2 ${className}`}
      aria-hidden="true"
    />
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-card bg-card" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3.5 px-4 py-3">
          <Skeleton className="h-10 w-10 rounded-[12px]" />
          <div className="flex-1">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="mt-2 h-3 w-16" />
          </div>
          <Skeleton className="h-4 w-14" />
        </div>
      ))}
    </div>
  );
}
