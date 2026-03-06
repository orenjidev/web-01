import { Card, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

export function ShopCardSkeleton() {
  return (
    <Card className="flex flex-col overflow-hidden">
      <CardContent className="flex flex-col h-full p-0">
        {/* Icon area */}
        <div className="bg-muted/40 flex items-center justify-center py-6 px-4">
          <Skeleton className="h-16 w-16 rounded" />
        </div>

        {/* Info area */}
        <div className="flex flex-col gap-2 p-3">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-8" />
          </div>
          <Skeleton className="h-8 w-full rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}
