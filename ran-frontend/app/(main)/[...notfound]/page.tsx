// app/[...notfound]/page.tsx
import NotFoundCard from "@/components/notfound";

export default function CatchAllNotFound() {
  return (
    <div className="container mx-auto">
      <NotFoundCard
        title="Page Not Found"
        message="The page you are looking for doesn’t exist or has been moved."
      />
    </div>
  );
}
