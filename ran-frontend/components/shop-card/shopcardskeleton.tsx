import { Card, CardContent, CardHeader } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

export function ShopCardSkeleton() {
  return (
    <Card className="h-[340px] flex flex-col">
      <CardHeader className="flex-grow">
        <Skeleton className="h-6 w-3/4 mb-2" /> {/* Title */}
        <Skeleton className="h-4 w-1/3" /> {/* Category */}
      </CardHeader>

      <CardContent className="mt-auto space-y-4">
        {/* Image placeholder */}
        <div className="flex justify-center">
          <Skeleton className="h-32 w-32 rounded-md" />
        </div>

        {/* Price & Button */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-16" /> {/* Price */}
            <Skeleton className="h-4 w-24" /> {/* Purchase Type */}
          </div>
          <Skeleton className="h-10 w-20 rounded-md" /> {/* Button */}
        </div>
      </CardContent>
    </Card>
  );
}
