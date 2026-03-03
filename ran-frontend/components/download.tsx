"use client";

import { useEffect, useState } from "react";
import { HardDrive } from "lucide-react";
import MaxWidthWrapper from "./maxwidthwrapper";
import { Button } from "./ui/button";
import Link from "next/link";

import { DownloadLink, getDownloadLinks } from "@/lib/data/download.data";
import { useT } from "@/context/LanguageContext";

const DownloadSection = () => {
  const [downloadlinks, setDownloadLinks] = useState<DownloadLink[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useT();

  useEffect(() => {
    let cancelled = false;

    const loadDownloads = async () => {
      try {
        const data = await getDownloadLinks();

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

  const visibleLinks = downloadlinks.filter(
    (link) => link.visible === true && link.download_type === "client",
  );

  return (
    <MaxWidthWrapper>
      <div className="relative pb-4">
        <h3>
          <span className="font-semibold text-base">{t.download.bannerTitle}</span>
          <span className="text-sm"> {t.download.bannerAction}</span>
        </h3>

        <div className="pt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <p className="text-sm text-muted-foreground col-span-full text-center">
              {t.download.loadingDownloads}
            </p>
          ) : visibleLinks.length === 0 ? (
            <p className="text-sm text-muted-foreground col-span-full text-center">
              {t.download.noDownloads}
            </p>
          ) : (
            visibleLinks.map((link, id) => (
              <Button
                key={id}
                className="h-12 w-full text-base flex items-center justify-center gap-2"
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
                  aria-label={`Download via ${link.download_title}`}
                >
                  <HardDrive className="w-5 h-5" />
                  <span>{link.download_title}</span>
                </Link>
              </Button>
            ))
          )}
        </div>
      </div>
    </MaxWidthWrapper>
  );
};

export default DownloadSection;
