"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getNews, getNewsCategories, NewsItem } from "@/lib/data/news.data";
import { usePublicConfig } from "@/context/PublicConfigContext";
import { useT } from "@/context/LanguageContext";

// category → className only (labels come from translations)
function getCategoryClass(type: string): string {
  switch (type) {
    case "announcement": return "bg-blue-100 text-blue-800";
    case "patch":        return "bg-green-100 text-green-800";
    case "event":        return "bg-purple-100 text-purple-800";
    case "notice":       return "bg-yellow-100 text-yellow-800";
    default:             return "bg-gray-100 text-gray-800";
  }
}

export default function HomePage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const { config: publicConfig } = usePublicConfig();
  const t = useT();

  const filters = ["ALL", "ANNOUNCEMENT", "PATCH", "EVENT", "NOTICE"];
  const filterLabels: Record<string, string> = {
    ALL: t.home.categories.all,
    ANNOUNCEMENT: t.home.categories.announcement,
    PATCH: t.home.categories.patch,
    EVENT: t.home.categories.event,
    NOTICE: t.home.categories.notice,
  };
  const categoryLabels: Record<string, string> = {
    announcement: t.home.categories.announcement,
    patch: t.home.categories.patch,
    event: t.home.categories.event,
    notice: t.home.categories.notice,
  };
  const itemsPerPage = publicConfig?.gameoptions?.uihelper?.max_topnews ?? 5;

  // Load dummy data
  useEffect(() => {
    let cancelled = false;

    const loadNews = async () => {
      setLoading(true);
      try {
        const data = await getNews();
        if (!cancelled) {
          setNews(data);
        }
      } catch (err) {
        console.error("[NEWS PAGE]", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadNews();

    return () => {
      cancelled = true;
    };
  }, []);

  // Apply filter
  const filteredNews =
    selected === "ALL"
      ? news
      : news.filter((item) => item.category?.toUpperCase().trim() === selected);

  // Pagination logic
  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedNews = filteredNews.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="container mx-auto space-y-4">
      {/* Header */}
      <div></div>

      <Card>
        <CardHeader>
          <CardTitle>{t.home.latestNews}</CardTitle>
          <CardDescription>{t.home.subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-2 gap-2 mb-4 sm:grid-cols-5">
            {filters.map((filter) => (
              <Button
                key={filter}
                variant={selected === filter ? "default" : "outline"}
                onClick={() => { setSelected(filter); setCurrentPage(1); }}
                className="text-xs"
              >
                {filterLabels[filter] ?? filter}
              </Button>
            ))}
          </div>

          {/* News List */}
          {loading ? (
            <p className="text-center text-muted-foreground py-6 text-sm">
              {t.home.loadingNews}
            </p>
          ) : (
            <div className="space-y-4">
              {paginatedNews.length > 0 ? (
                paginatedNews.map((item) => (
                  <Link key={item.id} href={`/news/${item.id}`}>
                    <div className="p-4 border bg-gray-50 hover:bg-accent transition mb-2">
                      <div className="flex items-center justify-between">
                        <h2 className="font-semibold">{item.title}</h2>
                        <Badge className={getCategoryClass(item.category)}>
                          {categoryLabels[item.category] ?? t.home.categories.other}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t.home.byAuthor} {item.author} •{" "}
                        {new Date(item.published).toLocaleString()}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-6 text-sm">
                  {t.home.noNews}
                </p>
              )}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(currentPage - 1);
                      }}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(page);
                          }}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                  )}

                  {totalPages > 5 && <PaginationEllipsis />}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(currentPage + 1);
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
