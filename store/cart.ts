"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  slug: string;
  title: string;
  price: number;
  currency: string;
  image: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const exists = get().items.some((i) => i.productId === item.productId);
        if (exists) return;
        set({ items: [...get().items, item] });
      },
      removeItem: (productId) => {
        set({
          items: get().items.filter((i) => i.productId !== productId),
        });
      },
      clearCart: () => set({ items: [] }),
    }),
    {
      name: "codebazaar-cart-v1",
    }
  )
);
