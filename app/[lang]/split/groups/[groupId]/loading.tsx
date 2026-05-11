import { Skeleton } from '@/components/ui/skeleton'

export default function GroupDetailLoading() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <Skeleton className="h-8 w-48" />
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-none" />)}
      </div>
      <Skeleton className="h-6 w-36" />
      <div className="flex flex-col gap-3">
        {[1, 2].map(i => <Skeleton key={i} className="h-12 rounded-none" />)}
      </div>
    </div>
  )
}
