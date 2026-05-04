import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <Skeleton className="h-8 w-32" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24 rounded-none" />
        <Skeleton className="h-24 rounded-none" />
      </div>
      <Skeleton className="h-6 w-24" />
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-16 rounded-none" />
        ))}
      </div>
    </div>
  )
}
