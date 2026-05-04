import { Skeleton } from '@/components/ui/skeleton'

export default function GroupsLoading() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20 rounded-none" />
        ))}
      </div>
    </div>
  )
}
