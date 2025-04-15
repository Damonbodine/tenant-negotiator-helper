
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-3/4 bg-blue-400/10" />
        <Skeleton className="h-4 w-1/2 bg-blue-400/10" />
      </div>
      <Skeleton className="h-[200px] w-full bg-blue-400/10" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full bg-blue-400/10" />
        <Skeleton className="h-4 w-full bg-blue-400/10" />
        <Skeleton className="h-4 w-2/3 bg-blue-400/10" />
      </div>
    </div>
  );
}
