// components/not-found-card.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Ban } from "lucide-react";

export default function NotFoundCard({
  title,
  message,
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div>
      <Card>
        <CardContent>
          <div className="flex flex-col items-center text-center m-4 space-y-2">
            <Ban height={65} width={65} />
            <h1 className="font-medium text-2xl">
              {title ? title : `Forbidden Access`}
            </h1>
            <p className="text-muted-foreground">
              {message ? message : `Login first to see content.`}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
