"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { PriceType } from "@/lib/data/itemshop.data";

export interface CartItem {
  id: number;
  itemName: string;
  price: number;
  priceType: PriceType;
  quantity: number;
  stock: number;
  iconUrl: string;
  iconType: "atlas" | "direct";
  iconMain: number;
  iconSub: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, qty: number) => void;
  clear: () => void;
  totalEPoints: number;
  totalVPoints: number;
  itemCount: number;
  getItemQty: (id: number) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        if (existing.quantity >= item.stock) return prev;
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: number, qty: number) => {
    setItems((prev) => {
      if (qty <= 0) return prev.filter((i) => i.id !== id);
      return prev.map((i) =>
        i.id === id ? { ...i, quantity: Math.min(qty, i.stock) } : i,
      );
    });
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const getItemQty = useCallback(
    (id: number) => items.find((i) => i.id === id)?.quantity ?? 0,
    [items],
  );

  const totalEPoints = useMemo(
    () =>
      items
        .filter((i) => i.priceType === PriceType.Premium)
        .reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items],
  );

  const totalVPoints = useMemo(
    () =>
      items
        .filter((i) => i.priceType === PriceType.Vote)
        .reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items],
  );

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clear,
        totalEPoints,
        totalVPoints,
        itemCount,
        getItemQty,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
