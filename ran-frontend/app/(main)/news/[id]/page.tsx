// app/(main)/news/[id]/page.tsx

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSingleNews } from "@/lib/data/news.data";
import { notFound } from "next/navigation";

// Map type → label + color
function getCategoryStyle(type: string) {
  switch (type) {
    case "announcement":
      return {
        label: "Announcement",
        className: "bg-blue-500/15 text-blue-400 border-blue-500/20",
      };
    case "patch":
      return {
        label: "Patch",
        className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
      };
    case "event":
      return {
        label: "Event",
        className: "bg-purple-500/15 text-purple-400 border-purple-500/20",
      };
    case "notice":
      return {
        label: "Notice",
        className: "bg-amber-500/15 text-amber-400 border-amber-500/20",
      };
    default:
      return {
        label: "Other",
        className: "bg-muted text-muted-foreground border-border",
      };
  }
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const newsId = Number(id);

  if (!Number.isInteger(newsId)) {
    notFound();
  }

  const news = await getSingleNews(newsId);

  if (!news) {
    notFound();
  }

  const category = getCategoryStyle(news.category);

  return (
    <div className="space-y-4">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} />
        Back
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{news.title}</CardTitle>
            <Badge className={`${category.className} shrink-0`}>
              {category.label}
            </Badge>
          </div>
          <CardDescription>
            By {news.author} • {new Date(news.published).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="tiptap-editor"
            dangerouslySetInnerHTML={{ __html: news.content }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
