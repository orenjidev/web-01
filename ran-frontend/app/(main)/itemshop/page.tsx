"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Ban } from "lucide-react";
import { toast } from "sonner";

import ShopCard from "@/components/shop-card/shopcard";
import { ShopCardSkeleton } from "@/components/shop-card/shopcardskeleton";
import { ComboboxDemo } from "@/components/reusable/combobox";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";

import { useAuth } from "@/context/AuthContext";
import { usePublicConfig } from "@/context/PublicConfigContext";
import {
  PriceType,
  ShopCategory,
  ShopItem,
  getCategory,
  getShopItemMap,
  purchaseShopItem,
} from "@/lib/data/itemshop.data";
import { Button } from "@/components/ui/button";
import PurchaseHistoryDialog from "@/components/shop/PurchaseHistoryDialog";

/* =====================================================
   Helpers
===================================================== */

function getPriceTypeLabel(priceType: PriceType): string {
  return priceType === PriceType.Premium ? "Premium Points" : "Vote Points";
}

/* =====================================================
   Page
===================================================== */

const ItemShopPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { config, loadingConfig } = usePublicConfig();

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [itemMap, setItemMap] = useState<Record<number, ShopItem[]>>({});
  const [selected, setSelected] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [historyOpen, setHistoryOpen] = useState(false);

  const shown = useRef(false);
  const pageSize = 9;
  const isAuthed = Boolean(user);

  /* -----------------------------------------------------
     Toast once
  ----------------------------------------------------- */

  useEffect(() => {
    if (!authLoading && !isAuthed && !shown.current) {
      toast.error("You must login first before you can view this page.");
      shown.current = true;
      router.replace("/login");
    }
  }, [authLoading, isAuthed]);

  /* -----------------------------------------------------
     Shop Loader (stable reference)
  ----------------------------------------------------- */

  const loadShop = useCallback(async () => {
    if (authLoading || !isAuthed || loadingConfig) return;
    if (config?.shop?.enabled === false) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const [cats, map] = await Promise.all([getCategory(), getShopItemMap()]);

      // Force new references explicitly
      setCategories([...cats]);
      setItemMap({ ...map });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load item shop.");
    } finally {
      setLoading(false);
    }
  }, [authLoading, isAuthed, config, loadingConfig]);

  /* -----------------------------------------------------
     Initial Load
  ----------------------------------------------------- */

  useEffect(() => {
    loadShop();
  }, [loadShop]);

  /* -----------------------------------------------------
     Reset pagination
  ----------------------------------------------------- */

  useEffect(() => {
    setCurrentPage(1);
  }, [selected]);

  /* -----------------------------------------------------
     Purchase Handler
  ----------------------------------------------------- */

  const handlePurchase = async (id: number) => {
    try {
      const result = await purchaseShopItem(id);

      if (!result.message) {
        toast.error(result.message || "Purchase failed");
        return;
      }

      toast.success(result.message || "Purchase successful");
      //await loadShop();

      // Seamless local stock update
      setItemMap((prev) => {
        const updated = { ...prev };

        for (const categoryNum in updated) {
          updated[categoryNum] = updated[categoryNum].map((item) =>
            item.id === id
              ? { ...item, stock: Math.max(item.stock - 1, 0) }
              : item,
          );
        }

        return updated;
      });
    } catch (err) {
      console.error(err);
      toast.error("Unexpected error occurred.");
    }
  };

  /* -----------------------------------------------------
     Loading Skeleton
  ----------------------------------------------------- */

  if (loading || authLoading) {
    return (
      <div className="container mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Item Shop</CardTitle>
            <CardDescription>
              Exclusive rewards, powerful items, and special offers await.
            </CardDescription>
          </CardHeader>
          <CardHeader>
            <div className="grid grid-cols-5 gap-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <ShopCardSkeleton key={i} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* -----------------------------------------------------
     Not Logged In
  ----------------------------------------------------- */

  if (!isAuthed) {
    return (
      <div className="container mx-auto">
        <Card>
          <CardContent>
            <div className="flex flex-col items-center text-center py-8 space-y-2">
              <Ban size={64} />
              <h1 className="text-2xl font-semibold">Forbidden Access</h1>
              <p className="text-muted-foreground">
                Login first to see content.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!loading && !loadingConfig && config?.shop?.enabled === false) {
    return (
      <div className="container mx-auto">
        <Card>
          <CardContent>
            <div className="flex flex-col items-center text-center py-8 space-y-2">
              <Ban size={64} />
              <h1 className="text-2xl font-semibold">Feature Unavailable</h1>
              <p className="text-muted-foreground">
                The item shop is currently disabled.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* -----------------------------------------------------
     Prepare Data
  ----------------------------------------------------- */

  const dropdownOptions = [
    { label: "ALL", value: "ALL" },
    ...categories.map((c) => ({
      label: `${c.categoryname} (${itemMap[c.categorynum]?.length ?? 0})`,
      value: c.categoryname,
    })),
  ];

  const allItems = Object.values(itemMap).flat();

  const selectedCategory = categories.find((c) => c.categoryname === selected);

  const filteredItems =
    selected === "ALL"
      ? allItems
      : selectedCategory
        ? itemMap[selectedCategory.categorynum] || []
        : [];

  const totalPages = Math.ceil(filteredItems.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;

  // Force fresh objects for rendering
  const paginatedItems = filteredItems
    .slice(startIndex, startIndex + pageSize)
    .map((item) => ({ ...item }));

  /* -----------------------------------------------------
     Render
  ----------------------------------------------------- */

  return (
    <div className="container mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Item Shop</CardTitle>
          <CardDescription>
            Exclusive rewards, powerful items, and special offers await.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="pb-4">
            <div className="flex justify-between">
              <Button onClick={() => setHistoryOpen(true)}>
                View Purchase History
              </Button>
              <ComboboxDemo
                options={dropdownOptions}
                value={selected}
                onChange={setSelected}
              />
            </div>
            <PurchaseHistoryDialog
              open={historyOpen}
              onOpenChange={setHistoryOpen}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedItems.length > 0 ? (
              paginatedItems.map((item, i) => (
                <ShopCard
                  key={`${i}`} // critical: include stock in key
                  itemName={item.itemName}
                  category={
                    categories.find((c) => c.categorynum === item.category)
                      ?.categoryname || "Unknown"
                  }
                  iconUrl={item.iconUrl}
                  iconType={item.iconType}
                  iconMain={item.iconMain}
                  iconSub={item.iconSub}
                  price={item.price}
                  purchaseType={getPriceTypeLabel(item.priceType)}
                  stock={item.stock}
                  isBox={item.isBox}
                  boxContent={item.boxContent}
                  onPurchase={() => handlePurchase(item.id)}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-10 text-muted-foreground">
                No items found in this category.
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage((p) => Math.max(p - 1, 1));
                    }}
                  />
                </PaginationItem>

                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === page}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(page);
                        }}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                {totalPages > 5 && <PaginationEllipsis />}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage((p) => Math.min(p + 1, totalPages));
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ItemShopPage;
