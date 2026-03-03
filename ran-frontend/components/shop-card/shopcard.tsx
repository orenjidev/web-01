"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShopIcon } from "../shop/ShopIcon";
interface BoxItem {
  name: string;
  amount: number;
}

interface ShopCardProps {
  itemName: string;
  category: string; // ← ADD THIS

  iconUrl: string;
  iconType: "atlas" | "direct";
  iconMain: number;
  iconSub: number;

  price: number;
  purchaseType: string;
  stock: number;

  isBox: boolean;
  boxContent?: BoxItem[];

  onPurchase?: () => void;
}

export default function ShopCard({
  itemName,
  iconUrl,
  iconType,
  iconMain,
  iconSub,
  price,
  purchaseType,
  stock,
  isBox,
  boxContent,
  onPurchase,
}: ShopCardProps) {
  return (
    <Card className="flex flex-col overflow-visible">
      <CardContent className="flex flex-col h-full space-y-4">
        {/* HEADER */}
        <div className="flex justify-between gap-4">
          {/* LEFT */}
          <div className="flex gap-2">
            <div className="w-8.75 h-8.75 flex items-center justify-center shrink-0">
              <ShopIcon
                iconUrl={iconUrl}
                iconType={iconType}
                iconMain={iconMain}
                iconSub={iconSub}
                size={35}
              />
            </div>
            <div className="flex flex-col -translate-y-0.5">
              <h2 className="text-sm font-semibold leading-snug text-foreground">
                {itemName}
              </h2>

              <div className="text-sm font-semibold leading-snug text-foreground">
                {price} {purchaseType}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex flex-col -translate-y-0.5">
            <div className="text-xs text-muted-foreground self-start whitespace-nowrap">
              Stock: {stock}
            </div>
            {/* BOX CONTENT (ONLY IF BOX) */}
            {isBox && boxContent && boxContent.length > 0 && (
              <div className="relative group">
                {/* Trigger */}
                <div className="inline-flex items-center gap-1 text-xs text-muted-foreground cursor-pointer">
                  <span className="underline underline-offset-2">
                    View box contents
                  </span>
                  <span className="opacity-60">▾</span>
                </div>

                {/* Panel */}
                <div
                  className="
      absolute left-0 top-full mt-2
      hidden group-hover:block
      z-50
      w-60
      rounded-md
      bg-background
      border
      shadow-md
      p-3
      text-xs
    "
                >
                  <div className="mb-2 font-semibold text-foreground">
                    Box Contents
                  </div>

                  <ul className="space-y-1">
                    {boxContent.map((item, index) => (
                      <li
                        key={index}
                        className="flex justify-between text-muted-foreground"
                      >
                        <span className="truncate">{item.name}</span>
                        <span className="ml-2 shrink-0">x{item.amount}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PURCHASE BUTTON */}
        <Button onClick={onPurchase}>Purchase</Button>
      </CardContent>
    </Card>
  );
}
