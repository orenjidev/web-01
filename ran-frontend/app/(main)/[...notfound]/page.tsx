"use client";

// app/[...notfound]/page.tsx
import NotFoundCard from "@/components/notfound";
import { useT } from "@/context/LanguageContext";

export default function CatchAllNotFound() {
  const t = useT();
  return (
    <div className="container mx-auto">
      <NotFoundCard
        title={t.notFound.pageTitle}
        message={t.notFound.pageMessage}
      />
    </div>
  );
}
