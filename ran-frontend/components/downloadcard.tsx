"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { DownloadLink, getDownloadLinks } from "@/lib/data/download.data";
import { useT } from "@/context/LanguageContext";

/* =====================================================
   Component
===================================================== */
export default function DownloadCard() {
  const [downloadlinks, setDownloadLinks] = useState<DownloadLink[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useT();

  useEffect(() => {
    let cancelled = false;

    const loadDownloads = async () => {
      try {
        const data = await getDownloadLinks();
        console.log("[DOWNLOAD DATA]", data);

        if (!cancelled) {
          setDownloadLinks(data);
        }
      } catch (err) {
        console.error("[DOWNLOAD]", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDownloads();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.download.downloadLinks}</CardTitle>
        <CardDescription>{t.download.downloadLinksDesc}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center">
            {t.download.loadingDownloads}
          </p>
        ) : (
          Object.entries(
            downloadlinks
              .filter((link) => link.visible === true)
              .reduce(
                (acc, link) => {
                  const type = link.download_type || "other";
                  if (!acc[type]) acc[type] = [];
                  acc[type].push(link);
                  return acc;
                },
                {} as Record<string, typeof downloadlinks>,
              ),
          ).map(([type, links]) => (
            <div key={type} className="flex flex-col gap-3">
              {/* Type Header */}
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {type}
              </h4>

              {/* Links */}
              {links.map((link, id) => (
                <div key={id} className="flex flex-col gap-1">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 justify-center"
                    asChild
                  >
                    <Link
                      href={
                        link.download_address.startsWith("http")
                          ? link.download_address
                          : `https://${link.download_address}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="w-5 h-5" />
                      {link.download_title}
                    </Link>
                  </Button>

                  <p className="text-xs flex justify-end text-muted-foreground">
                    {`${t.download.lastModified} ${new Date(link.date).toLocaleDateString()}`}
                  </p>
                </div>
              ))}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
