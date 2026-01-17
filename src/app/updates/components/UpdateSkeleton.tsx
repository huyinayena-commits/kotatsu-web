
import { Skeleton } from "@/components/ui/skeleton"

export function UpdateSkeleton() {
    return (
        <div className="rounded-xl overflow-hidden border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 flex gap-4 animate-pulse">
            {/* Cover Skeleton */}
            <div className="w-16 h-24 sm:w-20 sm:h-28 bg-[var(--bg-elevated)] rounded-lg flex-shrink-0" />

            {/* Content Skeleton */}
            <div className="flex-1 space-y-3 py-1">
                <div className="h-5 bg-[var(--bg-elevated)] rounded w-3/4" />
                <div className="flex gap-2">
                    <div className="h-4 bg-[var(--bg-elevated)] rounded w-20" />
                    <div className="h-4 bg-[var(--bg-elevated)] rounded w-16" />
                </div>
                <div className="h-4 bg-[var(--bg-elevated)] rounded w-1/2" />
                <div className="h-8 bg-[var(--bg-elevated)] rounded w-32 mt-2" />
            </div>
        </div>
    )
}
