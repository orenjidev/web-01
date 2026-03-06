"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from "@/components/ui/sheet";
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
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShopIcon } from "./ShopIcon";
import { useCart } from "@/context/CartContext";
import { purchaseCart, PriceType } from "@/lib/data/itemshop.data";
import { useAuth } from "@/context/AuthContext";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ePointsLabel: string;
  vPointsLabel: string;
  onPurchased?: () => void;
}

export default function CartDrawer({
  open,
  onOpenChange,
  ePointsLabel,
  vPointsLabel,
  onPurchased,
}: CartDrawerProps) {
  const { items, removeItem, updateQuantity, clear, totalEPoints, totalVPoints, itemCount } = useCart();
  const { refresh } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  const handleCheckout = async () => {
    setPurchasing(true);
    try {
      const cartItems = items.map((i) => ({
        productNum: i.id,
        quantity: i.quantity,
      }));

      const result = await purchaseCart(cartItems);
      toast.success(result.message || "Purchase successful!");
      clear();
      await refresh();
      onPurchased?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Purchase failed.");
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="flex flex-col w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Cart ({itemCount})
            </SheetTitle>
            <SheetDescription className="sr-only">Your shopping cart items</SheetDescription>
          </SheetHeader>

          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Your cart is empty
            </div>
          ) : (
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-3 py-2">
                {items.map((item) => {
                  const isPremium = item.priceType === PriceType.Premium;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-lg border border-border/50 p-2"
                    >
                      {/* Icon */}
                      <div className="shrink-0 bg-muted/40 rounded p-1.5">
                        <ShopIcon
                          iconUrl={item.iconUrl}
                          iconType={item.iconType}
                          iconMain={item.iconMain}
                          iconSub={item.iconSub}
                          size={35}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.itemName}</p>
                        <p className={`text-xs font-semibold ${isPremium ? "text-amber-500" : "text-sky-500"}`}>
                          {(item.price * item.quantity).toLocaleString()} {isPremium ? ePointsLabel : vPointsLabel}
                        </p>
                      </div>

                      {/* Quantity controls */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-7 text-center text-sm font-mono">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          disabled={item.quantity >= item.stock}
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>

                      {/* Remove */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          {items.length > 0 && (
            <SheetFooter className="flex-col gap-2 sm:flex-col border-t pt-3">
              {/* Totals */}
              <div className="w-full space-y-1 text-sm">
                {totalEPoints > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{ePointsLabel}</span>
                    <span className="font-semibold text-amber-500">
                      {totalEPoints.toLocaleString()}
                    </span>
                  </div>
                )}
                {totalVPoints > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{vPointsLabel}</span>
                    <span className="font-semibold text-sky-500">
                      {totalVPoints.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={clear}
                >
                  Clear
                </Button>
                <Button
                  className="flex-1"
                  disabled={purchasing}
                  onClick={() => setConfirmOpen(true)}
                >
                  {purchasing ? "Processing..." : "Checkout"}
                </Button>
              </div>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      {/* Checkout Confirmation */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Checkout</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>
                  Purchase {itemCount} item{itemCount !== 1 ? "s" : ""}?
                </p>
                <div className="mt-2 space-y-1 text-sm">
                  {totalEPoints > 0 && (
                    <p>
                      <span className="font-bold text-amber-500">
                        {totalEPoints.toLocaleString()}
                      </span>{" "}
                      {ePointsLabel}
                    </p>
                  )}
                  {totalVPoints > 0 && (
                    <p>
                      <span className="font-bold text-sky-500">
                        {totalVPoints.toLocaleString()}
                      </span>{" "}
                      {vPointsLabel}
                    </p>
                  )}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCheckout}>
              Confirm Purchase
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
