"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ShopIcon } from "../shop/ShopIcon";
import { Package, ShoppingCart } from "lucide-react";

interface BoxItem {
  name: string;
  amount: number;
}

interface ShopCardProps {
  itemName: string;
  category: string;

  iconUrl: string;
  iconType: "atlas" | "direct";
  iconMain: number;
  iconSub: number;

  price: number;
  purchaseType: string;
  isPremium: boolean;
  stock: number;

  isBox: boolean;
  boxContent?: BoxItem[];

  cartQty: number;
  onPurchase?: () => void;
  onAddToCart?: () => void;
}

export default function ShopCard({
  itemName,
  category,
  iconUrl,
  iconType,
  iconMain,
  iconSub,
  price,
  purchaseType,
  isPremium,
  stock,
  isBox,
  boxContent,
  cartQty,
  onPurchase,
  onAddToCart,
}: ShopCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const outOfStock = stock <= 0;

  return (
    <>
      <Card className="flex flex-col overflow-hidden hover:ring-1 hover:ring-primary/30 transition-all">
        <CardContent className="flex flex-col h-full p-0">
          {/* Icon Area */}
          <div className="relative bg-muted/40 flex items-center justify-center py-8 px-4">
            <ShopIcon
              iconUrl={iconUrl}
              iconType={iconType}
              iconMain={iconMain}
              iconSub={iconSub}
              size={35}
            />

            {/* Price Badge */}
            <Badge
              className={`absolute top-2 right-2 text-xs font-bold ${
                isPremium
                  ? "bg-amber-500/90 text-white hover:bg-amber-500"
                  : "bg-sky-500/90 text-white hover:bg-sky-500"
              }`}
            >
              {price.toLocaleString()} {purchaseType}
            </Badge>

            {/* Category label */}
            <span className="absolute bottom-1.5 left-2 text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium">
              {category}
            </span>

            {/* Box indicator */}
            {isBox && boxContent && boxContent.length > 0 && (
              <TooltipProvider>
                <Tooltip delayDuration={200}>
                  <TooltipTrigger asChild>
                    <div className="absolute top-2 left-2 flex items-center gap-1 text-[10px] text-muted-foreground bg-background/80 rounded px-1.5 py-0.5 cursor-help">
                      <Package className="w-3 h-3" />
                      <span>Box</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-60">
                    <p className="font-semibold mb-1">Box Contents</p>
                    <ul className="space-y-0.5 text-xs">
                      {boxContent.map((item, i) => (
                        <li key={i} className="flex justify-between gap-3">
                          <span className="truncate">{item.name}</span>
                          <span className="shrink-0 font-mono">x{item.amount}</span>
                        </li>
                      ))}
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Cart quantity badge */}
            {cartQty > 0 && (
              <div className="absolute bottom-1.5 right-2 flex items-center gap-1 text-[10px] font-bold bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                <ShoppingCart className="w-3 h-3" />
                {cartQty}
              </div>
            )}
          </div>

          {/* Info + Actions */}
          <div className="flex flex-col gap-2 p-3 flex-1">
            {/* Name + Stock row */}
            <div className="flex items-start justify-between gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <h3 className="text-sm font-semibold leading-tight truncate">
                      {itemName}
                    </h3>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{itemName}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                x{stock}
              </span>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Two Buttons */}
            <div className="flex gap-1.5">
              <Button
                className="flex-1"
                size="sm"
                disabled={outOfStock}
                onClick={() => setConfirmOpen(true)}
              >
                {outOfStock ? "Out of Stock" : "Buy Now"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={outOfStock}
                onClick={onAddToCart}
                className="px-2.5"
              >
                <ShoppingCart className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Buy Now Confirmation */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Purchase</AlertDialogTitle>
            <AlertDialogDescription>
              Buy <span className="font-semibold text-foreground">{itemName}</span> for{" "}
              <span className={`font-bold ${isPremium ? "text-amber-500" : "text-sky-500"}`}>
                {price.toLocaleString()} {purchaseType}
              </span>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onPurchase?.();
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
