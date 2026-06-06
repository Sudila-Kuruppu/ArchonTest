"use client";

import { createContext, useContext, useRef, type ReactNode } from "react";
import { useStore } from "zustand";
import {
  type CartStore,
  type CartStoreApi,
  createCartStore,
} from "@/lib/store/cart";
import {
  type WishlistStore,
  type WishlistStoreApi,
  createWishlistStore,
} from "@/lib/store/wishlist";

/* ─── Cart Context ─── */
const CartStoreContext = createContext<CartStoreApi | undefined>(undefined);

/* ─── Wishlist Context ─── */
const WishlistStoreContext = createContext<WishlistStoreApi | undefined>(
  undefined,
);

/* ─── Combined Provider ─── */
export function StoreProvider({ children }: { children: ReactNode }) {
  const cartStoreRef = useRef<CartStoreApi>();
  if (!cartStoreRef.current) {
    cartStoreRef.current = createCartStore();
  }

  const wishlistStoreRef = useRef<WishlistStoreApi>();
  if (!wishlistStoreRef.current) {
    wishlistStoreRef.current = createWishlistStore();
  }

  return (
    <CartStoreContext.Provider value={cartStoreRef.current}>
      <WishlistStoreContext.Provider value={wishlistStoreRef.current}>
        {children}
      </WishlistStoreContext.Provider>
    </CartStoreContext.Provider>
  );
}

/* ─── Hooks ─── */

export function useCartStore<T>(selector: (store: CartStore) => T): T {
  const store = useContext(CartStoreContext);
  if (!store) {
    throw new Error("useCartStore must be used within StoreProvider");
  }
  return useStore(store, selector);
}

export function useWishlistStore<T>(selector: (store: WishlistStore) => T): T {
  const store = useContext(WishlistStoreContext);
  if (!store) {
    throw new Error("useWishlistStore must be used within StoreProvider");
  }
  return useStore(store, selector);
}
