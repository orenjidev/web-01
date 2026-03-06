"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShopIcon } from "./ShopIcon";

interface ShopItem {
  productNum: number;
  name: string;
  price: number;
  currency: string;
  iconUrl: string;
  iconType: "atlas" | "direct";
  iconMain: number;
  iconSub: number;
  stock: number;
  isBox: boolean;
}

export const ShopItemCard: React.FC<{ item: ShopItem }> = ({ item }) => {
  return (
    <Card className="w-40">
      <CardContent className="p-3 flex flex-col items-center gap-2">
        <div className="flex justify-center">
          <ShopIcon
            iconUrl={item.iconUrl}
            iconType={item.iconType}
            iconMain={item.iconMain}
            iconSub={item.iconSub}
          />
        </div>

        <div className="text-sm font-semibold text-center leading-snug">{item.name}</div>

        <div className="text-xs text-center text-muted-foreground">
          {item.price} {item.currency}
        </div>

        <Button size="sm" className="w-full h-7 text-xs">
          Buy
        </Button>
      </CardContent>
    </Card>
  );
};
