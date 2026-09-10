import { Skeleton } from '@/components/ui/Skeleton'

export function DashboardSkeleton() {
  return (
    <div className="px-4 py-5 sm:px-5 lg:px-7 lg:py-6 max-w-[1440px] mx-auto space-y-6">
      {/* Greeting Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-lg" />
          <Skeleton className="h-4 w-80 rounded-md" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl shrink-0" />
      </div>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 lg:gap-3.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm space-y-2">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-6 w-10 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(280px,320px)] gap-4 lg:gap-5">
        <div className="space-y-4 min-w-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 h-56">
              <Skeleton className="h-5 w-40 rounded" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 h-56">
              <Skeleton className="h-5 w-36 rounded" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-6 w-3/4 rounded" />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
            <Skeleton className="h-5 w-48 rounded" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        </div>

        <div className="space-y-4 min-w-0">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
            <Skeleton className="h-5 w-28 rounded" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
            <Skeleton className="h-5 w-32 rounded" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
